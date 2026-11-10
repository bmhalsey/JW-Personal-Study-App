/* Storage, optional sync, and optional AI help for the Study Log.
   Exposes window.DSL. Loaded before app.js. */
(function(){
'use strict';

/* ---------- settings (kept on this device only) ---------- */
const SKEY='dsl.settings.v1';
const settings={provider:'none',model:'',key:'',firebase:''};
try{Object.assign(settings,JSON.parse(localStorage.getItem(SKEY)||'{}'));}catch(e){}
function saveSettings(patch){
  Object.assign(settings,patch);
  try{localStorage.setItem(SKEY,JSON.stringify(settings));}catch(e){return false;}
  return true;
}

const state={configured:false,mode:'local',email:'',note:''};

/* ---------- local database: same shape as the sync database ---------- */
const PFX='dsl.doc:';
const LOCAL_ROOT='data/users/local/tracker';
const mem=new Map();
const subs=new Map();

function lsGet(k){
  try{return localStorage.getItem(k);}catch(e){return mem.has(k)?mem.get(k):null;}
}
function lsSet(k,v){
  localStorage.setItem(k,v);
}
function lsDel(k){
  localStorage.removeItem(k);
  mem.delete(k);
}
function allKeys(){
  const out=[];
  try{for(let i=0;i<localStorage.length;i++) out.push(localStorage.key(i));}
  catch(e){mem.forEach((v,k)=>out.push(k));}
  return out;
}
function listColl(path){
  const pre=PFX+path+'/';
  const out=[];
  allKeys().forEach(k=>{
    if(k&&k.indexOf(pre)===0){
      const rest=k.slice(pre.length);
      if(rest.indexOf('/')<0){
        try{out.push({id:rest,data:JSON.parse(lsGet(k))});}catch(e){}
      }
    }
  });
  return out;
}
function notify(path){
  const set=subs.get(path);
  if(set) Array.from(set).forEach(fn=>{try{fn();}catch(e){}});
}
function rand(){
  const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const a=new Uint8Array(20);
  crypto.getRandomValues(a);
  let s='';
  a.forEach(x=>{s+=c[x%62];});
  return s;
}
function collRef(path){
  return {
    doc(id){
      id=id||rand();
      const p=path+'/'+id;
      return {
        id:id,
        async set(v,opts){
          if(opts&&opts.merge){let old={};try{old=JSON.parse(lsGet(PFX+p)||'{}')||{};}catch(e){}v=Object.assign({},old,v);}
          lsSet(PFX+p,JSON.stringify(v));notify(path);
        },
        async delete(){lsDel(PFX+p);notify(path);},
        collection(n){return collRef(p+'/'+n);}
      };
    },
    orderBy(field,dir){
      const query={limit(n){
        return {onSnapshot(next){
          let alive=true;
          const run=()=>{
            if(!alive) return;
            const docs=listColl(path);
            docs.sort((a,b)=>{
              const x=a.data[field],y=b.data[field];
              const c=x<y?-1:x>y?1:0;
              return dir==='desc'?-c:c;
            });
            next({
              docs:docs.slice(0,n).map(d=>({id:d.id,data:()=>JSON.parse(JSON.stringify(d.data))})),
              metadata:{fromCache:false}
            });
          };
          if(!subs.has(path)) subs.set(path,new Set());
          subs.get(path).add(run);
          setTimeout(run,0);
          return ()=>{alive=false;subs.get(path).delete(run);};
        }};
      }};
      query.onSnapshot=(next)=>query.limit(Infinity).onSnapshot(next);
      return query;
    }
  };
}
const localRoot={collection:n=>collRef(LOCAL_ROOT+'/'+n)};
window.addEventListener('storage',e=>{
  if(e.key&&e.key.indexOf(PFX)===0){
    const p=e.key.slice(PFX.length);
    notify(p.slice(0,p.lastIndexOf('/')));
  }
});
function localDump(){
  const pre=PFX+LOCAL_ROOT+'/';
  const out=[];
  allKeys().forEach(k=>{
    if(k&&k.indexOf(pre)===0){
      const rest=k.slice(pre.length).split('/');
      if(rest.length===2){
        try{out.push({coll:rest[0],id:rest[1],data:JSON.parse(lsGet(k))});}catch(e){}
      }
    }
  });
  return out;
}

/* ---------- optional sync through the person's own Firebase project ---------- */
function withTimeout(p,ms){
  return new Promise((res,rej)=>{
    const t=setTimeout(()=>rej(new Error('timeout')),ms);
    p.then(v=>{clearTimeout(t);res(v);},e=>{clearTimeout(t);rej(e);});
  });
}
function loadScript(src){
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=src;s.onload=res;
    s.onerror=()=>rej(new Error('load failed'));
    document.head.append(s);
  });
}
async function loadFirebase(){
  if(window.firebase&&window.firebase.firestore&&window.firebase.auth) return;
  const base='https://www.gstatic.com/firebasejs/10.12.2/';
  await loadScript(base+'firebase-app-compat.js');
  await Promise.all([loadScript(base+'firebase-auth-compat.js'),loadScript(base+'firebase-firestore-compat.js')]);
}
/* This app's own Firebase project. These values only identify the project and are meant
   to be public; the Firestore rules keep each person's notes readable only by them. */
const BUILT_IN_FIREBASE='apiKey:"AIzaSyBnMtumBZwPh11LMoZeCyjDlU7Jr3_Ed4c",authDomain:"jw-personal-study-app.firebaseapp.com",projectId:"jw-personal-study-app",storageBucket:"jw-personal-study-app.firebasestorage.app",messagingSenderId:"528049186953",appId:"1:528049186953:web:dbae3f44402f792749fe58"';
/* a config pasted in Settings wins; otherwise the built-in one */
function fbConfigText(){return String(settings.firebase||'').trim()||BUILT_IN_FIREBASE;}
function parseFbConfig(text){
  const cfg={};
  String(text||'').replace(/["']?(\w+)["']?\s*:\s*["']([^"']*)["']/g,(m,k,v)=>{cfg[k]=v;return m;});
  return (cfg.apiKey&&cfg.projectId)?cfg:null;
}
async function loadMessaging(){
  if(window.firebase&&window.firebase.messaging) return;
  await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
}
async function fbInit(){
  const cfg=parseFbConfig(fbConfigText());
  if(!cfg) throw Object.assign(new Error('config'),{code:'bad_config'});
  await withTimeout(loadFirebase(),15000);
  if(!window.firebase.apps.length){
    window.firebase.initializeApp(cfg);
    /* automated tests point the app at the local Firebase emulators */
    const emu=lsGet('dsl.emulator');
    if(emu){window.firebase.auth().useEmulator('http://'+emu+':9099');window.firebase.firestore().useEmulator(emu,8080);}
  }
  return window.firebase;
}
// A durable outbox survives reloads, including when Firestore persistence is unavailable.
let outbox={},outboxKey='',cloudRoot=null,cloudBusy=false,cloudError='';
function readOutbox(){
  const saved=JSON.parse(localStorage.getItem(outboxKey)||'{}');
  if(!saved||Array.isArray(saved)||typeof saved!=='object')throw new Error('Cannot read pending changes.');
  return saved;
}
function saveOutbox(){localStorage.setItem(outboxKey,JSON.stringify(outbox));}
function syncEvent(){window.dispatchEvent(new CustomEvent('dsl-sync',{detail:syncStatus()}));}
function syncStatus(){return {pending:Object.keys(outbox).length,error:cloudError};}
async function sendOutbox(){
  if(cloudBusy||!cloudRoot||!navigator.onLine) return;
  cloudBusy=true;
  try{
    for(const key of Object.keys(outbox)){
      const item=outbox[key];
      if(!item)continue;
      const ref=cloudRoot.collection(item.coll).doc(item.id);
      try{
        if(item.data===null) await ref.delete();
        else if(item.merge) await ref.set(item.data,{merge:true});
        else await ref.set(item.data);
        // Another tab may have saved a newer revision or a different document.
        const saved=readOutbox();
        if(saved[key]&&saved[key].revision===item.revision){delete saved[key];}
        outbox=saved;saveOutbox();
        cloudError='';syncEvent();
      }catch(e){cloudError='Sync needs attention. Your changes are saved on this device. Retry or check your sign-in and connection.';syncEvent();break;}
    }
  }finally{cloudBusy=false;syncEvent();}
  if(!cloudError&&Object.keys(outbox).length&&navigator.onLine) setTimeout(sendOutbox,1000);
}
function wrapRoot(root){
  cloudRoot=root;
  return {
    collection(name){
      const c=root.collection(name);
      return {
        doc(id){
          const d=id?c.doc(id):c.doc();
          /* merge writes only send the parts that changed; two unsent merge writes combine */
          const write=async(data,opts)=>{
            outbox=readOutbox();
            const key=name+'/'+d.id,previous=outbox[key];
            let merge=!!(opts&&opts.merge)&&data!==null;
            if(merge&&previous&&previous.data){data=Object.assign({},previous.data,data);merge=!!previous.merge;}
            outbox[key]={coll:name,id:d.id,data,merge,revision:rand()};
            try{saveOutbox();}catch(e){if(previous) outbox[key]=previous;else delete outbox[key];throw e;}
            cloudError='';syncEvent();sendOutbox();
          };
          return {id:d.id,set:(data,opts)=>write(data,opts),delete:()=>write(null)};
        },
        orderBy:(f,dir)=>c.orderBy(f,dir)
      };
    }
  };
}
window.addEventListener('online',()=>{cloudError='';sendOutbox();});
window.addEventListener('storage',e=>{
  if(outboxKey&&e.key===outboxKey){
    try{outbox=readOutbox();syncEvent();sendOutbox();}catch(error){cloudError='Could not read pending changes. Check device storage.';syncEvent();}
  }
});
async function connectCloud(){
  const cfg=parseFbConfig(fbConfigText());
  const fb=await fbInit();
  const auth=fb.auth();
  const user=await withTimeout(new Promise(res=>{
    const un=auth.onAuthStateChanged(u=>{un();res(u);});
  }),15000);
  if(!user) throw Object.assign(new Error('signed_out'),{code:'signed_out'});
  const fs=fb.firestore();
  try{await fs.enablePersistence({synchronizeTabs:true});}catch(e){}
  state.email=user.email||'';
  state.uid=user.uid;state.fs=fs;
  outboxKey='dsl.outbox:'+cfg.projectId+':'+user.uid;
  try{outbox=readOutbox();}catch(e){throw new Error('Cannot read pending changes.');}
  const root=wrapRoot(fs.doc('users/'+user.uid+'/app/tracker'));
  sendOutbox();
  return {root,mode:'cloud',uid:user.uid};
}
async function cloudAuth(email,pw,create){
  const fb=await fbInit();
  const auth=fb.auth();
  if(create) await auth.createUserWithEmailAndPassword(email,pw);
  else await auth.signInWithEmailAndPassword(email,pw);
  saveSettings({signedIn:true});
}
async function cloudSignOut(){
  saveSettings({signedIn:false});
  const fb=await fbInit();
  await fb.auth().signOut();
}
function friendlyAuthError(e){
  const c=String((e&&e.code)||'');
  if(c==='bad_config') return 'Paste the Firebase config first, then save it.';
  if(c.indexOf('invalid-credential')>=0||c.indexOf('wrong-password')>=0||c.indexOf('user-not-found')>=0) return 'That email and password do not match an account.';
  if(c.indexOf('email-already-in-use')>=0) return 'That email already has an account. Use Sign in.';
  if(c.indexOf('weak-password')>=0) return 'Use a password with at least 6 characters.';
  if(c.indexOf('invalid-email')>=0) return 'That email address does not look right.';
  if(c.indexOf('operation-not-allowed')>=0) return 'Turn on Email/Password under Authentication in your Firebase project.';
  if(c.indexOf('unauthorized-domain')>=0) return 'Add this site under Authentication, Settings, Authorized domains in Firebase.';
  if(c.indexOf('network')>=0||(e&&e.message==='load failed')||(e&&e.message==='timeout')) return 'Could not reach Firebase. Check your connection and try again.';
  return 'Could not sign in. '+((e&&e.message)||'');
}

async function connect(){
  /* only reach out to Firebase on a device that has signed in, so the app opens instantly
     (and offline) everywhere else */
  state.configured=!!String(settings.firebase||'').trim()||!!settings.signedIn;
  state.builtIn=!String(settings.firebase||'').trim();
  if(state.configured){
    try{
      const c=await connectCloud();
      state.mode='cloud';
      return c;
    }catch(e){
      state.note=(e&&e.code==='signed_out')
        ?'Sync is set up, but you are signed out. Sign in under Settings. Until then, entries stay on this device only.'
        :'Could not reach the sync service. Entries you add now stay on this device only until it connects.';
    }
  }
  state.mode='local';
  try{if(navigator.storage&&navigator.storage.persist) navigator.storage.persist();}catch(e){}
  return {root:localRoot,mode:'local',uid:'local',note:state.note};
}

/* ---------- optional AI help: the person's own key, called straight from this device ---------- */
function parseLoose(t){
  t=String(t||'').replace(/```(?:json)?/gi,'').trim();
  try{return JSON.parse(t);}catch(e){}
  const a=t.indexOf('{'),b=t.lastIndexOf('}');
  if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}
  const c=t.indexOf('['),d=t.lastIndexOf(']');
  if(c>=0&&d>c){try{return JSON.parse(t.slice(c,d+1));}catch(e){}}
  return undefined;
}
function sample(){
  const s=Object.assign({},settings);
  if(!s.key||s.provider==='none') return null;
  async function call(input){
    const ctl=new AbortController();
    const t=setTimeout(()=>ctl.abort(),90000);
    try{
      let res;
      if(s.provider==='anthropic'){
        res=await fetch('https://api.anthropic.com/v1/messages',{
          method:'POST',signal:ctl.signal,
          headers:{'content-type':'application/json','x-api-key':s.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body:JSON.stringify({model:s.model||'claude-haiku-5-5',max_tokens:2048,messages:[{role:'user',content:input}]})
        });
      }else{
        if(!s.model) throw {code:'bad_model'};
        res=await fetch('https://api.openai.com/v1/chat/completions',{
          method:'POST',signal:ctl.signal,
          headers:{'content-type':'application/json','authorization':'Bearer '+s.key},
          body:JSON.stringify({model:s.model,messages:[{role:'user',content:input}]})
        });
      }
      if(!res.ok){
        let body=null;
        try{body=await res.json();}catch(e){}
        const m=(body&&body.error&&(body.error.message||body.error.type))||'';
        if(res.status===401||res.status===403) throw {code:'bad_key',message:m};
        if(res.status===429) throw {code:'rate_limited',message:m};
        if(res.status===404||(res.status===400&&/model/i.test(m))) throw {code:'bad_model',message:m};
        throw {code:'upstream_error',message:m||('Error '+res.status)};
      }
      const data=await res.json();
      if(s.provider==='anthropic') return (data.content||[]).map(c=>c.text||'').join('');
      return (data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
    }catch(e){
      if(e&&e.code) throw e;
      throw {code:'network'};
    }finally{
      clearTimeout(t);
    }
  }
  const f=async input=>({text:String(await call(input)).trim()});
  f.json=async input=>{
    const text=await call(input);
    const v=parseLoose(text);
    if(v===undefined) throw {code:'invalid_json',text:text};
    return v;
  };
  return f;
}

window.DSL={
  settings:settings,
  saveSettings:saveSettings,
  connect:connect,
  sample:sample,
  syncInfo:()=>({configured:state.configured,builtIn:!String(settings.firebase||'').trim(),mode:state.mode,email:state.email,note:state.note}),
  cloudAuth:cloudAuth,
  cloudSignOut:cloudSignOut,
  friendlyAuthError:friendlyAuthError,
  parseFbConfig:parseFbConfig,
  syncStatus:syncStatus,
  retrySync:()=>{cloudError='';sendOutbox();},
  outbox:()=>Object.values(outbox),
  localDump:localDump,
  /* groups and notifications talk to Firebase directly; null when not signed in */
  cloud:()=>state.mode==='cloud'&&state.fs?{fs:state.fs,uid:state.uid,email:state.email,firebase:window.firebase,
    projectId:(parseFbConfig(fbConfigText())||{}).projectId,builtIn:!String(settings.firebase||'').trim(),loadMessaging:loadMessaging}:null
};
})();
