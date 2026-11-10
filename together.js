/* Groups for family and friends, and notifications. Loaded after app.js.
   Everything here talks to Firebase directly and needs you to be signed in.
   What is shared: daily text comments (on unless you turn them off), your progress (streak,
   whether today's daily text is done, your reading path) and, only if you turn it on, the
   one-line summary of your Bible reading. Nothing else ever leaves your own account. */
(function(){
'use strict';
const A=window.SLAPP;
if(!A) return;
const {el,svg,$,todayKey,keyOf,parseKey,addDays,nz,cut}=A;

const G={
  started:false,cloud:null,uid:'',me:{},meLoaded:false,
  groups:{},members:{},posts:{},replies:{},subs:{},
  view:{mode:'list',gid:null,date:todayKey()},
  form:null,msg:'',busy:false,invite:null,replyOpen:null,replyDraft:{},personOpen:null,shareOpen:false,
  sent:{},progressSent:{},loaded:false
};
const DAYS_BACK=21;
const COLORS=['#1D6B68','#8F5609','#3D5A80','#6B4E9B','#A23E48','#4C7A34','#7A5C2E','#2E6F95'];
const CODE_CHARS='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ICON_HEART='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
const ICON_PEOPLE='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="9" cy="9" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M14.5 15c2.6-.6 5 .8 6 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

/* ---------- small helpers ---------- */
const fs=()=>G.cloud.fs;
const FV=()=>G.cloud.firebase.firestore.FieldValue;
function lsGet(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v;}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function colorFor(uid){let h=0;for(const c of String(uid)) h=(h*31+c.charCodeAt(0))>>>0;return COLORS[h%COLORS.length];}
function initial(name){return (nz(name)[0]||'?').toUpperCase();}
function avatar(uid,name,cls){return el('span',{class:'av'+(cls?' '+cls:''),style:'background:'+colorFor(uid),'aria-hidden':'true',text:initial(name)});}
function myName(){return nz(G.me.name);}
function share(){const s=G.me.share||{};return {comments:s.comments!==false,progress:s.progress!==false,bible:s.bible===true};}
function groupOn(gid){return !((G.me.groupsOff||{})[gid]);}
function dayPrivate(k){return !!((G.me.privateDays||{})[k]);}
function newCode(){
  const a=new Uint8Array(8);crypto.getRandomValues(a);
  return Array.from(a,x=>CODE_CHARS[x%CODE_CHARS.length]).join('');
}
const showCode=c=>String(c||'').slice(0,4)+'-'+String(c||'').slice(4);
const cleanCode=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
function inviteLink(code){return location.origin+location.pathname.replace(/[^/]*$/,'')+'?join='+code;}
function fmtTime(ms){try{return new Date(ms).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});}catch(e){return '';}}
function fmtLong(k){return parseKey(k).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});}
function sortedGroups(){return Object.values(G.groups).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));}
function recentDays(n){const out=[];for(let i=0;i<n;i++) out.push(keyOf(addDays(new Date(),-i)));return out;}
function say(m){G.msg=m||'';render();}
function fail(e,what){
  const c=String((e&&e.code)||'');
  say(c.indexOf('permission')>=0?what+' was not allowed. If this keeps happening, the group may have changed. Try again.'
    :c.indexOf('unavailable')>=0?'Could not reach the server. Check your connection and try again.'
    :what+' did not work. '+((e&&e.message)||''));
}

/* ---------- start, and listening for changes ---------- */
function start(){
  if(G.started) return;
  G.started=true;
  G.cloud=(window.DSL&&window.DSL.cloud)?window.DSL.cloud():null;
  pickUpInvite();
  launchLink();
  if(!G.cloud){badge();if(A.tab()==='groups') render();return;}
  G.uid=G.cloud.uid;
  /* groups must never get in the way of the rest of the app */
  try{listenAll();}catch(e){G.loaded=true;G.meLoaded=true;G.msg='Groups could not start on this device.';console.warn('Groups could not start',e);}
  if(G.invite&&A.tab()!=='groups') A.setTab('groups');
}
function listenAll(){
  fs().doc('people/'+G.uid).onSnapshot(s=>{
    G.me=(s.exists&&s.data())||{};G.meLoaded=true;
    if(!s.metadata.hasPendingWrites){syncProgress();}
    if(!G.notifyReady){G.notifyReady=true;setupNotify();}
    if(G.me.testResult&&testAt&&G.me.testResult.at>testAt&&A.tab()==='settings'){const b=$('notifySection');if(b) b.replaceWith(notifySection());}
    refreshToday();render();
  },()=>{G.meLoaded=true;});
  fs().collection('groups').where('members','array-contains',G.uid).onSnapshot({includeMetadataChanges:true},snap=>{
    const next={};
    snap.docs.forEach(d=>{next[d.id]=Object.assign({id:d.id},d.data());});
    Object.keys(G.subs).forEach(gid=>{if(!next[gid]) stopGroup(gid);});
    /* wait until a group you just started has reached the server before listening inside it */
    Object.keys(next).forEach(gid=>{if(!G.subs[gid]&&!snap.docs.find(d=>d.id===gid).metadata.hasPendingWrites) watchGroup(gid);});
    const weeklyBefore=JSON.stringify(Object.values(G.groups).map(g=>g.weekly||null));
    G.groups=next;G.loaded=true;
    if(G.view.gid&&!G.groups[G.view.gid]) G.view={mode:'list',gid:null,date:todayKey()};
    if(JSON.stringify(Object.values(G.groups).map(g=>g.weekly||null))!==weeklyBefore) A.refreshPlan();
    syncProgress();refreshToday();render();badge();tryPendingOpen();
  },e=>{G.loaded=true;G.msg='Could not load your groups. '+((e&&e.message)||'');render();});
}
function watchGroup(gid){
  const since=keyOf(addDays(new Date(),-DAYS_BACK));
  const base=fs().collection('groups').doc(gid);
  G.members[gid]={};G.posts[gid]={};G.replies[gid]={};
  G.subs[gid]=[];
  /* a listener can be refused for a moment while a group you just started or joined is still
     saving; try again shortly while you are still in the group */
  const listen=(key,q,i,tries)=>{
    G.subs[gid][i]=q.onSnapshot(snap=>{
      const m={};snap.docs.forEach(d=>{m[d.id]=Object.assign({id:d.id},d.data());});
      G[key][gid]=m;render();badge();
    },()=>{setTimeout(()=>{if(G.subs[gid]&&G.groups[gid]&&tries<20) listen(key,q,i,tries+1);},1500*Math.min(1+tries,6));});
  };
  const on=(key,q)=>listen(key,q,G.subs[gid].length,0);
  on('members',base.collection('members'));
  on('posts',base.collection('posts').where('date','>=',since));
  on('replies',base.collection('replies').where('date','>=',since));
}
function stopGroup(gid){
  (G.subs[gid]||[]).forEach(u=>{try{u();}catch(e){}});
  delete G.subs[gid];delete G.members[gid];delete G.posts[gid];delete G.replies[gid];
}
function refreshToday(){const b=$('dtShare');if(b) paintShare(b,b.dataset.date||todayKey());}

/* ---------- invites: links look like …/?join=K7MQ4RXA ---------- */
function pickUpInvite(){
  try{
    const u=new URL(location.href),c=cleanCode(u.searchParams.get('join'));
    if(c.length===8){lsSet('sl.invite',c);u.searchParams.delete('join');history.replaceState(null,'',u.pathname+(u.search||'')+u.hash);}
  }catch(e){}
  const c=lsGet('sl.invite','');
  G.invite=c?{code:c,name:'',gid:'',checked:false}:null;
  if(G.invite&&!G.cloud) A.setTab('groups');
}
async function lookUpInvite(){
  const inv=G.invite;
  if(!inv||inv.checked||!G.cloud) return;
  inv.checked=true;
  try{
    const s=await fs().collection('codes').doc(inv.code).get();
    if(!s.exists){inv.bad=true;}
    else{inv.gid=s.data().gid;inv.name=s.data().name||'a group';if(G.groups[inv.gid]){clearInvite();openFeed(inv.gid);return;}}
  }catch(e){inv.bad=true;}
  render();
}
function clearInvite(){G.invite=null;lsSet('sl.invite','');}

/* ---------- create, join, leave ---------- */
async function saveName(name){
  name=cut(name,40);
  if(!name) return false;
  if(name!==myName()){G.me.name=name;await fs().doc('people/'+G.uid).set({name:name},{merge:true});}
  return true;
}
async function createGroup(gname,name){
  gname=cut(gname,60);
  if(!gname){say('Give the group a name first.');return;}
  if(!(await saveName(name))){say('Add your name first, so people know who you are.');return;}
  G.busy=true;say('Starting the group...');
  try{
    const ref=fs().collection('groups').doc(),code=newCode(),b=fs().batch();
    b.set(ref,{name:gname,owner:G.uid,members:[G.uid],code:code,createdAt:Date.now()});
    b.set(fs().collection('codes').doc(code),{gid:ref.id,name:gname});
    await b.commit();
    await writeMember(ref.id,true);
    G.form=null;G.busy=false;G.msg='';
    G.view={mode:'manage',gid:ref.id,date:todayKey()};
    render();
  }catch(e){G.busy=false;fail(e,'Starting the group');}
}
async function findCode(code){
  code=cleanCode(code);
  if(code.length!==8){say('A group code has 8 letters and numbers, like K7MQ-4RXA.');return null;}
  try{
    const s=await fs().collection('codes').doc(code).get();
    if(!s.exists){say("That code didn't work. Check it, or ask for a new one.");return null;}
    return {code:code,gid:s.data().gid,name:s.data().name||'the group'};
  }catch(e){fail(e,'Looking up the code');return null;}
}
async function joinGroup(found,name){
  if(!(await saveName(name))){say('Add your name first, so people know who you are.');return;}
  if(G.groups[found.gid]){clearInvite();openFeed(found.gid);return;}
  G.busy=true;say('Joining '+found.name+'...');
  try{
    await fs().collection('groups').doc(found.gid).update({members:FV().arrayUnion(G.uid),lastJoin:found.code});
    await writeMember(found.gid,true);
    clearInvite();G.form=null;G.busy=false;G.msg='';
    openFeed(found.gid);
  }catch(e){G.busy=false;fail(e,'Joining');}
}
async function leaveGroup(gid){
  const g=G.groups[gid];
  if(!g) return;
  const others=(g.members||[]).filter(u=>u!==G.uid);
  const owner=g.owner===G.uid;
  if(!confirm(owner&&!others.length?'You are the only one in '+g.name+'. Leaving deletes the group. Continue?'
    :'Leave '+g.name+'? Your comments are removed from it.')) return;
  try{
    const base=fs().collection('groups').doc(gid);
    const mine=Object.values(G.posts[gid]||{}).filter(p=>p.uid===G.uid);
    await Promise.all(mine.map(p=>base.collection('posts').doc(p.id).delete().catch(()=>{})));
    const b=fs().batch();
    b.delete(base.collection('members').doc(G.uid));
    if(owner&&!others.length){b.delete(fs().collection('codes').doc(g.code));b.delete(base);}
    else if(owner) b.update(base,{owner:others[0],members:others});
    else b.update(base,{members:FV().arrayRemove(G.uid)});
    await b.commit();
    G.view={mode:'list',gid:null,date:todayKey()};say('');
  }catch(e){fail(e,'Leaving');}
}
async function removePerson(gid,uid){
  const g=G.groups[gid],m=(G.members[gid]||{})[uid];
  if(!g||!confirm('Remove '+((m&&m.name)||'this person')+' from '+g.name+'?')) return;
  try{
    const base=fs().collection('groups').doc(gid),b=fs().batch();
    b.delete(base.collection('members').doc(uid));
    b.update(base,{members:FV().arrayRemove(uid)});
    await b.commit();
  }catch(e){fail(e,'Removing');}
}
async function makeNewCode(gid){
  const g=G.groups[gid];
  if(!g||!confirm('Make a new code? The old code and invite link stop working.')) return;
  try{
    const code=newCode(),b=fs().batch();
    b.delete(fs().collection('codes').doc(g.code));
    b.update(fs().collection('groups').doc(gid),{code:code});
    b.set(fs().collection('codes').doc(code),{gid:gid,name:g.name});
    await b.commit();
  }catch(e){fail(e,'Making a new code');}
}
async function renameGroup(gid,name){
  const g=G.groups[gid];name=cut(name,60);
  if(!g||!name||name===g.name) return;
  try{
    const b=fs().batch();
    b.update(fs().collection('groups').doc(gid),{name:name});
    b.update(fs().collection('codes').doc(g.code),{name:name});
    await b.commit();say('Saved.');
  }catch(e){fail(e,'Renaming');}
}

/* ---------- what you share ---------- */
let dayTimer=null,progTimer=null;
const dirtyDays=new Set();
function dayChanged(day){
  if(!G.cloud||!day) return;
  dirtyDays.add(day.date);
  clearTimeout(dayTimer);
  dayTimer=setTimeout(()=>{dirtyDays.forEach(syncShares);dirtyDays.clear();},1500);
  progressChanged();
}
function progressChanged(){
  if(!G.cloud) return;
  clearTimeout(progTimer);
  progTimer=setTimeout(syncProgress,2000);
}
/* daily text comment (and, if chosen, the Bible reading line) for one day, in each group */
function syncShares(k){
  if(!G.cloud||!G.meLoaded||!myName()) return;
  if(recentDays(8).indexOf(k)<0) return;
  const day=A.day(k),sh=share();
  const t=day&&day.text,b=day&&day.bible;
  sortedGroups().forEach(g=>{
    const on=groupOn(g.id)&&!dayPrivate(k);
    const want=[
      {id:k+'_'+G.uid,kind:'dt',text:on&&sh.comments?nz(t&&t.note):'',ref:t?nz(t.ref):''},
      {id:k+'_'+G.uid+'_b',kind:'bible',text:on&&sh.bible?nz(b&&b.line):'',ref:b?nz(b.ref):''}];
    want.forEach(w=>{
      const have=(G.posts[g.id]||{})[w.id],key=g.id+'/'+w.id;
      const sig=w.text?w.text+'|'+w.ref+'|'+myName():'';
      if(G.sent[key]===sig) return;
      if(!w.text&&!have&&G.sent[key]===undefined) return;
      if(have&&w.text&&have.text===w.text&&(have.ref||'')===w.ref&&have.name===myName()){G.sent[key]=sig;return;}
      G.sent[key]=sig;
      const ref=fs().collection('groups').doc(g.id).collection('posts').doc(w.id);
      (w.text?ref.set({uid:G.uid,name:myName(),date:k,kind:w.kind,text:w.text,ref:w.ref,updatedAt:Date.now()},{merge:true}):ref.delete())
        .catch(()=>{delete G.sent[key];});
    });
  });
}
function resyncAll(){recentDays(8).forEach(syncShares);syncProgress();}
function progressDoc(){
  const sh=share(),t=todayKey(),y=keyOf(addDays(new Date(),-1));
  const doneOn=(key)=>{const a=A.day(t),b=A.day(y);return a&&a[key]&&a[key].done?t:(b&&b[key]&&b[key].done?y:'');};
  const o={name:myName(),color:colorFor(G.uid),shares:sh.progress};
  if(sh.progress){
    const r=A.readInfo();
    Object.assign(o,{streak:A.streak('text'),dtDate:doneOn('text'),bibleDate:doneOn('bible'),path:r.label,read:r.read,total:r.total});
  }
  return o;
}
async function writeMember(gid,force){
  const o=progressDoc(),sig=JSON.stringify(o);
  if(!force&&G.progressSent[gid]===sig) return;
  G.progressSent[gid]=sig;
  try{await fs().collection('groups').doc(gid).collection('members').doc(G.uid).set(Object.assign(o,{updatedAt:Date.now()}));}
  catch(e){delete G.progressSent[gid];console.warn('Could not share progress',e&&e.code);}
}
function syncProgress(){
  if(!G.cloud||!G.meLoaded||!myName()) return;
  sortedGroups().forEach(g=>writeMember(g.id));
}
async function savePeople(patch){
  Object.keys(patch).forEach(k=>{
    if(patch[k]&&typeof patch[k]==='object'&&!Array.isArray(patch[k])) G.me[k]=Object.assign({},G.me[k]||{},patch[k]);
    else G.me[k]=patch[k];
  });
  try{await fs().doc('people/'+G.uid).set(patch,{merge:true});}catch(e){A.setStatus('Could not save that setting. Check your connection.','err');}
}
/* the week's Meeting Workbook reading, shared so one person enters it for everyone */
function weekly(wk){
  let best=null;
  sortedGroups().forEach(g=>{const w=g.weekly;if(w&&w.week===wk&&nz(w.text)&&(!best||(w.at||0)>(best.at||0))) best=w;});
  return best?{text:best.text,name:best.by===G.uid?'you':best.name,at:best.at}:null;
}
let weeklyTimer=null;
function shareWeekly(wk,text){
  if(!G.cloud||!text) return;
  clearTimeout(weeklyTimer);
  weeklyTimer=setTimeout(()=>{
    sortedGroups().forEach(g=>{
      if(g.weekly&&g.weekly.week===wk&&g.weekly.text===text) return;
      fs().collection('groups').doc(g.id).update({weekly:{week:wk,text:cut(text,80),by:G.uid,name:myName()||'Someone',at:Date.now()}}).catch(()=>{});
    });
  },1500);
}

/* ---------- hearts and replies ---------- */
async function toggleHeart(gid,p){
  const on=(p.hearts||[]).indexOf(G.uid)>=0;
  try{await fs().collection('groups').doc(gid).collection('posts').doc(p.id).update({hearts:on?FV().arrayRemove(G.uid):FV().arrayUnion(G.uid)});}
  catch(e){fail(e,'That');}
}
async function sendReply(gid,p,text){
  text=nz(text);
  if(!text) return;
  if(!myName()){say('Add your name under Settings, Groups and sharing, first.');return;}
  /* close the box straight away; the reply shows as soon as it is saved on this device */
  G.replyDraft[p.id]='';G.replyOpen=null;render();
  try{
    await fs().collection('groups').doc(gid).collection('replies').add({uid:G.uid,name:myName(),text:text.slice(0,2000),at:Date.now(),date:p.date,postId:p.id,postUid:p.uid});
  }catch(e){G.replyDraft[p.id]=text;G.replyOpen=p.id;fail(e,'Sending the reply');}
}
async function deleteReply(gid,r){
  if(!confirm('Delete this reply?')) return;
  try{await fs().collection('groups').doc(gid).collection('replies').doc(r.id).delete();}catch(e){fail(e,'Deleting');}
}
async function setHidden(gid,p,hidden){
  try{await fs().collection('groups').doc(gid).collection('posts').doc(p.id).update({hidden:hidden});}catch(e){fail(e,'That');}
}

/* ---------- the "new" badge on the Groups tab ---------- */
/* replies to your comments (or under ones you replied to) and new hearts, since you last looked */
function unseen(gid){
  const seen=lsGet('sl.seen',{})[gid]||0,hs=lsGet('sl.hearts',{});
  const reps=Object.values(G.replies[gid]||{});
  const mineThreads=new Set(reps.filter(r=>r.uid===G.uid).map(r=>r.postId));
  let n=reps.filter(r=>r.uid!==G.uid&&(r.at||0)>seen&&(r.postUid===G.uid||mineThreads.has(r.postId))).length;
  Object.values(G.posts[gid]||{}).forEach(p=>{
    if(p.uid!==G.uid) return;
    const others=(p.hearts||[]).filter(u=>u!==G.uid).length;
    n+=Math.max(0,others-(hs[gid+'/'+p.id]||0));
  });
  return n;
}
function markSeen(gid){
  const s=lsGet('sl.seen',{});s[gid]=Date.now();lsSet('sl.seen',s);
  const hs=lsGet('sl.hearts',{});
  Object.values(G.posts[gid]||{}).forEach(p=>{if(p.uid===G.uid) hs[gid+'/'+p.id]=(p.hearts||[]).filter(u=>u!==G.uid).length;});
  lsSet('sl.hearts',hs);
}
function badge(){
  const tab=document.querySelector('[data-tab="groups"]');
  if(!tab) return;
  let n=0;
  sortedGroups().forEach(g=>{if(!(A.tab()==='groups'&&G.view.mode==='feed'&&G.view.gid===g.id)) n+=unseen(g.id);});
  if(G.invite) n=Math.max(n,1);
  let b=tab.querySelector('.badge');
  if(!n){if(b) b.remove();tab.setAttribute('aria-label','Groups');return;}
  if(!b){b=el('span',{class:'badge','aria-hidden':'true'});tab.append(b);}
  b.textContent=n>9?'9+':String(n);
  tab.setAttribute('aria-label','Groups, '+n+' new');
}

/* ---------- drawing the Groups tab ---------- */
function render(){
  if(A.tab()!=='groups') return;
  const box=$('view-groups');
  if(!box) return;
  /* keep the cursor and anything typed when the page redraws */
  const ae=document.activeElement,focusId=ae&&box.contains(ae)&&ae.id;
  const sel=focusId&&typeof ae.selectionStart==='number'?[ae.selectionStart,ae.selectionEnd]:null;
  let kids;
  if(!G.cloud) kids=signedOutView();
  else if(G.view.mode==='feed'&&G.groups[G.view.gid]) kids=feedView(G.view.gid);
  else if(G.view.mode==='manage'&&G.groups[G.view.gid]) kids=manageView(G.view.gid);
  else kids=listView();
  box.replaceChildren(...kids.filter(Boolean));
  if(focusId){const n=document.getElementById(focusId);if(n){n.focus({preventScroll:true});if(sel&&n.setSelectionRange) try{n.setSelectionRange(sel[0],sel[1]);}catch(e){}}}
}
function show(){
  if(G.view.mode==='feed'&&G.view.gid) markSeen(G.view.gid);
  render();badge();lookUpInvite();
}
function msgEl(){return G.msg?el('p',{class:'gmsg',role:'status',text:G.msg}):null;}
function signedOutView(){
  return [el('h2',{class:'sect',text:'Groups'}),
    el('section',{class:'gcard'},
      G.invite?el('p',{},el('b',{text:"You've been invited to join a group."}),' Sign in, or create an account, to join it.'):null,
      el('p',{text:"Study alongside family and friends. Each group sees the daily text comments you share, and how everyone's doing. Your personal study, prayer list and other notes are never shared."}),
      el('p',{class:'hint',text:'Groups need you to be signed in, so the app can keep everyone in step.'}),
      el('div',{class:'actions'},el('button',{type:'button',class:'btn',onclick:()=>A.goSettings('syncSection')},'Sign in or create an account')))];
}
function nameField(id){
  if(myName()) return null;
  const i=el('input',{type:'text',id:id,autocomplete:'given-name',maxlength:'40',placeholder:'For example, Brandon'});
  i.value=(G.form&&G.form.name)||'';
  i.addEventListener('input',()=>{G.form.name=i.value;});
  return A.labeled('Your name, as others in the group will see it',i);
}
function listView(){
  const kids=[el('div',{class:'ghead'},el('h2',{class:'sect',text:'Groups'})),
    el('p',{class:'hint gintro',text:"Study alongside family and friends. Each group sees the daily text comments you share, and how everyone's doing."}),msgEl()];
  const inv=G.invite;
  if(inv){
    if(!inv.checked){lookUpInvite();kids.push(el('section',{class:'gcard'},el('p',{text:'Checking your invite...'})));}
    else if(inv.bad) kids.push(el('section',{class:'gcard'},el('p',{text:"That invite link doesn't work anymore. Ask for a new one."}),
      el('div',{class:'actions'},el('button',{type:'button',class:'btn ghost',onclick:()=>{clearInvite();render();badge();}},'OK'))));
    else{
      if(!G.form||G.form.kind!=='invite') G.form={kind:'invite',name:''};
      kids.push(el('section',{class:'gcard invite'},
        el('h3',{text:"You've been invited to join "+inv.name}),
        nameField('g-inv-name'),
        el('div',{class:'actions'},
          el('button',{type:'button',class:'btn',disabled:G.busy,onclick:()=>joinGroup({code:inv.code,gid:inv.gid,name:inv.name},G.form.name)},'Join '+inv.name),
          el('button',{type:'button',class:'btn ghost',onclick:()=>{clearInvite();G.form=null;render();badge();}},'Not now'))));
    }
  }
  if(!G.loaded) kids.push(el('p',{class:'hint',text:'Loading your groups...'}));
  sortedGroups().forEach(g=>kids.push(groupCard(g)));
  if(G.loaded&&!sortedGroups().length&&!inv) kids.push(el('p',{class:'hint',text:'You are not in a group yet. Start one and invite your family, or join one with a code someone sent you.'}));
  const f=G.form;
  if(f&&f.kind==='create'){
    const gn=el('input',{type:'text',id:'g-new-name',maxlength:'60',placeholder:'For example, Family'});
    gn.value=f.gname||'';gn.addEventListener('input',()=>{f.gname=gn.value;});
    kids.push(el('section',{class:'gcard'},el('h3',{text:'Start a group'}),A.labeled('Group name',gn),nameField('g-my-name'),
      el('div',{class:'actions'},
        el('button',{type:'button',class:'btn',disabled:G.busy,onclick:()=>createGroup(f.gname,f.name||myName())},'Start the group'),
        el('button',{type:'button',class:'btn ghost',onclick:()=>{G.form=null;G.msg='';render();}},'Cancel'))));
  }else if(f&&f.kind==='join'){
    const ci=el('input',{type:'text',id:'g-code',maxlength:'9',autocomplete:'off',autocapitalize:'characters',spellcheck:'false',placeholder:'K7MQ-4RXA',class:'codein'});
    ci.value=f.code||'';ci.addEventListener('input',()=>{f.code=ci.value;});
    kids.push(el('section',{class:'gcard'},el('h3',{text:'Join with a code'}),A.labeled('Group code',ci),nameField('g-my-name'),
      el('div',{class:'actions'},
        el('button',{type:'button',class:'btn',disabled:G.busy,onclick:async()=>{const found=await findCode(f.code);if(found) joinGroup(found,f.name||myName());}},'Join'),
        el('button',{type:'button',class:'btn ghost',onclick:()=>{G.form=null;G.msg='';render();}},'Cancel'))));
  }else{
    kids.push(el('div',{class:'gbtns'},
      el('button',{type:'button',class:'btn',onclick:()=>{G.form={kind:'create',name:'',gname:''};G.msg='';render();const i=$('g-new-name');if(i) i.focus();}},'Create a group'),
      el('button',{type:'button',class:'btn ghost',onclick:()=>{G.form={kind:'join',name:'',code:''};G.msg='';render();const i=$('g-code');if(i) i.focus();}},'Join with a code')));
  }
  kids.push(el('p',{class:'hint',text:'Only people in a group can see it. Your personal study, prayer list, questions and other notes are never shared.'}));
  return kids;
}
function groupCard(g){
  const t=todayKey(),mem=Object.values(G.members[g.id]||{}),n=(g.members||[]).length;
  const did=mem.filter(m=>m.shares!==false&&m.dtDate===t).length;
  const comments=Object.values(G.posts[g.id]||{}).filter(p=>p.date===t&&p.kind==='dt'&&!p.hidden).length;
  const u=unseen(g.id);
  const shown=(g.members||[]).slice(0,4);
  return el('button',{type:'button',class:'grp-card',onclick:()=>openFeed(g.id)},
    el('span',{class:'grp-top'},el('b',{text:g.name}),u?el('span',{class:'gnew',text:u+' new'}):null),
    el('span',{class:'grp-mid'},el('span',{class:'avs','aria-hidden':'true'},shown.map(uid=>{const m=(G.members[g.id]||{})[uid];return avatar(uid,uid===G.uid?myName():(m&&m.name));}),
      n>4?el('span',{class:'av more',text:'+'+(n-4)}):null),el('span',{class:'hint',text:n+(n===1?' person':' people')})),
    el('span',{class:'grp-sum'},'Today: ',el('b',{text:did+' of '+n}),' did the daily text · '+comments+' comment'+(comments===1?'':'s')));
}
function openFeed(gid){
  G.view={mode:'feed',gid:gid,date:todayKey()};G.msg='';G.replyOpen=null;G.personOpen=null;
  if(A.tab()!=='groups') A.setTab('groups');
  markSeen(gid);render();badge();window.scrollTo(0,0);
}

function feedView(gid){
  const g=G.groups[gid],k=G.view.date,t=todayKey();
  const mem=G.members[gid]||{},n=(g.members||[]).length;
  const minK=keyOf(addDays(new Date(),-DAYS_BACK+1));
  const dt=A.dtFor(k);
  const kids=[
    el('div',{class:'bar'},el('button',{type:'button',class:'link',onclick:()=>{G.view={mode:'list',gid:null,date:t};G.msg='';render();badge();}},'← Groups')),
    el('div',{class:'ghead'},el('h2',{class:'sect',text:g.name}),
      el('button',{type:'button',class:'link',onclick:()=>{G.view.mode='manage';G.msg='';render();window.scrollTo(0,0);}},'Invite · '+n+(n===1?' person':' people'))),
    msgEl(),
    el('div',{class:'datenav'},
      el('button',{type:'button',class:'icon','aria-label':'Earlier day',disabled:k<=minK,onclick:()=>{G.view.date=keyOf(addDays(parseKey(k),-1));G.replyOpen=null;render();}},svg(A.ICON_LEFT)),
      el('p',{class:'gday',text:k===t?'Today · '+fmtLong(k):fmtLong(k)}),
      el('button',{type:'button',class:'icon','aria-label':'Next day',disabled:k>=t,onclick:()=>{G.view.date=keyOf(addDays(parseKey(k),1));G.replyOpen=null;render();}},svg(A.ICON_RIGHT))),
    el('section',{class:'gcard gdt'},
      el('p',{class:'cap',text:'Daily text'}),
      dt?el('a',{class:'gdtline',href:A.libraryHref(k)},el('i',{text:dt.quote}),'—'+dt.ref):el('p',{class:'gdtline muted',text:"Add your daily text book under Settings to see the day's scripture here."}),
      el('p',{class:'hint',text:"Each person's app shows the day's text from their own daily text book."})),
    peopleRow(gid,k)];
  const posts=Object.values(G.posts[gid]||{}).filter(p=>p.date===k&&(!p.hidden||p.uid===G.uid||g.owner===G.uid))
    .sort((a,b)=>(a.kind===b.kind?0:a.kind==='dt'?-1:1)||(a.updatedAt||0)-(b.updatedAt||0));
  kids.push(el('h3',{class:'gsub',text:k===t?"Today's comments":'Comments'}));
  if(!posts.length) kids.push(el('p',{class:'hint',text:'No comments for this day yet.'}));
  posts.forEach(p=>kids.push(postEl(gid,p)));
  const mine=A.day(k);
  if(k>=keyOf(addDays(new Date(),-7))&&!posts.some(p=>p.uid===G.uid&&p.kind==='dt')){
    const why=!share().comments?'Your daily text comments are private.':dayPrivate(k)?'You kept this day private.':!groupOn(gid)?'You are not sharing with this group.':(mine&&nz(mine.text.note))?'Sharing your comment...':'';
    kids.push(el('div',{class:'gcard gyours'},el('p',{text:why||'Add your comment on Today and it shows here.'}),
      el('div',{class:'actions'},el('button',{type:'button',class:'btn ghost',onclick:()=>A.openDay(k,'text')},why&&why!=='Sharing your comment...'?'Open Today':'Write your comment'))));
  }
  return kids;
}
function peopleRow(gid,k){
  const g=G.groups[gid],mem=G.members[gid]||{};
  const uids=(g.members||[]).slice().sort((a,b)=>a===G.uid?-1:b===G.uid?1:String((mem[a]||{}).name||'').localeCompare(String((mem[b]||{}).name||'')));
  const open=G.personOpen&&mem[G.personOpen];
  return el('section',{class:'gpeople'},
    el('p',{class:'cap',text:"How everyone's doing"}),
    el('div',{class:'whorow'},uids.map(uid=>{
      const m=mem[uid]||{},name=uid===G.uid?'You':(m.name||'Joining...'),hid=m.shares===false;
      const on=!hid&&m.dtDate===k;
      const sub=hid?'Private':(m.dtDate===k?(m.streak?m.streak+(m.streak===1?' day':' days'):'Done'):'Not yet');
      return el('button',{type:'button',class:'who','aria-pressed':String(G.personOpen===uid),'aria-label':name+', '+(on?'did the daily text':'has not done the daily text yet')+(m.streak&&!hid?', '+m.streak+' day streak':''),
        onclick:()=>{G.personOpen=G.personOpen===uid?null:uid;render();}},
        el('span',{class:'ring'+(on?' on':'')},avatar(uid,uid===G.uid?myName():m.name)),el('b',{text:name}),el('span',{text:sub}));
    })),
    open?personDetail(open):el('p',{class:'hint',text:"A green ring means they've done the daily text that day. The number is their streak. Tap someone to see their reading."}));
}
function personDetail(m){
  if(m.shares===false) return el('p',{class:'gperson',text:(m.name||'They')+' keeps their progress private.'});
  const pct=m.total?Math.round(100*(m.read||0)/m.total):0;
  return el('div',{class:'gperson'},
    el('p',{},el('b',{text:m.id===G.uid?'You':m.name}),' · '+(m.path||'Reading')),
    el('p',{class:'hint',text:(m.read||0)+' of '+(m.total||1189)+' chapters of the Bible read ('+pct+'%) · Bible reading '+(m.bibleDate===todayKey()?'done today':'not done today')}));
}
function textWithRefs(text){
  const refs=A.findRefs(text),seen=new Set();
  return [el('p',{class:'gtext',text:text}),
    refs.length?el('div',{class:'refchips'},refs.filter(r=>!seen.has(r.label)&&seen.add(r.label)).slice(0,6).map(r=>el('a',{class:'refchip',href:A.refHref(r)},r.label))):null];
}
function postEl(gid,p){
  const g=G.groups[gid],mine=p.uid===G.uid,owner=g.owner===G.uid;
  const name=mine?'You':(p.name||'Someone');
  const hearts=p.hearts||[],iHeart=hearts.indexOf(G.uid)>=0;
  const reps=Object.values(G.replies[gid]||{}).filter(r=>r.postId===p.id).sort((a,b)=>(a.at||0)-(b.at||0));
  const kids=[
    el('div',{class:'gph'},avatar(p.uid,mine?myName():p.name),
      el('div',{class:'phw'},el('b',{text:name}),el('span',{class:'hint',text:(p.kind==='bible'?'Bible reading'+(p.ref?' · '+p.ref:'')+' · ':'')+fmtTime(p.updatedAt)})),
      mine?el('button',{type:'button',class:'link',onclick:()=>A.openDay(p.date,p.kind==='bible'?'bible':'text')},'Edit'):null,
      owner&&!mine?el('button',{type:'button',class:'link',onclick:()=>setHidden(gid,p,!p.hidden)},p.hidden?'Show':'Hide'):null),
    p.hidden?el('p',{class:'hint',text:mine?'Hidden from the group by the person who started it.':'Hidden. Only you can see it.'}):null,
    ...textWithRefs(p.text||''),
    el('div',{class:'acts'},
      el('button',{type:'button',class:'react'+(iHeart?' mine':''),'aria-pressed':String(iHeart),'aria-label':(iHeart?'Remove your heart':'Heart')+', '+hearts.length,onclick:()=>toggleHeart(gid,p)},svg(ICON_HEART),String(hearts.length||'')),
      el('button',{type:'button',class:'react',onclick:()=>{G.replyOpen=G.replyOpen===p.id?null:p.id;render();const i=$('rp-'+p.id);if(i) i.focus();}},'Reply'+(reps.length?' · '+reps.length:'')))];
  reps.forEach(r=>{
    const rm=r.uid===G.uid;
    kids.push(el('div',{class:'reply'},avatar(r.uid,rm?myName():r.name),
      el('div',{class:'rw'},el('b',{text:rm?'You':(r.name||'Someone')}),el('p',{class:'gtext',text:r.text})),
      rm||owner?el('button',{type:'button',class:'link',onclick:()=>deleteReply(gid,r),'aria-label':'Delete reply'},'Delete'):null));
  });
  if(G.replyOpen===p.id){
    const inp=el('textarea',{id:'rp-'+p.id,rows:'1',maxlength:'2000',placeholder:'Write a reply…','aria-label':'Reply to '+name});
    inp.value=G.replyDraft[p.id]||'';
    inp.addEventListener('input',()=>{G.replyDraft[p.id]=inp.value;});
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendReply(gid,p,inp.value);}});
    kids.push(el('div',{class:'replyin'},inp,el('button',{type:'button',class:'btn',onclick:()=>sendReply(gid,p,inp.value)},'Send')));
  }
  return el('article',{class:'post'+(p.hidden?' hidden-post':'')},kids);
}
function manageView(gid){
  const g=G.groups[gid],mem=G.members[gid]||{},owner=g.owner===G.uid,link=inviteLink(g.code);
  const msg=el('p',{class:'hint',role:'status'});
  const copy=async()=>{try{await navigator.clipboard.writeText(link);msg.textContent='Link copied.';}catch(e){msg.textContent='Copy this link: '+link;}};
  const kids=[
    el('div',{class:'bar'},el('button',{type:'button',class:'link',onclick:()=>openFeed(gid)},'← '+g.name)),
    el('h2',{class:'sect',text:'Invite people'}),msgEl(),
    el('section',{class:'gcard'},
      el('p',{},'Send this link by text or email. When they open it and sign in (or create an account), they join ',el('b',{text:g.name}),'.'),
      el('div',{class:'gbtns'},
        el('button',{type:'button',class:'btn',onclick:async()=>{
          if(navigator.share){try{await navigator.share({title:'Join '+g.name+' on the Study Log',text:'Join my group "'+g.name+'" on the Study Log:',url:link});return;}catch(e){if(e&&e.name==='AbortError') return;}}
          copy();}},'Share invite link'),
        el('button',{type:'button',class:'btn ghost',onclick:copy},'Copy link')),
      msg,
      el('p',{class:'hint',text:'Or they can tap "Join with a code" and type:'}),
      el('div',{class:'gcode','aria-label':'Group code '+g.code.split('').join(' ')},showCode(g.code)),
      el('p',{class:'hint',text:'Anyone with the link or code can join, so share it only with people you mean to invite.'+(owner?' You can make a new code anytime, which stops the old one working.':'')}),
      owner?el('button',{type:'button',class:'btn ghost',onclick:()=>makeNewCode(gid)},'Make a new code'):null),
    el('section',{class:'gcard'},el('h3',{text:'People in '+g.name}),
      el('div',{class:'mems'},(g.members||[]).map(uid=>{
        const m=mem[uid]||{},me=uid===G.uid;
        return el('div',{class:'mem'},avatar(uid,me?myName():m.name),
          el('span',{class:'mn'},me?'You':(m.name||'Joining...'),uid===g.owner?el('small',{text:'Started the group'}):null),
          owner&&!me?el('button',{type:'button',class:'rm',onclick:()=>removePerson(gid,uid)},'Remove'):null);
      })),
      el('p',{class:'hint',text:'Whoever starts a group can remove people and hide comments. Anyone can delete their own comments or leave a group.'}))];
  const sec=el('section',{class:'gcard'});
  if(owner){
    const ni=el('input',{type:'text',id:'g-rename',maxlength:'60'});
    ni.value=g.name;
    sec.append(A.labeled('Group name',ni),el('div',{class:'actions'},el('button',{type:'button',class:'btn ghost',onclick:()=>renameGroup(gid,ni.value)},'Save name')));
  }
  sec.append(el('button',{type:'button',class:'btn danger',onclick:()=>leaveGroup(gid)},'Leave this group'));
  kids.push(sec);
  return kids;
}

/* ---------- "Shared with …" under the daily text comment on Today ---------- */
function paintShare(box,k){
  if(!box) return;
  box.dataset.date=k;
  const groups=sortedGroups();
  if(!G.cloud||!groups.length||recentDays(8).indexOf(k)<0){box.replaceChildren();box.hidden=true;return;}
  box.hidden=false;
  const sh=share(),on=groups.filter(g=>groupOn(g.id));
  const line=!sh.comments?'Your daily text comments are private'
    :dayPrivate(k)?"This day's comment is private"
    :!on.length?'Not shared with any group'
    :null;
  const names=[];
  on.forEach((g,i)=>{if(i) names.push(i===on.length-1?' and ':', ');names.push(el('b',{text:g.name}));});
  const kids=[el('div',{class:'shareline'},svg(ICON_PEOPLE),
    el('span',{},line||['Shared with ',names]),
    el('button',{type:'button',class:'link','aria-expanded':String(G.shareOpen),onclick:()=>{G.shareOpen=!G.shareOpen;paintShare(box,k);}},'Change'))];
  if(G.shareOpen){
    const priv=el('input',{type:'checkbox',id:'sh-private'});
    priv.checked=dayPrivate(k);
    priv.onchange=()=>{savePeople({privateDays:{[k]:priv.checked}}).then(()=>{syncShares(k);paintShare(box,k);});};
    const rows=[el('div',{class:'checkrow'},priv,el('label',{for:'sh-private',text:"Keep this day's comment private"}))];
    groups.forEach(g=>{
      const c=el('input',{type:'checkbox',id:'sh-g-'+g.id});
      c.checked=groupOn(g.id);c.disabled=dayPrivate(k)||!sh.comments;
      c.onchange=()=>{savePeople({groupsOff:{[g.id]:!c.checked}}).then(()=>{resyncAll();paintShare(box,k);});};
      rows.push(el('div',{class:'checkrow'},c,el('label',{for:c.id,text:'Share with '+g.name})));
    });
    kids.push(el('div',{class:'sharepanel'},rows,
      el('button',{type:'button',class:'link',onclick:()=>A.goSettings('shareSection')},'More sharing settings')));
  }else if(line===null) kids.push(el('p',{class:'hint shared-note',text:'Shared when you finish typing.'}));
  box.replaceChildren(...kids);
}

/* ---------- Settings: what you share ---------- */
function shareSection(){
  const sec=el('section',{class:'setsec',id:'shareSection'},el('h3',{text:'Groups and sharing'}));
  if(!G.cloud){
    sec.append(el('p',{class:'hint',text:'Sign in to study alongside family and friends in groups.'}));
    return sec;
  }
  const name=el('input',{type:'text',id:'s-myname',maxlength:'40',autocomplete:'given-name',placeholder:'Your first name'});
  name.value=myName();
  const nmsg=el('p',{class:'hint',role:'status'});
  name.addEventListener('change',async()=>{if(await saveName(name.value)){nmsg.textContent='Saved.';resyncAll();}});
  sec.append(A.labeled('Your name in groups',name),nmsg);
  const sh=share();
  const sw=(id,label,sub,val,on)=>{
    const c=el('input',{type:'checkbox',id:id,role:'switch'});c.checked=val;c.onchange=()=>on(c.checked);
    return el('div',{class:'checkrow'},c,el('label',{for:id},label,el('small',{class:'chsub',text:sub})));
  };
  sec.append(el('p',{class:'boxlabel',text:'What you share'}),
    sw('s-sh-comments','Daily text comments','Shared by default',sh.comments,v=>savePeople({share:{comments:v}}).then(resyncAll)),
    sw('s-sh-progress','My progress','Streak, done today, reading path',sh.progress,v=>savePeople({share:{progress:v}}).then(resyncAll)),
    sw('s-sh-bible','Bible reading notes','The one-line summary of what you read. Off unless you turn it on.',sh.bible,v=>savePeople({share:{bible:v}}).then(resyncAll)));
  const groups=sortedGroups();
  if(groups.length){
    sec.append(el('p',{class:'boxlabel',text:'Share with'}));
    groups.forEach(g=>sec.append(sw('s-sh-g-'+g.id,g.name,(g.members||[]).length+' people',groupOn(g.id),v=>savePeople({groupsOff:{[g.id]:!v}}).then(resyncAll))));
  }
  sec.append(el('p',{class:'hint',text:'Never shared: personal study, prayer list, questions, ministry and meeting notes, and the Notebook.'}),
    el('div',{class:'actions'},el('button',{type:'button',class:'btn ghost',onclick:()=>A.setTab('groups')},groups.length?'Open Groups':'Start or join a group')));
  return sec;
}

/* ---------- notifications ---------- */
/* The app's web push key, from Firebase: Project settings, Cloud Messaging, Web Push
   certificates. It is a public key, meant to be shared. */
const BUILT_IN_VAPID='';
function vapidKey(){return nz(window.DSL.settings.vapidKey)||(G.cloud&&G.cloud.builtIn?BUILT_IN_VAPID:'');}
function isIOS(){return /iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}
function pushSupport(){
  const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)) return isIOS()&&!standalone?'ios-install':'none';
  return 'ok';
}
function deviceLabel(){
  const u=navigator.userAgent;
  return /iPhone/.test(u)?'iPhone':/iPad/.test(u)||isIOS()?'iPad':/Android/.test(u)?'Android':'Computer';
}
async function tokenId(t){
  const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h)).slice(0,12).map(x=>x.toString(16).padStart(2,'0')).join('');
}
const pushOn=()=>!!lsGet('sl.push','')&&'Notification' in window&&Notification.permission==='granted';
const timeZone=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';}catch(e){return 'UTC';}};
async function enablePush(ask){
  const key=vapidKey();
  if(!key) throw {msg:'Notifications need one more setup step in Firebase first (see below).'};
  if(ask){
    const perm=await Notification.requestPermission();
    if(perm!=='granted') throw {msg:perm==='denied'?'Notifications are blocked for this app. Allow them in your phone or browser settings, then try again.':'Notifications were not turned on.'};
  }
  await G.cloud.loadMessaging();
  const reg=await navigator.serviceWorker.ready;
  const token=await G.cloud.firebase.messaging().getToken({vapidKey:key,serviceWorkerRegistration:reg});
  if(!token) throw {msg:'Could not set up this device for notifications.'};
  const id=await tokenId(token),old=lsGet('sl.push','');
  await fs().doc('people/'+G.uid).set({tokens:{[id]:{token:token,at:Date.now(),device:deviceLabel()}},tz:timeZone()},{merge:true});
  if(old&&old!==id) await fs().doc('people/'+G.uid).update({['tokens.'+old]:FV().delete()}).catch(()=>{});
  lsSet('sl.push',id);
}
async function disablePush(){
  const id=lsGet('sl.push','');
  lsSet('sl.push','');
  try{await G.cloud.loadMessaging();await G.cloud.firebase.messaging().deleteToken();}catch(e){}
  if(id) await fs().doc('people/'+G.uid).update({['tokens.'+id]:FV().delete()}).catch(()=>{});
}
let setupNotify=function(){
  /* keep this device's registration fresh and the time zone current, quietly */
  if(pushOn()&&pushSupport()==='ok'&&vapidKey()) enablePush(false).catch(()=>{});
  else if(G.me&&G.me.tz!==timeZone()&&G.me.tokens) fs().doc('people/'+G.uid).set({tz:timeZone()},{merge:true}).catch(()=>{});
};
/* links from notifications: ?group=…&date=…, or ?open=text|bible|week|settings */
function openLink(href){
  let u;
  try{u=new URL(href,location.href);}catch(e){return;}
  const q=u.searchParams,date=/^\d{4}-\d\d-\d\d$/.test(q.get('date')||'')?q.get('date'):todayKey();
  if(q.get('group')){G.pendingOpen={gid:q.get('group'),date:date};tryPendingOpen();}
  else if(q.get('open')==='text'||q.get('open')==='bible') A.openDay(date,q.get('open'));
  else if(q.get('open')==='week') A.setTab('week');
  else if(q.get('open')==='settings') A.setTab('settings');
}
function tryPendingOpen(){
  const p=G.pendingOpen;
  if(!p) return;
  if(!G.loaded&&G.cloud) return;
  G.pendingOpen=null;
  if(!G.groups[p.gid]){A.setTab('groups');return;}
  openFeed(p.gid);G.view.date=p.date;render();
}
function launchLink(){
  try{
    const u=new URL(location.href);
    if(!u.searchParams.get('group')&&!u.searchParams.get('open')) return;
    const href=u.href;
    ['group','date','open'].forEach(k=>u.searchParams.delete(k));
    history.replaceState(null,'',u.pathname+(u.search||'')+u.hash);
    openLink(href);
  }catch(e){}
}
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.open) openLink(e.data.open);});
function timeOptions(){
  const o=[['','Off']];
  for(let m=5*60;m<=22*60+30;m+=30){
    const h=Math.floor(m/60),mm=m%60,v=String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    o.push([v,((h+11)%12+1)+':'+String(mm).padStart(2,'0')+(h<12?' AM':' PM')]);
  }
  return o;
}
let testAt=0;
let notifySection=function(){
  const sec=el('section',{class:'setsec',id:'notifySection'},el('h3',{text:'Notifications'}));
  if(!G.cloud){
    sec.append(el('p',{class:'hint',text:'Sign in to get reminders for the daily text and Bible reading, and to hear when someone in your group replies to you.'}));
    return sec;
  }
  const msg=el('p',{class:'hint',role:'status'});
  const redraw=()=>{const b=$('notifySection');if(b) b.replaceWith(notifySection());};
  const sup=pushSupport();
  if(sup==='ios-install') sec.append(el('p',{text:'On iPhone and iPad, notifications work once the app is on your Home Screen (iOS 16.4 or later). In Safari, tap Share, then Add to Home Screen, and open the app from there.'}));
  else if(sup==='none') sec.append(el('p',{class:'hint',text:'This browser cannot show notifications. Try the app on your phone\'s Home Screen, or in Chrome, Edge or Safari.'}));
  else{
    const on=pushOn();
    const blocked=Notification.permission==='denied';
    sec.append(el('p',{class:'nstate'+(on?' on':''),text:on?'On for this device.':blocked?'Blocked on this device. Allow notifications for this app in your phone or browser settings.':'Off on this device.'}));
    const acts=el('div',{class:'actions'});
    if(on){
      acts.append(
        el('button',{type:'button',class:'btn ghost',onclick:async()=>{
          testAt=Date.now();msg.textContent='Sending...';
          try{await fs().doc('people/'+G.uid).set({testAt:testAt},{merge:true});}catch(e){msg.textContent='Could not send. Check your connection.';return;}
          setTimeout(()=>{if(testAt&&!(G.me.testResult&&G.me.testResult.at>testAt)) msg.textContent='No answer from the notification server yet. If nothing arrives, its setup may not be finished (see the README).';},20000);
        }},'Send a test notification'),
        el('button',{type:'button',class:'btn ghost',onclick:async()=>{await disablePush();redraw();}},'Turn off on this device'));
    }else if(!blocked){
      acts.append(el('button',{type:'button',class:'btn',id:'n-enable',onclick:async()=>{
        msg.textContent='Turning on...';
        try{await enablePush(true);redraw();}catch(e){msg.textContent=(e&&e.msg)||('Could not turn on notifications. '+((e&&e.message)||''));}
      }},'Turn on notifications'));
    }
    sec.append(acts,msg);
    if(testAt&&G.me.testResult&&G.me.testResult.at>testAt) msg.textContent=G.me.testResult.sent?'Sent. It should arrive in a few seconds.':'The server could not reach this device. Turn notifications off and on again.';
    if(!vapidKey()){
      const k=el('input',{type:'text',id:'s-vapid',autocomplete:'off',spellcheck:'false',placeholder:'Paste the key pair'});
      k.value=window.DSL.settings.vapidKey||'';
      sec.append(el('details',{class:'note'},el('summary',{text:'One more setup step is needed'}),
        el('p',{class:'hint',text:'In the Firebase console, open Project settings, then Cloud Messaging. Under Web Push certificates, click Generate key pair and copy the key. Paste it here to try notifications on this device, and send it to whoever looks after the app so it works for everyone.'}),
        A.labeled('Web push key',k),
        el('div',{class:'actions'},el('button',{type:'button',class:'btn ghost',onclick:()=>{window.DSL.saveSettings({vapidKey:nz(k.value)});redraw();}},'Save key'))));
    }
  }
  const n=G.me.notify||{};
  const sel=(id,label,key,def)=>{
    const s=el('select',{id:id},timeOptions().map(o=>el('option',{value:o[0],text:o[1]})));
    s.value=n[key]===undefined?def:n[key];
    s.onchange=()=>savePeople({notify:{[key]:s.value},tz:timeZone()});
    return A.labeled(label,s);
  };
  const chk=(id,label,key,def)=>{
    const c=el('input',{type:'checkbox',id:id});
    c.checked=n[key]===undefined?def:n[key]===true;
    c.onchange=()=>savePeople({notify:{[key]:c.checked},tz:timeZone()});
    return el('div',{class:'checkrow'},c,el('label',{for:id,text:label}));
  };
  sec.append(el('p',{class:'boxlabel',text:'Reminders'}),
    el('div',{class:'nrow'},sel('n-dt','Daily text','dailyText','07:00'),sel('n-read','Bible reading','reading','20:00')),
    chk('n-plan',"Saturday morning: plan next week's reading",'planWeek',true),
    chk('n-backup','First of the month: save a backup','backup',false),
    el('p',{class:'hint',text:"A reminder is skipped on days you've already done it."}),
    el('p',{class:'boxlabel',text:'Groups'}),
    chk('n-hearts','When someone hearts my comment','hearts',true),
    chk('n-replies','When someone replies to me','replies',true),
    chk('n-posts','Every new comment in my groups','groupPosts',false),
    el('p',{class:'hint',text:'These choices apply on every device where notifications are on.'}));
  return sec;
};

window.SLG={
  start:start,show:show,paintShare:paintShare,dayChanged:dayChanged,progressChanged:progressChanged,
  weekly:weekly,shareWeekly:shareWeekly,shareSection:()=>shareSection(),notifySection:()=>notifySection(),
  _G:G
};
if(A.conn) start();
})();
