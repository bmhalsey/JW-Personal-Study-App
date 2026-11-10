/* The Study Log's notifications.
   - Hearts and replies in groups are sent the moment they happen (Firestore triggers).
   - Reminders (daily text, Bible reading, planning next week, backups) are checked every
     15 minutes and go out at each person's chosen time, unless the thing is already done.
   Deploy: see README, "Groups and notifications". */
'use strict';
const {onDocumentWritten, onDocumentCreated, onDocumentUpdated} = require('firebase-functions/v2/firestore');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {setGlobalOptions, logger} = require('firebase-functions/v2');
const admin = require('firebase-admin');
const L = require('./logic');

admin.initializeApp();
const db = admin.firestore();
/* Must match where the Firestore database lives: us-central1 for nam5 (United States).
   For eur3 (Europe) use europe-west1; for a single region, use that region. */
const REGION = 'us-central1';
setGlobalOptions({region: REGION, maxInstances: 2, memory: '256MiB'});

const DEAD_TOKEN = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument'];

async function person(uid) {
  const s = await db.doc('people/' + uid).get();
  return s.exists ? s.data() : null;
}
/* send to every device a person turned notifications on for, and forget devices that are gone */
async function send(uid, p, msg) {
  p = p || await person(uid);
  const tokens = Object.entries((p && p.tokens) || {}).filter(([, t]) => t && t.token);
  if (!tokens.length) return 0;
  const res = await admin.messaging().sendEachForMulticast({
    tokens: tokens.map(([, t]) => t.token),
    data: {title: L.cut(msg.title, 80), body: L.cut(msg.body, 240), link: msg.link || './', tag: msg.tag || 'study-log'},
    webpush: {headers: {Urgency: 'high', TTL: String(msg.ttl || 6 * 3600)}}
  });
  const gone = {};
  res.responses.forEach((r, i) => {
    if (!r.success && r.error && DEAD_TOKEN.indexOf(r.error.code) >= 0) gone['tokens.' + tokens[i][0]] = admin.firestore.FieldValue.delete();
  });
  if (Object.keys(gone).length) await db.doc('people/' + uid).update(gone).catch(() => {});
  return res.successCount;
}
async function memberName(gid, uid) {
  const s = await db.doc('groups/' + gid + '/members/' + uid).get();
  return (s.exists && s.data().name) || 'Someone';
}
const feedLink = (gid, date) => './?group=' + encodeURIComponent(gid) + '&date=' + date;

/* a heart on your comment, or a new comment in your group (only if you asked for those) */
exports.postChanged = onDocumentWritten('groups/{gid}/posts/{pid}', async event => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after = event.data.after.exists ? event.data.after.data() : null;
  if (!after) return;
  const gid = event.params.gid;
  const g = (await db.doc('groups/' + gid).get()).data();
  if (!g) return;
  const members = g.members || [];
  const added = L.heartsAdded(before, after).filter(u => u !== after.uid && members.indexOf(u) >= 0);
  if (added.length && members.indexOf(after.uid) >= 0) {
    const p = await person(after.uid);
    if (L.allows(p, 'hearts')) {
      const who = L.names(await Promise.all(added.map(u => memberName(gid, u))));
      await send(after.uid, p, {title: g.name, body: who + ' loved your comment: "' + L.cut(after.text, 80) + '"',
        link: feedLink(gid, after.date), tag: 'hearts-' + event.params.pid});
    }
  }
  if (!before && after.kind === 'dt') {
    await Promise.all(members.filter(u => u !== after.uid).map(async u => {
      const p = await person(u);
      if (L.allows(p, 'groupPosts')) await send(u, p, {title: g.name, body: after.name + ': ' + L.cut(after.text, 160), link: feedLink(gid, after.date), tag: 'post-' + event.params.pid});
    }));
  }
});

/* a reply goes to whoever wrote the post and everyone else who replied to it */
exports.replyAdded = onDocumentCreated('groups/{gid}/replies/{rid}', async event => {
  const r = event.data && event.data.data();
  if (!r) return;
  const gid = event.params.gid;
  const g = (await db.doc('groups/' + gid).get()).data();
  if (!g) return;
  const earlier = (await db.collection('groups/' + gid + '/replies').where('postId', '==', r.postId).get()).docs
    .filter(d => d.id !== event.params.rid).map(d => d.data());
  const to = L.replyRecipients(r, earlier, g.members || []);
  await Promise.all(to.map(async u => {
    const p = await person(u);
    if (!L.allows(p, 'replies')) return;
    const yours = u === r.postUid;
    await send(u, p, {title: g.name, body: r.name + (yours ? ' replied to you: ' : ' also replied: ') + L.cut(r.text, 160),
      link: feedLink(gid, r.date), tag: 'reply-' + r.postId});
  }));
});

/* "Send a test notification" in Settings */
exports.testNotification = onDocumentUpdated('people/{uid}', async event => {
  const before = event.data.before.data() || {}, after = event.data.after.data() || {};
  if (!after.testAt || after.testAt === before.testAt) return;
  const n = await send(event.params.uid, after, {title: 'Study Log', body: 'Notifications are working on this device.', link: './', tag: 'test'});
  await event.data.after.ref.update({testResult: {at: Date.now(), sent: n}});
});

/* reminders, checked every 15 minutes */
exports.reminders = onSchedule({schedule: 'every 15 minutes', timeZone: 'Etc/UTC'}, async () => {
  const now = new Date();
  const people = await db.collection('people').get();
  for (const doc of people.docs) {
    const p = doc.data(), uid = doc.id;
    const due = L.dueReminders(p, now);
    for (const d of due) {
      try {
        const root = 'users/' + uid + '/app/tracker/';
        const [day, bible] = await Promise.all([db.doc(root + 'days/' + d.date).get(), db.doc(root + 'progress/bible').get()]);
        const ctx = {date: d.date, day: day.exists ? day.data() : {}, path: (bible.exists && bible.data().path) || 'whole'};
        if (d.kind === 'planWeek') ctx.nextWeek = (await db.doc(root + 'weeks/' + L.mondayOf(d.date, 1)).get()).data();
        if (d.kind === 'reading') ctx.week = (await db.doc(root + 'weeks/' + L.mondayOf(d.date, 0)).get()).data();
        if (d.kind === 'dailyText') {
          const y = (await db.doc(root + 'dailytext/' + d.date.slice(0, 4)).get()).data();
          ctx.dailyText = y && y.days && y.days[d.date];
        }
        if (!L.skipReminder(d.kind, ctx)) await send(uid, p, Object.assign(L.reminderMessage(d.kind, ctx), {ttl: 3 * 3600}));
        await doc.ref.update({['sent.' + d.kind]: d.date});
      } catch (e) {
        logger.warn('reminder failed', {kind: d.kind, error: String(e && e.message)});
      }
    }
  }
});
