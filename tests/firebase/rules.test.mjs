// Firestore security rules: who can see and change groups, posts and replies.
import {test, before, after, beforeEach} from 'node:test';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, arrayUnion, arrayRemove} from 'firebase/firestore';

let env;
const db = uid => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const CODE = 'K7MQ4RXA';

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-study-log',
    firestore: {rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')}
  });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

/* a group started by ann, with bob in it */
async function seed() {
  await env.withSecurityRulesDisabled(async ctx => {
    const f = ctx.firestore();
    await setDoc(doc(f, 'groups/g1'), {name: 'Family', owner: 'ann', members: ['ann', 'bob'], code: CODE, createdAt: 1});
    await setDoc(doc(f, 'codes/' + CODE), {gid: 'g1', name: 'Family'});
    await setDoc(doc(f, 'groups/g1/posts/2026-11-10_bob'), {uid: 'bob', name: 'Bob', date: '2026-11-10', kind: 'dt', text: 'Hi', updatedAt: 1});
  });
}

test('own notes are private', async () => {
  await assertSucceeds(setDoc(doc(db('ann'), 'users/ann/app/tracker/days/2026-11-10'), {a: 1}));
  await assertFails(getDoc(doc(db('bob'), 'users/ann/app/tracker/days/2026-11-10')));
  await assertFails(getDoc(doc(anon(), 'users/ann/app/tracker/days/2026-11-10')));
  await assertSucceeds(setDoc(doc(db('ann'), 'people/ann'), {name: 'Ann'}));
  await assertFails(getDoc(doc(db('bob'), 'people/ann')));
});

test('create a group with its code in one batch', async () => {
  const f = db('ann');
  const b = writeBatch(f);
  b.set(doc(f, 'groups/new1'), {name: 'Friends', owner: 'ann', members: ['ann'], code: 'ABCDEFGH', createdAt: 1});
  b.set(doc(f, 'codes/ABCDEFGH'), {gid: 'new1', name: 'Friends'});
  await assertSucceeds(b.commit());
  await assertSucceeds(setDoc(doc(f, 'groups/new1/members/ann'), {name: 'Ann', updatedAt: 1}));
  // cannot start a group in someone else's name, or with other people already in it
  await assertFails(setDoc(doc(db('bob'), 'groups/x'), {name: 'X', owner: 'ann', members: ['ann'], code: 'ABCDEFGJ', createdAt: 1}));
  await assertFails(setDoc(doc(db('bob'), 'groups/y'), {name: 'Y', owner: 'bob', members: ['bob', 'cat'], code: 'ABCDEFGK', createdAt: 1}));
  // a code must point at a group you own
  await assertFails(setDoc(doc(db('bob'), 'codes/ZZZZZZZZ'), {gid: 'new1', name: 'Friends'}));
});

test('outsiders cannot see a group', async () => {
  await seed();
  await assertFails(getDoc(doc(db('cat'), 'groups/g1')));
  await assertFails(getDoc(doc(db('cat'), 'groups/g1/posts/2026-11-10_bob')));
  await assertFails(getDocs(query(collection(db('cat'), 'groups'))));
  await assertSucceeds(getDocs(query(collection(db('cat'), 'groups'), where('members', 'array-contains', 'cat'))));
  await assertSucceeds(getDocs(query(collection(db('bob'), 'groups'), where('members', 'array-contains', 'bob'))));
  // codes can be looked up one at a time, not listed
  await assertSucceeds(getDoc(doc(db('cat'), 'codes/' + CODE)));
  await assertFails(getDocs(collection(db('cat'), 'codes')));
  await assertFails(getDoc(doc(anon(), 'codes/' + CODE)));
});

test('join with the right code only, and only yourself', async () => {
  await seed();
  await assertFails(updateDoc(doc(db('cat'), 'groups/g1'), {members: arrayUnion('cat'), lastJoin: 'WRONG123'}));
  await assertFails(updateDoc(doc(db('cat'), 'groups/g1'), {members: arrayUnion('cat', 'dan'), lastJoin: CODE}));
  await assertFails(updateDoc(doc(db('cat'), 'groups/g1'), {members: arrayUnion('cat'), lastJoin: CODE, name: 'Mine'}));
  await assertSucceeds(updateDoc(doc(db('cat'), 'groups/g1'), {members: arrayUnion('cat'), lastJoin: CODE}));
  await assertSucceeds(getDoc(doc(db('cat'), 'groups/g1')));
  await assertSucceeds(setDoc(doc(db('cat'), 'groups/g1/members/cat'), {name: 'Cat', streak: 3, updatedAt: 1}));
  await assertFails(setDoc(doc(db('cat'), 'groups/g1/members/bob'), {name: 'Not Bob', updatedAt: 1}));
});

test('a new code stops the old one working', async () => {
  await seed();
  const f = db('ann'), b = writeBatch(f);
  b.delete(doc(f, 'codes/' + CODE));
  b.update(doc(f, 'groups/g1'), {code: 'NEWCODE2'});
  b.set(doc(f, 'codes/NEWCODE2'), {gid: 'g1', name: 'Family'});
  await assertSucceeds(b.commit());
  await assertFails(updateDoc(doc(db('cat'), 'groups/g1'), {members: arrayUnion('cat'), lastJoin: CODE}));
  // only the owner can change the code
  await assertFails(updateDoc(doc(db('bob'), 'groups/g1'), {code: 'BOBSCODE'}));
});

test('leaving, removing people, and handing the group over', async () => {
  await seed();
  await assertFails(updateDoc(doc(db('bob'), 'groups/g1'), {members: arrayRemove('ann')}));
  await assertSucceeds(updateDoc(doc(db('bob'), 'groups/g1'), {members: arrayRemove('bob')}));
  await assertFails(getDoc(doc(db('bob'), 'groups/g1')));
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'groups/g1'), {members: ['ann', 'bob', 'cat']}));
  await assertSucceeds(updateDoc(doc(db('ann'), 'groups/g1'), {members: arrayRemove('cat')}));
  await assertFails(updateDoc(doc(db('ann'), 'groups/g1'), {members: arrayUnion('dan')}));
  await assertSucceeds(updateDoc(doc(db('ann'), 'groups/g1'), {owner: 'bob', members: ['bob']}));
  await assertFails(deleteDoc(doc(db('ann'), 'groups/g1')));
  await assertSucceeds(deleteDoc(doc(db('bob'), 'groups/g1')));
});

test('posts: write your own, heart anyone\'s, owner hides', async () => {
  await seed();
  const ann = db('ann'), bob = db('bob');
  await assertSucceeds(setDoc(doc(ann, 'groups/g1/posts/2026-11-10_ann'), {uid: 'ann', name: 'Ann', date: '2026-11-10', kind: 'dt', text: 'Keep my word.', updatedAt: 2}));
  await assertFails(setDoc(doc(bob, 'groups/g1/posts/2026-11-10_ann'), {uid: 'ann', name: 'Ann', date: '2026-11-10', kind: 'dt', text: 'fake', updatedAt: 2}, {merge: true}));
  await assertFails(setDoc(doc(bob, 'groups/g1/posts/2026-11-11_xyz'), {uid: 'bob', name: 'Bob', date: '2026-11-11', kind: 'dt', text: 'x', updatedAt: 2}));
  await assertFails(setDoc(doc(bob, 'groups/g1/posts/2026-11-11_bob'), {uid: 'bob', name: 'Bob', date: '2026-11-11', kind: 'dt', text: 'x', updatedAt: 2, hearts: ['bob', 'ann']}));
  await assertSucceeds(updateDoc(doc(bob, 'groups/g1/posts/2026-11-10_ann'), {hearts: arrayUnion('bob')}));
  await assertFails(updateDoc(doc(bob, 'groups/g1/posts/2026-11-10_ann'), {hearts: arrayUnion('cat')}));
  await assertFails(updateDoc(doc(bob, 'groups/g1/posts/2026-11-10_ann'), {text: 'changed'}));
  await assertSucceeds(updateDoc(doc(bob, 'groups/g1/posts/2026-11-10_ann'), {hearts: arrayRemove('bob')}));
  await assertSucceeds(setDoc(doc(ann, 'groups/g1/posts/2026-11-10_ann'), {uid: 'ann', name: 'Ann', date: '2026-11-10', kind: 'dt', text: 'Edited.', updatedAt: 3}, {merge: true}));
  await assertFails(updateDoc(doc(bob, 'groups/g1/posts/2026-11-10_ann'), {hidden: true}));
  await assertSucceeds(updateDoc(doc(ann, 'groups/g1/posts/2026-11-10_bob'), {hidden: true}));
  await assertFails(deleteDoc(doc(ann, 'groups/g1/posts/2026-11-10_bob')));
  await assertSucceeds(deleteDoc(doc(bob, 'groups/g1/posts/2026-11-10_bob')));
  await assertFails(getDoc(doc(db('cat'), 'groups/g1/posts/2026-11-10_ann')));
});

test('replies', async () => {
  await seed();
  const bob = db('bob'), ann = db('ann'), r = {uid: 'bob', name: 'Bob', text: 'Love that', at: 1, date: '2026-11-10', postId: '2026-11-10_ann', postUid: 'ann'};
  await assertSucceeds(setDoc(doc(bob, 'groups/g1/replies/r1'), r));
  await assertFails(setDoc(doc(bob, 'groups/g1/replies/r2'), Object.assign({}, r, {uid: 'ann'})));
  await assertFails(setDoc(doc(db('cat'), 'groups/g1/replies/r3'), Object.assign({}, r, {uid: 'cat'})));
  await assertFails(setDoc(doc(bob, 'groups/g1/replies/r4'), Object.assign({}, r, {text: ''})));
  await assertFails(updateDoc(doc(ann, 'groups/g1/replies/r1'), {text: 'edited by ann'}));
  await assertSucceeds(updateDoc(doc(bob, 'groups/g1/replies/r1'), {text: 'edited'}));
  await assertSucceeds(deleteDoc(doc(ann, 'groups/g1/replies/r1')));
});

test('weekly Meeting Workbook reading', async () => {
  await seed();
  await assertSucceeds(updateDoc(doc(db('bob'), 'groups/g1'), {weekly: {week: '2026-11-09', text: 'Isaiah 58-59', by: 'bob', name: 'Bob', at: 1}}));
  await assertFails(updateDoc(doc(db('bob'), 'groups/g1'), {weekly: {week: '2026-11-09', text: 'Isaiah 58-59', by: 'ann', name: 'Ann', at: 1}}));
  await assertFails(updateDoc(doc(db('cat'), 'groups/g1'), {weekly: {week: '2026-11-09', text: 'x', by: 'cat', name: 'Cat', at: 1}}));
});
