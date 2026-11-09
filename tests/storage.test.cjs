// Run with node --test tests/storage.test.cjs. No external dependencies.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {webcrypto}=require('node:crypto');
const source=fs.readFileSync(__dirname+'/../adapters.js','utf8');
function fixture(store=new Map(),online=false){
  const requests=[],events=[],listeners={};
  store.set('dsl.settings.v1',JSON.stringify({firebase:'apiKey:"public",projectId:"test"'}));
  const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k),key:i=>[...store.keys()][i],get length(){return store.size;}};
  const root={collection:coll=>({doc:id=>({id:id||'new-note',set:(data,opts)=>new Promise((resolve,reject)=>requests.push({coll,id,data,opts,resolve,reject})),delete:()=>new Promise((resolve,reject)=>requests.push({coll,id,resolve,reject}))})})};
  const firestore=()=>({enablePersistence:async()=>{throw Error('unavailable');},doc:()=>root});
  const firebase={apps:[{}],auth:()=>({onAuthStateChanged:cb=>{setTimeout(()=>cb({uid:'user',email:'test@example.com'}),0);return ()=>{};}}),firestore};
  const window={firebase,addEventListener:(key,fn)=>listeners[key]=fn,dispatchEvent:e=>events.push(e.detail)};
  const context={window,localStorage,navigator:{onLine:online},crypto:webcrypto,Map,Set,Uint8Array,setTimeout,clearTimeout,CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}}};
  vm.runInNewContext(source,context);
  return {api:window.DSL,requests,events,listeners,store,context};
}
const tick=()=>new Promise(r=>setTimeout(r,20));
test('offline writes are durable across reloads; only acknowledged writes leave the outbox',async()=>{
  const a=fixture();const conn=await a.api.connect();assert.equal(conn.mode,'cloud');
  await conn.root.collection('notes').doc('first').set({title:'Offline note'});
  assert.equal(a.api.syncStatus().pending,1);assert.equal(a.requests.length,0);
  const b=fixture(a.store,true);await b.api.connect();assert.equal(b.requests.length,1);
  assert.equal(b.requests[0].data.title,'Offline note');assert.equal(b.api.syncStatus().pending,1);
  b.requests[0].resolve();await tick();assert.equal(b.api.syncStatus().pending,0);
});
test('newer edits stay queued when an older version is acknowledged',async()=>{
  const f=fixture(undefined,true);const {root}=await f.api.connect();
  const doc=root.collection('notes').doc('first');
  await doc.set({title:'First'});await doc.set({title:'Second'});
  f.requests[0].resolve();await tick();assert.equal(f.api.syncStatus().pending,1);
  assert.equal(f.api.outbox()[0].data.title,'Second');
  // Explicit retry also starts sending immediately without waiting for the next interval.
  f.api.retrySync();await tick();assert.equal(f.requests[1].data.title,'Second');
  f.requests[1].resolve();await tick();assert.equal(f.api.syncStatus().pending,0);
});
test('rejected cloud writes remain recoverable and can be retried',async()=>{
  const f=fixture(undefined,true);const {root}=await f.api.connect();
  await root.collection('notes').doc('first').set({title:'Keep me'});
  f.requests[0].reject(Error('permission denied'));await tick();
  assert.equal(f.api.syncStatus().pending,1);assert.match(f.api.syncStatus().error,/saved on this device/);
  f.api.retrySync();assert.equal(f.requests.length,2);f.requests[1].resolve();await tick();
  assert.equal(f.api.syncStatus().pending,0);assert.equal(f.api.syncStatus().error,'');
});
test('a local storage failure rejects a cloud edit rather than claiming it was saved',async()=>{
  const f=fixture();const {root}=await f.api.connect();
  f.context.localStorage.setItem=()=>{throw Error('storage full');};
  await assert.rejects(root.collection('notes').doc('first').set({title:'Unsaved'}),/storage full/);
  assert.equal(f.api.syncStatus().pending,0);
});

test('separate tabs preserve each other’s pending documents',async()=>{
  const a=fixture();const b=fixture(a.store);
  const ca=await a.api.connect(),cb=await b.api.connect();
  await ca.root.collection('notes').doc('a').set({title:'Tab A'});
  await cb.root.collection('notes').doc('b').set({title:'Tab B'});
  const restored=fixture(a.store);await restored.api.connect();
  assert.equal(restored.api.syncStatus().pending,2);
});

test('section edits from two devices are merged, not overwritten',async()=>{
  const f=fixture(undefined,false);const {root}=await f.api.connect();
  const day=root.collection('days').doc('2026-11-09');
  // phone changes Bible reading, then Daily text, before either is sent
  await day.set({date:'2026-11-09',bible:{note:'From the phone'}},{merge:true});
  await day.set({date:'2026-11-09',text:{note:'Also from the phone'}},{merge:true});
  const queued=f.api.outbox()[0];
  assert.equal(queued.merge,true);
  assert.equal(queued.data.bible.note,'From the phone');
  assert.equal(queued.data.text.note,'Also from the phone');
  // once online, it is sent as a merge so sections saved by another device are kept
  const g=fixture(f.store,true);await g.api.connect();
  assert.equal(g.requests.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(g.requests[0].opts)),{merge:true});
  assert.equal(g.requests[0].data.study,undefined);
});
test('a merge after a full save keeps the full save',async()=>{
  const f=fixture(undefined,false);const {root}=await f.api.connect();
  const day=root.collection('days').doc('2026-11-09');
  await day.set({date:'2026-11-09',text:{note:'a'},bible:{note:'b'}});
  await day.set({bible:{note:'c'}},{merge:true});
  const q=f.api.outbox()[0];
  assert.equal(q.merge,false);assert.equal(q.data.text.note,'a');assert.equal(q.data.bible.note,'c');
});
test('the on-device store merges sections too',async()=>{
  const store=new Map();
  const f=fixture(store,false);
  store.set('dsl.settings.v1','{}');
  const g=fixture(store,false);store.set('dsl.settings.v1','{}');
  const ctx=vm.createContext({window:{addEventListener(){},dispatchEvent(){}},localStorage:g.context.localStorage,navigator:{onLine:false},crypto:webcrypto,Map,Set,Uint8Array,setTimeout,clearTimeout,CustomEvent:class{}});
  vm.runInContext(source,ctx);
  const {root,mode}=await ctx.window.DSL.connect();assert.equal(mode,'local');
  const day=root.collection('days').doc('2026-11-09');
  await day.set({date:'2026-11-09',text:{note:'computer'}});
  await day.set({bible:{note:'phone'}},{merge:true});
  const saved=JSON.parse([...store.entries()].find(([k])=>k.endsWith('/days/2026-11-09'))[1]);
  assert.equal(saved.text.note,'computer');assert.equal(saved.bible.note,'phone');
});
