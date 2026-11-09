(function(){
'use strict';

/* ---------- configuration ---------- */
const HABITS=[
  {key:'text',label:'Daily text',link:true,fields:[
    {type:'group',style:'box',label:'Scripture',fields:[
      {prop:'ref',label:'Scripture reference',bare:true,hint:'For example, Psalm 37:4',link:true},
      {prop:'vtext',label:'The verse',bare:true,multi:true,hint:'The verse, typed or pasted'}]},
    {prop:'note',label:'Comment',multi:true,rows:4,hint:'The main point of the comments, or your own thoughts'},
    /* older entries may have this; it only shows when it has something in it */
    {prop:'apply',label:'How I can use it',multi:true,showIf:s=>!!String(s.apply||'').trim()}]},
  {key:'bible',label:'Bible reading',saveVerse:true,saveQuestion:true,markRead:true,help:true,fields:[
    {prop:'ref',label:'What I read',hint:'For example, Genesis 1-2'},
    {prop:'gems',label:'What spiritual gems did I find?',multi:true,hint:'These also show up in Week to help you get ready for the midweek meeting'},
    {prop:'note',label:'What it teaches me about Jehovah',multi:true},
    {prop:'summary',label:'What happened',multi:true,more:true},
    {prop:'people',label:'People and the choices they made',multi:true,more:true},
    {prop:'verse',label:'Verse that stood out',hint:'For example, Genesis 2:21-23',more:true,link:true},
    {prop:'verseWhy',label:'Why it stood out',multi:true,more:true},
    {prop:'question',label:'A question I have',multi:true,more:true}]},
  {key:'study',label:'Personal study',saveQuestion:true,help:true,fields:[
    {prop:'ref',label:'Topic',hint:'What are you studying?'},
    {prop:'note',label:'What I learned',multi:true},
    {prop:'apply',label:'How I can apply it',multi:true},
    {prop:'question',label:'Question to look into next',multi:true}]}
];
const HPROPS=['ref','vtext','gems','summary','note','apply','people','verse','verseWhy','question','help','verseSaved','qSaved'];
const TEXTPROPS=['ref','vtext','gems','summary','note','apply','people','verse','verseWhy','question','help'];

const WEEK_GOALS=['Complete the assigned reading','Identify what the passage teaches about Jehovah','Study one character, event, or question','Choose one personal application'];
const WEEK_SUMMARY=[
  {prop:'story',label:'The story in my own words',multi:true,rows:5},
  {prop:'jehovah',label:'What this taught me about Jehovah',multi:true,rows:5},
  {prop:'people',label:'Important people and their decisions',multi:true,rows:5},
  {prop:'connection',label:"How this connects to the Bible's overall message",multi:true},
  {prop:'keyRef',label:'Key scripture',hint:'For example, Genesis 3:15',link:true},
  {prop:'keyWhy',label:'Why it matters',multi:true},
  {prop:'qResearched',label:'A question I researched',multi:true},
  {prop:'application',label:'My personal application: what will I specifically do?',multi:true}
];
const FAM_ON=()=>window.DSL.settings.showFamily!==false;
const PART_TYPES=['Bible reading','Starting a conversation','Following up','Making disciples','Explaining your beliefs','Talk','Other'];
const WEEK_FIELDS=[
  {type:'group',style:'card',label:'This week',note:'Your regular week in one list. Daily text and Bible reading fill in from Today.',fields:[
    {type:'slot',id:'weekCounts'},
    {prop:'mwPrep',type:'check',label:'Prepared for the midweek meeting'},
    {prop:'mwAttend',type:'check',label:'Attended the midweek meeting'},
    {prop:'wtPrep',type:'check',label:'Prepared the Watchtower Study'},
    {prop:'weAttend',type:'check',label:'Attended the weekend meeting'},
    {prop:'ministry',type:'check',label:'Shared in the ministry'},
    {prop:'family',type:'check',label:'Family Worship',showIf:FAM_ON}]},
  {type:'group',style:'card',label:'Midweek meeting',note:'Our Christian Life and Ministry. Follow along in the Meeting Workbook.',fields:[
    {type:'group',style:'sub',label:"Treasures From God's Word",fields:[
      {prop:'reading',label:"This week's Bible reading (from the Meeting Workbook)",hint:'For example, Jeremiah 45-46'},
      {type:'slot',id:'gemsList'},
      {prop:'mwGem',label:'The spiritual gem I could share',multi:true}]},
    {type:'group',style:'sub',label:'Apply Yourself to the Field Ministry',fields:[
      {prop:'mwHasPart',type:'check',label:'I have an assignment this week'},
      {type:'group',style:'plain',gid:'part',showIf:d=>!!d.mwHasPart,fields:[
        {prop:'mwPartType',type:'select',label:'Assignment',options:[['','Choose one']].concat(PART_TYPES.map(x=>[x,x]))},
        {type:'group',style:'row2',fields:[
          {prop:'mwPoint',label:'Study point',hint:'Lesson number'},
          {prop:'mwPartner',label:'Partner',hint:'First name'}]},
        {prop:'mwPlan',label:'My plan',multi:true,hint:'Setting, opening question, scripture to use'},
        {prop:'mwPracticed',type:'check',label:'Practiced with my partner'}]}]},
    {type:'group',style:'sub',label:'Living as Christians',fields:[
      {prop:'cbs',label:'Congregation Bible Study',hint:'Lesson or chapter'},
      {prop:'cbsComment',label:'A comment I could give',multi:true,hint:'Paragraph number and the point in your own words'},
      {prop:'lacNote',label:'Something I want to remember',multi:true}]}]},
  {type:'group',style:'card',label:'Weekend meeting',fields:[
    {type:'group',style:'sub',label:'Public talk',fields:[
      {prop:'talkTitle',label:'Title'},
      {prop:'talkSpeaker',label:'Speaker and congregation',hint:'Optional'},
      {prop:'talkPoints',label:'Main points and scriptures',multi:true}]},
    {type:'group',style:'sub',label:'Watchtower Study',fields:[
      {prop:'wtArticle',label:'Article',hint:'Title or theme scripture'},
      {prop:'wtMarked',type:'check',label:'Read it and marked the answers'},
      {prop:'wtComments',label:'Comments I could give',multi:true,hint:'One per line, starting with the paragraph number'},
      {prop:'wtTake',label:"What I'll take from it",multi:true}]}]},
  {type:'group',style:'card',label:'Family Worship',gid:'fam',showIf:FAM_ON,fields:[
    {prop:'famTopic',label:'What we studied',hint:'A Bible account, a video, a project'},
    {prop:'famTake',label:'What we took away',multi:true},
    {prop:'famNext',label:'Idea for next week'}]},
  {type:'slot',id:'ministryForm'},
  {type:'group',style:'fold',id:'weekFold',label:'Study goals, weekly summary and review',fields:
    [{type:'head',label:'Weekly goals'}]
    .concat(WEEK_GOALS.map((g,i)=>({prop:'g'+i,type:'check',label:g})))
    .concat([{type:'slot',id:'weekLog'},{type:'head',label:'Weekly summary'}])
    .concat(WEEK_SUMMARY)
    .concat([{type:'head',label:'Weekly review'},{type:'slot',id:'weekReview'},{prop:'reviewAns',label:'My answers',multi:true,rows:6}])}
];
const MIN_FIELDS=[{type:'group',style:'card',label:'Ministry this month',titleId:'minTitle',note:'What you need for your monthly report.',fields:[
  {prop:'shared',type:'check',label:'I shared in the ministry this month'},
  {type:'group',style:'row2',fields:[
    {prop:'studies',label:'Bible studies',inputmode:'numeric'},
    {prop:'hours',label:'Hours',hint:'If you pioneer',inputmode:'decimal'}]},
  {prop:'followups',label:'Follow-ups to make',multi:true,hint:'What you talked about and what to bring next time. No names or addresses.'},
  {prop:'reported',type:'check',label:'Report turned in'}]}];
function flatFields(fs){
  const o=[];
  fs.forEach(f=>{if(f.type==='group') o.push(...flatFields(f.fields)); else if(f.prop) o.push(f);});
  return o;
}
const WEEK_FLAT=flatFields(WEEK_FIELDS);
const MIN_FLAT=flatFields(MIN_FIELDS);
const MONTH_FIELDS=[
  {prop:'wentWell',label:'What went well',multi:true},
  {prop:'improve',label:'What I want to improve',multi:true},
  {prop:'nextGoal',label:'My goal for next month',multi:true}
];

const CATS=["Jehovah's qualities","Faith and trust","Prayer","Family","Relationships","Temptation and conduct","Trials and endurance","Ministry","Answers for the ministry","Kingdom and future hope","Other"];
const CAT_RENAMED={'Future promises':'Kingdom and future hope'};
const TPL_CHARACTER="NAME AND MEANING\n\nFAMILY AND BACKGROUND\n\nTIME PERIOD AND CONDITIONS\nWhat was the world like? What pressures did this person face?\n\nPLACE IN THE BIBLE'S OVERALL STORY\n\nIMPORTANT EVENTS\n-\n-\n-\n\nIMPORTANT DECISIONS\nWhat choices did this person make? Why were those choices difficult?\n\nSTRENGTHS AND GOOD QUALITIES\n\nWEAKNESSES OR LIMITATIONS\n\nRELATIONSHIP WITH JEHOVAH\nHow did Jehovah treat, guide, correct, or bless this person?\n\nKEY SCRIPTURES\n\nWHAT OTHER BIBLE WRITERS SAID\n\nWHAT I SHOULD IMITATE\n\nWHAT I SHOULD AVOID\n\nMAIN LESSON\nOne-sentence summary:\n\nSOURCES\n";
const TPL_BOOK="NAME AND MEANING\n\nWRITER\n\nTIME PERIOD COVERED\n\nLOCATION AND HISTORICAL SETTING\n\nPURPOSE OF THE BOOK\n\nBASIC OUTLINE\n1.\n2.\n3.\n4.\n\nMAIN PEOPLE\n\nMAJOR EVENTS\n\nWHAT THE BOOK TEACHES ABOUT JEHOVAH\n\nIMPORTANT COVENANTS OR PROMISES\n\nCONNECTION TO JESUS AND THE KINGDOM\n\nKEY SCRIPTURES\n\nMY SUMMARY OF THE BOOK\nWrite this after completing the book.\n\nQUESTIONS I STILL HAVE\n\nSOURCES\n";
const TPL_THEME="WHAT THIS THEME MEANS\n\nKEY SCRIPTURES\n\nHOW JEHOVAH SHOWS IT\n\nEXAMPLES OF PEOPLE WHO SHOWED IT OR LACKED IT\n\nHOW I CAN SHOW IT\n\nQUESTIONS I STILL HAVE\n\nSOURCES\n";

/* ---------- helpers ---------- */
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const keyOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseKey=k=>{const p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);};
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const todayKey=()=>keyOf(new Date());
const clone=o=>JSON.parse(JSON.stringify(o));
const fmtShort=d=>d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
const fmtDay=d=>d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
const monthOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1);
function mondayOf(k){const d=parseKey(k);return keyOf(addDays(d,-((d.getDay()+6)%7)));}
function cut(s,n){return String(s||'').replace(/\s+/g,' ').trim().slice(0,n);}

function el(tag,props,...kids){
  const n=document.createElement(tag);
  if(props){
    for(const k of Object.keys(props)){
      const v=props[k];
      if(k==='class') n.className=v;
      else if(k==='text') n.textContent=v;
      else if(k.indexOf('on')===0) n.addEventListener(k.slice(2),v);
      else if(v===true) n.setAttribute(k,'');
      else if(v!==false&&v!=null) n.setAttribute(k,v);
    }
  }
  for(const kid of kids.flat(Infinity)){
    if(kid==null||kid===false) continue;
    n.append(kid.nodeType?kid:document.createTextNode(String(kid)));
  }
  return n;
}
function svg(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild;}
const ICON_CHECK='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_LEFT='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_RIGHT='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_OUT='<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M10 6H6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_DOWN='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* form controls shared by every editor */
/* Field types: text (default), multi (textarea), select, check, head, note, slot, and group.
   A group holds other fields; style is box, card, sub, plain, row2 or fold.
   showIf(data) hides a field or group; link adds a "Read it on jw.org" link for scripture references. */
function mkControl(f,idPrefix,onChange){
  if(f.type==='group') return mkGroup(f,idPrefix,onChange);
  if(f.type==='head') return el('h3',{class:'subhead',text:f.label});
  if(f.type==='note') return el('p',{class:'hint',text:f.label});
  if(f.type==='slot') return el('div',{id:f.id});
  const id=idPrefix+'-'+f.prop,wid=idPrefix+'-w-'+f.prop;
  if(f.type==='check'){
    const cb=el('input',{type:'checkbox',id:id});
    cb.addEventListener('change',()=>onChange(f.prop,cb.checked,f));
    return el('div',{class:'checkrow',id:wid},cb,el('label',{for:id,text:f.label}));
  }
  let inp;
  if(f.type==='select') inp=el('select',{id:id},f.options.map(o=>el('option',{value:o[0],text:o[1]})));
  else if(f.multi) inp=el('textarea',{id:id,class:'fmt',rows:f.rows||3,autocomplete:'off',placeholder:f.hint||''});
  else inp=el('input',{type:'text',id:id,autocomplete:'off',placeholder:f.hint||''});
  if(f.multi&&(f.rows||3)>=10) inp.classList.add('tall');
  if(f.inputmode) inp.setAttribute('inputmode',f.inputmode);
  const link=f.link?el('div',{class:'reflinks',id:id+'-link',hidden:true}):null;
  inp.addEventListener(f.type==='select'?'change':'input',()=>{
    onChange(f.prop,inp.value,f);
    if(link) refLink(link,inp.value);
  });
  const lab=f.bare?el('label',{for:id,class:'sr',text:f.label}):el('label',{for:id,text:f.label});
  return el('div',{class:'field',id:wid},lab,inp,link);
}
function mkGroup(f,idPrefix,onChange){
  const kids=f.fields.map(x=>mkControl(x,idPrefix,onChange));
  const gid=f.gid?idPrefix+'-g-'+f.gid:(f.id||null);
  if(f.style==='fold') return el('details',{class:'fold',id:gid},el('summary',{text:f.label}),el('div',{class:'foldbody'},kids));
  if(f.style==='card') return el('section',{class:'wcard',id:gid},
    el('h3',{class:'wcard-h',id:f.titleId||null,text:f.label}),f.note?el('p',{class:'hint',text:f.note}):null,kids);
  if(f.style==='sub') return el('div',{class:'part',id:gid},el('p',{class:'ph',text:f.label}),kids);
  if(f.style==='row2') return el('div',{class:'row2',id:gid},kids);
  if(f.style==='plain') return el('div',{class:'plainbox',id:gid},kids);
  return el('div',{class:'scripbox',role:'group','aria-label':f.label,id:gid},el('p',{class:'boxlabel','aria-hidden':'true',text:f.label}),kids);
}
function paintControl(f,idPrefix,value,force,data){
  const d=data||{};
  if(f.type==='group'){
    if(f.showIf&&f.gid){const g=document.getElementById(idPrefix+'-g-'+f.gid);if(g) g.hidden=!f.showIf(d);}
    f.fields.forEach(x=>paintControl(x,idPrefix,d[x.prop],force,d));
    return;
  }
  if(!f.prop) return;
  if(f.showIf){const w=document.getElementById(idPrefix+'-w-'+f.prop);if(w) w.hidden=!f.showIf(d);}
  const i=document.getElementById(idPrefix+'-'+f.prop);
  if(!i) return;
  if(f.type==='check'){i.checked=!!value;return;}
  const v=String(value==null?'':value);
  if((force||i!==document.activeElement)&&i.value!==v) i.value=v;
  if(f.link){const a=document.getElementById(idPrefix+'-'+f.prop+'-link');if(a) refLink(a,i.value);}
}

/* scripture links to the Watchtower Online Library (a link only; nothing is copied from the site) */
function looksLikeRef(t){
  const segs=String(t||'').split(';').map(s=>s.trim()).filter(Boolean);
  return segs.length>0&&segs.every(seg=>{
    const m=seg.match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z.\s]*?)\s*(\d[\d\s,:\-–—]*)$/);
    return !!m&&findBook(m[1])>=0;
  });
}
/* JW Library verse code: book (2 digits), chapter (3), verse (3). Psalm 37:4 is 19037004.
   Uses the first reference when there are several. Returns null without a chapter and verse. */
function bibleCode(t){
  const seg=String(t||'').split(';')[0].trim();
  const m=seg.match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z.\s]*?)\s*(\d[\d\s,:\-–—]*)$/);
  if(!m) return null;
  const bi=findBook(m[1]);
  if(bi<0) return null;
  const r=m[2].replace(/\s+/g,'').match(/^(\d+):(\d+)(?:[,\-–—](\d+)(?::(\d+))?)?/);
  if(!r) return null;
  const c1=+r[1],v1=+r[2];
  let c2=c1,v2=v1;
  if(r[4]){c2=+r[3];v2=+r[4];}else if(r[3]){v2=+r[3];}
  if(c1<1||c1>BOOKS[bi][1]||c2<c1||c2>BOOKS[bi][1]||v1<1||(c2===c1&&v2<v1)) return null;
  const code=(c,v)=>String(bi+1).padStart(2,'0')+String(c).padStart(3,'0')+String(v).padStart(3,'0');
  const a=code(c1,v1),b=code(c2,v2);
  return a===b?a:a+'-'+b;
}
function refLink(box,value){
  const t=String(value||'').trim();
  const ok=looksLikeRef(t);
  box.hidden=!ok;
  if(!ok) return;
  const code=bibleCode(t);
  const kids=[];
  if(code){
    kids.push(el('a',{class:'reflink',href:'jwlibrary:///finder?wtlocale=E&prefer=lang&pub=nwtsty&bible='+code},
      'Open '+t.split(';')[0].trim()+' in JW Library'));
  }
  const web=el('a',{class:code?'reflink alt':'reflink',target:'_blank',rel:'noopener noreferrer',
    href:'https://wol.jw.org/en/wol/l/r1/lp-e?q='+encodeURIComponent(t)},code?'jw.org':'Read '+t+' on jw.org');
  web.append(svg(ICON_OUT));
  kids.push(web);
  box.replaceChildren(...kids);
}

/* Shows notes with bullets, numbers, to-dos and CAPITAL headings as formatted text.
   onToggle(lineIndex) makes to-do boxes tickable. */
const LIST_RE=/^(\s*)([•◦☐☑]|\d+[.)]|[-*])\s+(.*)$/;
function richText(text,onToggle){
  const box=el('div',{class:'rt'});
  String(text||'').split('\n').forEach((line,i)=>{
    if(!line.trim()) return;
    const m=line.match(LIST_RE);
    if(m){
      const lvl=Math.min(4,Math.floor(m[1].replace(/\t/g,'    ').length/4));
      const pad='margin-left:'+(lvl*20)+'px';
      if(m[2]==='☐'||m[2]==='☑'){
        const cb=el('input',{type:'checkbox'});
        cb.checked=m[2]==='☑';
        if(onToggle) cb.addEventListener('change',()=>onToggle(i)); else cb.disabled=true;
        box.append(el('label',{class:'rt-todo',style:pad},cb,el('span',{text:m[3]})));
      }else{
        const mk=/^\d/.test(m[2])?m[2]:(lvl?'◦':'•');
        box.append(el('div',{class:'rt-li',style:pad},el('span',{class:'mk','aria-hidden':'true',text:mk}),el('span',{text:m[3]})));
      }
      return;
    }
    const t=line.trim();
    if(t.length>=3&&/[A-Z]/.test(t)&&!/[a-z]/.test(t)) box.append(el('h4',{class:'rt-h',text:t}));
    else box.append(el('p',{text:line}));
  });
  return box;
}

/* ---------- normalizers ---------- */
function normHabit(s){
  s=s||{};
  const o={done:!!s.done};
  HPROPS.forEach(p=>{o[p]=String(s[p]||'');});
  return o;
}
function normDay(v,date){
  const out={date:date,updatedAt:(v&&Number(v.updatedAt))||0};
  HABITS.forEach(hb=>{out[hb.key]=normHabit(v&&v[hb.key]);});
  return out;
}
function hasContent(s){return !!(s.done||HPROPS.some(p=>s[p]));}
function doneCount(day){return HABITS.filter(hb=>day[hb.key].done).length;}
function normWeek(v,start){
  const o={start:start,updatedAt:(v&&Number(v.updatedAt))||0};
  WEEK_FLAT.forEach(f=>{o[f.prop]=f.type==='check'?!!(v&&v[f.prop]):String((v&&v[f.prop])||'');});
  o.reviewQs=String((v&&v.reviewQs)||'');
  return o;
}
function normMin(v,id){
  const o={month:id,updatedAt:(v&&Number(v.updatedAt))||0};
  MIN_FLAT.forEach(f=>{o[f.prop]=f.type==='check'?!!(v&&v[f.prop]):String((v&&v[f.prop])||'');});
  return o;
}
function normMonth(v,id){
  const o={month:id,updatedAt:(v&&Number(v.updatedAt))||0};
  MONTH_FIELDS.forEach(f=>{o[f.prop]=String((v&&v[f.prop])||'');});
  return o;
}
function normGeneric(v,id,props,extra){
  const o={id:id,createdAt:Number(v&&v.createdAt)||0,updatedAt:Number(v&&v.updatedAt)||0};
  props.forEach(p=>{o[p]=String((v&&v[p])||'');});
  if(extra) extra(o,v||{});
  return o;
}
function normQuiz(v,id){
  return {id:id,date:String((v&&v.date)||''),scope:String((v&&v.scope)||''),total:Number(v&&v.total)||0,score:Number(v&&v.score)||0,results:Array.isArray(v&&v.results)?v.results:[],createdAt:Number(v&&v.createdAt)||0,updatedAt:Number(v&&v.updatedAt)||0};
}

/* ---------- state and saving ---------- */
const S={root:null,connecting:true,days:{},quizzes:{},sel:todayKey(),weekSel:mondayOf(todayKey()),monthSel:monthOf(new Date()),
  tab:'today',lib:'questions',rev:'quiz',fresh:false,daysLoaded:false,histLimit:30,hq:'',bible:{read:{},rounds:0,updatedAt:0},mode:'local'};
let draft=normDay(null,S.sel);
let expanded=new Set();
const moreOpen=new Set();
let lastToday=todayKey();
let weekFillMsg='';

const pending=new Map();
let writing=false;
let dayTimer=null;

function setStatus(text,mode){
  $('statusText').textContent=text;
  $('status').classList.toggle('err',mode==='err'||mode==='retry');
  $('retry').hidden=mode!=='retry';
}
function enqueue(coll,id,payload){
  pending.set(coll+'/'+id,{coll:coll,id:id,payload:payload});
  pump();
}
async function pump(){
  if(writing) return;
  if(!S.root){
    if(pending.size&&!S.connecting) setStatus('Not saved. Saving is not available in this view.','err');
    return;
  }
  writing=true;
  try{
    while(pending.size){
      const key=pending.keys().next().value;
      const item=pending.get(key);
      pending.delete(key);
      try{
        const ref=S.root.collection(item.coll).doc(item.id);
        if(item.payload===null) await ref.delete(); else await ref.set(item.payload);
      }catch(e){
        if(!pending.has(key)) pending.set(key,item);
        setStatus('Not saved yet.','retry');
        return;
      }
    }
    setStatus('Saved');
  }finally{
    writing=false;
  }
}
function newId(coll){
  return S.root?S.root.collection(coll).doc().id:'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
}

/* ---------- asking Claude ---------- */
function aiReady(){return !!window.DSL.sample();}
function helpError(e){
  const c=e&&e.code;
  if(c==='no_ai') return 'AI help is not set up yet. Add an API key under Settings.';
  if(c==='bad_key') return 'The API key was not accepted. Check it under Settings.';
  if(c==='bad_model') return 'The model name was not accepted. Check it under Settings.';
  if(c==='rate_limited') return 'Too many requests, or the API account is out of credits. Check your API account.';
  if(c==='network') return 'Could not reach the AI service. Check your connection.';
  if(c==='invalid_json') return 'The AI sent back something this page could not read. Try again.';
  if(c==='cancelled') return '';
  if(c==='upstream_error'&&e.message) return 'The AI service said: '+String(e.message).slice(0,160);
  return 'Could not get an answer right now. Try again.';
}
async function claudeText(prompt){
  const s=window.DSL.sample();
  if(!s) throw {code:'no_ai'};
  const r=await s(prompt);
  return String((r&&r.text)||'').trim();
}
async function claudeJson(prompt){
  const s=window.DSL.sample();
  if(!s) throw {code:'no_ai'};
  return s.json(prompt);
}
function helpRules(){
  return [
    'The user studies the Bible every day with the New World Translation and publications from jw.org, and writes their own notes. They want help noticing things they may have missed.',
    'Rules:',
    '- Do not quote the Bible or any publication. Do not give page numbers, paragraph numbers, or article titles you are not sure exist.',
    '- Stick to points that are well established. If you are unsure about something, say so plainly.',
    '- Write about Jehovah the way the user does in their notes.',
    '- Do not repeat what the user already wrote.',
    '- Plain text only. No markdown symbols and no asterisks.'
  ].join('\n');
}
function studyHelpPrompt(hb,s){
  return helpRules()+'\n\nKeep the whole answer under 220 words. Use these short headings in capitals, each followed by 2 to 4 lines that start with "- ":\nBACKGROUND\nTHINGS YOU MAY HAVE MISSED\nVERSES TO LOOK UP\nQUESTIONS TO THINK ABOUT\nWHERE TO CHECK (search words to use on jw.org or in JW Library)\n\n'
    +'Subject: '+hb.label+'\nReading or topic: '+(s.ref||'(not given)')
    +'\nWhat happened, in the user\'s words: '+(s.summary||'(none)')
    +'\nSpiritual gems the user found: '+(s.gems||'(none)')
    +'\nWhat the user learned: '+(s.note||'(none)')
    +'\nPeople and their choices, in the user\'s words: '+(s.people||'(none)')
    +'\nVerse that stood out: '+(s.verse||'(none)')
    +'\nThe user\'s question: '+(s.question||'(none)');
}
function questionHelpPrompt(q){
  return helpRules()+'\n\nHelp the user research this question. Keep the whole answer under 220 words. Use these short headings in capitals, each followed by 2 to 4 lines that start with "- ":\nWHAT THE PASSAGE IS ABOUT\nVERSES TO LOOK UP\nSEARCH WORDS FOR JW.ORG OR JW LIBRARY\nA STARTING POINT TO CHECK (label it as something to verify, not a final answer)\n\n'
    +'Question: '+q.text+'\nWhere it came up: '+(q.ref||'(not given)')+'\nWhat the user has found so far: '+(q.answer||'(nothing yet)');
}

/* ---------- generic collections: questions, treasury, notebook ---------- */
const COLL={};
const MEET_LABEL={midweek:'Midweek meeting',public:'Public talk',wt:'Watchtower Study',circuit:'Circuit assembly',convention:'Convention',memorial:'Memorial',talk:'Talk or part',ministry:'Ministry',meeting:'Other meeting'};
const MEET_KINDS=Object.keys(MEET_LABEL);
const TALK_KINDS=['public','talk','circuit','convention','memorial'];
const meetIn=list=>i=>list.indexOf(i.kind)>=0;
const COLL_CFG=[
  {key:'questions',coll:'questions',plural:'Questions',singular:'question',defaultFilter:'open',
    empty:'No questions yet. When something in your reading puzzles you, add it here and come back with the answer.',
    fields:[
      {prop:'text',label:'Question',multi:true,hint:'What do you want to understand?'},
      {prop:'ref',label:'Where it came up',hint:'For example, Genesis 4:23-24'},
      {prop:'status',label:'Status',type:'select',options:[['open','Open'],['answered','Answered']]},
      {prop:'answer',label:'What I found',multi:true,rows:5},
      {prop:'sources',label:'Where I found it',hint:'For example, Insight, a study note, jw.org'}],
    help:{label:'Research help',build:questionHelpPrompt,ok:q=>q.text.trim()},
    norm:(v,id)=>normGeneric(v,id,['text','ref','status','answer','sources','help','fromDate'],(o,raw)=>{if(o.status!=='answered') o.status='open';o.answeredAt=Number(raw.answeredAt)||0;}),
    make:()=>({text:'',ref:'',status:'open',answer:'',sources:'',help:'',fromDate:'',answeredAt:0}),
    onChange:(d,prop,val)=>{if(prop==='status'&&val==='answered'&&!d.answeredAt) d.answeredAt=Date.now();},
    filters:()=>[{id:'open',label:'Open',test:i=>i.status!=='answered'},{id:'answered',label:'Answered',test:i=>i.status==='answered'},{id:'all',label:'All',test:()=>true}],
    search:i=>[i.text,i.ref,i.answer,i.sources].join(' '),
    row:i=>({title:i.text||'Untitled question',chips:[i.ref,i.status==='answered'?'Answered':''].filter(Boolean),snippet:i.status==='answered'?i.answer:''})},
  {key:'prayers',coll:'prayers',plural:'Prayer list',singular:'prayer item',defaultFilter:'open',
    empty:'Nothing here yet. Add things you want to pray about, and come back later to note how they were answered.',
    fields:[
      {prop:'text',label:'What I want to pray about',multi:true,hint:'Keep it short'},
      {prop:'status',label:'Status',type:'select',options:[['open','Still praying about it'],['answered','Answered']]},
      {prop:'answer',label:'How it was answered',multi:true,showIf:d=>d.status==='answered'}],
    norm:(v,id)=>normGeneric(v,id,['text','status','answer'],(o,raw)=>{if(o.status!=='answered') o.status='open';o.answeredAt=Number(raw.answeredAt)||0;}),
    make:()=>({text:'',status:'open',answer:'',answeredAt:0}),
    onChange:(d,prop,val)=>{if(prop==='status'&&val==='answered'&&!d.answeredAt) d.answeredAt=Date.now();},
    filters:()=>[{id:'open',label:'Praying about',test:i=>i.status!=='answered'},{id:'answered',label:'Answered',test:i=>i.status==='answered'},{id:'all',label:'All',test:()=>true}],
    search:i=>[i.text,i.answer].join(' '),
    row:i=>({title:i.text||'Untitled',chips:[i.status==='answered'?'Answered':''].filter(Boolean),snippet:i.answer})},
  {key:'verses',coll:'verses',plural:'Scripture Treasury',singular:'scripture',defaultFilter:'all',
    empty:'Nothing saved yet. Save a verse that stood out from your daily reading, or add one here.',
    fields:[
      {prop:'ref',label:'Scripture',hint:'For example, Genesis 6:9',link:true},
      {prop:'text',label:'Scripture text (optional)',multi:true,hint:'Type or paste it if you want it here'},
      {prop:'category',label:'Category',type:'select',options:[['','Choose one']].concat(CATS.map(c=>[c,c]))},
      {prop:'context',label:'Context',multi:true},
      {prop:'why',label:'Why it matters to me',multi:true},
      {prop:'when',label:'When I could use it',multi:true}],
    norm:(v,id)=>normGeneric(v,id,['ref','text','category','context','why','when','nextReview','lastReviewed'],(o,raw)=>{o.level=Number(raw.level)||0;if(CAT_RENAMED[o.category]) o.category=CAT_RENAMED[o.category];}),
    make:()=>({ref:'',text:'',category:'',context:'',why:'',when:'',level:0,nextReview:'',lastReviewed:''}),
    filters:items=>[{id:'all',label:'All',test:()=>true}].concat(CATS.filter(c=>items.some(i=>i.category===c)).map(c=>({id:c,label:c,test:i=>i.category===c}))),
    search:i=>[i.ref,i.text,i.category,i.context,i.why,i.when].join(' '),
    row:i=>({title:i.ref||'Untitled scripture',chips:[i.category].filter(Boolean),snippet:i.why})},
  {key:'notes',coll:'notes',plural:'Notebook',singular:'note',defaultFilter:'all',readField:'body',
    empty:'No notes yet. Start a Bible character, a Bible book, a theme, or a blank note.',
    fields:[
      {prop:'title',label:'Title',hint:'What is this about?'},
      {prop:'topic',label:'Topic',hint:'For example, a Bible book or a subject'},
      {prop:'body',label:'Notes',multi:true,rows:14}],
    templates:[
      {id:'blank',label:'Blank note',title:'',body:''},
      {id:'character',label:'Bible character',title:'Bible character: ',body:TPL_CHARACTER},
      {id:'book',label:'Bible book',title:'Bible book: ',body:TPL_BOOK},
      {id:'theme',label:'Theme',title:'Theme: ',body:TPL_THEME}],
    norm:(v,id)=>normGeneric(v,id,['title','topic','body','kind'],(o)=>{if(!o.kind) o.kind='blank';}),
    make:tpl=>({title:tpl?tpl.title:'',topic:'',body:tpl?tpl.body:'',kind:tpl?tpl.id:'blank'}),
    filters:items=>{
      const kinds=[{id:'character',label:'Characters',test:i=>i.kind==='character'},{id:'book',label:'Books',test:i=>i.kind==='book'},{id:'theme',label:'Themes',test:i=>i.kind==='theme'},{id:'blank',label:'Other',test:i=>['character','book','theme'].indexOf(i.kind)<0}];
      return [{id:'all',label:'All',test:()=>true}].concat(kinds.filter(k=>items.some(k.test)));
    },
    search:i=>[i.title,i.topic,i.body].join(' '),
    row:i=>({title:i.title||'Untitled note',chips:[i.topic].filter(Boolean),snippet:i.body})},
  {key:'meetings',coll:'meetings',plural:'Meetings and ministry',singular:'entry',defaultFilter:'all',
    empty:'Nothing here yet. Add notes from a meeting or talk, or questions to look into from the ministry.',
    fields:[
      {prop:'kind',label:'Type',type:'select',options:MEET_KINDS.map(k=>[k,MEET_LABEL[k]])},
      {prop:'title',label:'Title or theme',hint:'What was it about?'},
      {prop:'speaker',label:'Speaker',hint:'Optional',showIf:d=>TALK_KINDS.indexOf(d.kind)>=0},
      {prop:'date',label:'Date',hint:'For example, Nov 8'},
      {type:'note',label:'Leave out names and addresses of people you meet in the ministry. Write only what you need to remember.'},
      {prop:'points',label:'Main points',multi:true,rows:5},
      {prop:'scriptures',label:'Scriptures',multi:true,hint:'For example, Psalm 83:18; Matthew 6:9'},
      {prop:'followup',label:'Questions to look into or follow up on',multi:true,rows:4},
      {prop:'apply',label:'What I will do',multi:true}],
    norm:(v,id)=>normGeneric(v,id,['kind','title','speaker','date','points','scriptures','followup','apply'],o=>{if(MEET_KINDS.indexOf(o.kind)<0) o.kind='meeting';}),
    make:()=>({kind:'midweek',title:'',speaker:'',date:'',points:'',scriptures:'',followup:'',apply:''}),
    filters:items=>[{id:'all',label:'All',test:()=>true},
      {id:'meetings',label:'Meetings',test:meetIn(['midweek','wt','meeting'])},
      {id:'talks',label:'Talks',test:meetIn(['public','talk'])},
      {id:'assemblies',label:'Assemblies',test:meetIn(['circuit','convention','memorial'])},
      {id:'ministry',label:'Ministry',test:meetIn(['ministry'])}].filter(f=>f.id==='all'||items.some(f.test)),
    search:i=>[i.title,i.speaker,i.date,i.points,i.scriptures,i.followup,i.apply].join(' '),
    row:i=>({title:i.title||MEET_LABEL[i.kind],chips:[MEET_LABEL[i.kind],i.date].filter(Boolean),snippet:i.followup||i.points})}
];

function setupColl(cfg){
  const st={cfg:cfg,items:{},open:null,draft:null,timer:null,q:'',filter:cfg.defaultFilter||'all',ui:{}};
  COLL[cfg.key]=st;
  const search=el('input',{type:'search',placeholder:'Search '+cfg.plural.toLowerCase(),'aria-label':'Search '+cfg.plural.toLowerCase(),autocomplete:'off'});
  search.addEventListener('input',()=>{st.q=search.value;renderColl(st);});
  const tpl=el('div',{class:'subtabs',hidden:true});
  const newBtn=el('button',{type:'button',class:'btn'},'New '+cfg.singular);
  newBtn.addEventListener('click',()=>{if(cfg.templates) tpl.hidden=!tpl.hidden; else openItem(st,null);});
  if(cfg.templates){
    cfg.templates.forEach(t=>tpl.append(el('button',{type:'button',class:'pill',onclick:()=>{tpl.hidden=true;openItem(st,null,t);}},t.label)));
  }
  const chips=el('div',{class:'chips'});
  const rows=el('div',{class:'rows'});
  const listView=el('div',{class:'view'},el('div',{class:'bar'},search,newBtn),tpl,chips,rows);

  const back=el('button',{type:'button',class:'link'},'Back to '+cfg.plural.toLowerCase());
  back.addEventListener('click',()=>closeItem(st));
  const fieldEls=cfg.fields.map(f=>mkControl(f,'f-'+cfg.key,(prop,val,ff)=>{
    if(!st.draft) return;
    st.draft[prop]=val;
    if(cfg.onChange) cfg.onChange(st.draft,prop,val);
    touchColl(st);
    if(ff&&(ff.type==='select'||ff.type==='check')) paintEditor(st,false);
  }));
  const topBar=el('div',{class:'bar'},back);
  const editorKids=[topBar,fieldEls];
  if(cfg.readField){
    const rb=el('button',{type:'button',class:'btn ghost',style:'margin-left:auto'},'Read view');
    rb.addEventListener('click',()=>{commitColl(st);st.reading=!st.reading;paintEditor(st,true);});
    st.ui.readBtn=rb;
    st.ui.readBox=el('div',{class:'readbox',hidden:true});
    topBar.append(rb);
    editorKids.push(st.ui.readBox);
  }
  if(cfg.help){
    const hBtn=el('button',{type:'button',class:'btn ghost'},cfg.help.label);
    const hText=el('div',{class:'helptext'});
    const hClear=el('button',{type:'button',class:'link'},'Clear');
    const hBox=el('div',{class:'helpbox',hidden:true},el('p',{class:'helpcap',text:'Study help from AI. Check it against your Bible and the publications.'}),hText,hClear);
    hBtn.addEventListener('click',()=>itemHelp(st));
    hClear.addEventListener('click',()=>{if(!st.draft) return;st.draft.help='';touchColl(st);paintEditor(st,false);});
    st.ui.helpBtn=hBtn;st.ui.helpBox=hBox;st.ui.helpText=hText;
    editorKids.push(el('div',{class:'actions'},hBtn),hBox);
  }
  const delBtn=el('button',{type:'button',class:'btn danger'},'Delete '+cfg.singular);
  const confirm=el('div',{class:'confirm',hidden:true},
    el('p',{text:"Delete this "+cfg.singular+"? This can't be undone."}),
    el('div',{class:'bar'},
      el('button',{type:'button',class:'btn danger',onclick:()=>deleteItem(st)},'Delete'),
      el('button',{type:'button',class:'btn ghost',onclick:()=>{confirm.hidden=true;}},'Keep it')));
  delBtn.addEventListener('click',()=>{confirm.hidden=false;});
  editorKids.push(el('div',{class:'bar wrapbar'},delBtn),confirm);
  const editor=el('div',{class:'editor',hidden:true},editorKids);

  st.ui.listView=listView;st.ui.editor=editor;st.ui.chips=chips;st.ui.rows=rows;st.ui.confirm=confirm;
  st.ui.root=el('div',{class:'view',hidden:true},listView,editor);
  $('libBody').append(st.ui.root);
}
function touchColl(st){
  st.draft.updatedAt=Date.now();
  setStatus('Saving...');
  clearTimeout(st.timer);
  st.timer=setTimeout(()=>commitColl(st),700);
}
function commitColl(st){
  if(st.timer===null) return;
  clearTimeout(st.timer);st.timer=null;
  if(!st.draft) return;
  const p=clone(st.draft);
  st.items[p.id]=p;
  enqueue(st.cfg.coll,p.id,p);
}
function openItem(st,id,tpl){
  const cfg=st.cfg;
  if(id){st.draft=clone(st.items[id]);}
  else{
    const now=Date.now();
    st.draft=Object.assign(cfg.make(tpl),{id:newId(cfg.coll),createdAt:now,updatedAt:now});
  }
  st.open=st.draft.id;
  st.reading=!!(id&&cfg.readField&&String(st.draft[cfg.readField]||'').trim());
  st.ui.confirm.hidden=true;
  renderColl(st);
  paintEditor(st,true);
  if(!id){const f=document.getElementById('f-'+cfg.key+'-'+cfg.fields[0].prop);if(f) f.focus();}
}
function closeItem(st){
  commitColl(st);
  st.open=null;st.draft=null;
  renderColl(st);
  renderLibTabs();
}
function deleteItem(st){
  if(!st.draft) return;
  const id=st.draft.id;
  clearTimeout(st.timer);st.timer=null;
  delete st.items[id];
  enqueue(st.cfg.coll,id,null);
  st.open=null;st.draft=null;
  renderColl(st);
  renderLibTabs();
}
function paintEditor(st,force){
  const d=st.draft;
  if(!d) return;
  const cfg=st.cfg;
  cfg.fields.forEach(f=>paintControl(f,'f-'+cfg.key,d[f.prop],force,d));
  if(st.ui.helpBox){st.ui.helpBox.hidden=!d.help;st.ui.helpText.textContent=d.help||'';}
  if(st.ui.readBox){
    const rf=cfg.readField,on=!!st.reading;
    const w=document.getElementById('f-'+cfg.key+'-w-'+rf);
    if(w) w.hidden=on;
    st.ui.readBox.hidden=!on;
    st.ui.readBtn.textContent=on?'Edit':'Read view';
    if(on){
      const txt=String(d[rf]||'');
      st.ui.readBox.replaceChildren(txt.trim()?richText(txt,i=>{
        if(!st.draft) return;
        const lines=String(st.draft[rf]).split('\n');
        lines[i]=lines[i].replace(/[☐☑]/,c=>c==='☐'?'☑':'☐');
        st.draft[rf]=lines.join('\n');
        touchColl(st);
        paintEditor(st,true);
      }):el('p',{class:'hint',text:'Nothing written yet. Tap Edit to start.'}));
    }
  }
}
async function itemHelp(st){
  const d=st.draft;
  if(!d) return;
  if(!st.cfg.help.ok(d)){setStatus('Write the question first, then ask for research help.');return;}
  const id=d.id;
  st.ui.helpBtn.disabled=true;st.ui.helpBtn.textContent='Thinking...';
  try{
    const text=await claudeText(st.cfg.help.build(d));
    if(st.draft&&st.draft.id===id){st.draft.help=text;touchColl(st);}
  }catch(e){
    const m=helpError(e);if(m) setStatus(m,'err');
  }finally{
    st.ui.helpBtn.disabled=false;st.ui.helpBtn.textContent=st.cfg.help.label;
    paintEditor(st,false);
  }
}
function renderColl(st){
  const cfg=st.cfg,ui=st.ui;
  if(st.open){ui.listView.hidden=true;ui.editor.hidden=false;paintEditor(st,false);return;}
  ui.listView.hidden=false;ui.editor.hidden=true;
  const all=Object.values(st.items);
  const fl=cfg.filters?cfg.filters(all):[{id:'all',label:'All',test:()=>true}];
  let active=fl.find(f=>f.id===st.filter);
  if(!active) active=fl.find(f=>f.id==='all')||fl[0];
  ui.chips.hidden=fl.length<2;
  ui.chips.replaceChildren(...fl.map(f=>el('button',{type:'button',class:'pill','aria-pressed':String(f.id===active.id),onclick:()=>{st.filter=f.id;renderColl(st);}},f.label)));
  const q=st.q.trim().toLowerCase();
  const items=all.filter(i=>active.test(i)&&(!q||cfg.search(i).toLowerCase().includes(q))).sort((a,b)=>b.updatedAt-a.updatedAt);
  if(!items.length){
    const msg=!all.length?(S.fresh?cfg.empty:'Loading...'):'Nothing here. Try a different filter or search.';
    ui.rows.replaceChildren(el('p',{class:'empty-note',text:msg}));
    return;
  }
  ui.rows.replaceChildren(...items.map(i=>{
    const r=cfg.row(i);
    const d=new Date(i.updatedAt||Date.now());
    return el('button',{type:'button',class:'row',onclick:()=>openItem(st,i.id)},
      el('h3',{text:r.title}),
      el('div',{class:'meta'},r.chips.map(c=>el('span',{class:'chip',text:c})),el('span',{text:fmtShort(d)})),
      r.snippet?el('p',{class:'snip',text:r.snippet}):null);
  }));
}
function syncColl(st){
  if(!st.draft||st.timer!==null||writing||pending.has(st.cfg.coll+'/'+st.draft.id)) return;
  const r=st.items[st.draft.id];
  if(r&&r.updatedAt>st.draft.updatedAt){st.draft=clone(r);paintEditor(st,false);}
}
function createItem(key,fields){
  const st=COLL[key];
  const now=Date.now();
  const doc=Object.assign(st.cfg.make(),fields,{id:newId(st.cfg.coll),createdAt:now,updatedAt:now});
  st.items[doc.id]=doc;
  enqueue(st.cfg.coll,doc.id,clone(doc));
  renderLibTabs();
  return doc.id;
}
function renderLibTabs(){
  const nq=Object.values(COLL.questions.items).filter(i=>i.status!=='answered').length;
  const defs=[['questions','Questions'+(nq?' ('+nq+')':'')],['prayers','Prayer'],['verses','Treasury'],['notes','Notebook'],['meetings','Meetings'],['bible','Read-through']];
  $('libTabs').replaceChildren(...defs.map(d=>el('button',{type:'button',class:'pill','aria-pressed':String(S.lib===d[0]),onclick:()=>{S.lib=d[0];showLib();}},d[1])));
}
function showLib(){
  renderLibTabs();
  Object.keys(COLL).forEach(k=>{COLL[k].ui.root.hidden=k!==S.lib;});
  B.ui.hidden=S.lib!=='bible';
  if(S.lib==='bible') renderBible(); else renderColl(COLL[S.lib]);
}

/* ---------- one-document forms: week and month ---------- */
function makeDocForm(key,coll,fields,norm){
  const st={key:key,coll:coll,fields:fields,norm:norm,id:null,draft:null,timer:null,map:{}};
  st.build=function(container){
    container.replaceChildren(...fields.map(f=>mkControl(f,'df-'+key,(prop,val,ff)=>{
      if(!st.draft) return;
      st.draft[prop]=val;
      st.touch();
      if(ff&&(ff.type==='select'||ff.type==='check')) st.paint(false);
    })));
  };
  st.touch=function(){
    st.draft.updatedAt=Date.now();
    setStatus('Saving...');
    clearTimeout(st.timer);
    st.timer=setTimeout(st.commit,700);
  };
  st.commit=function(){
    if(st.timer===null) return;
    clearTimeout(st.timer);st.timer=null;
    if(!st.draft) return;
    const p=clone(st.draft);
    st.map[p.id||p.start||p.month]=p;
    enqueue(coll,st.id,p);
  };
  st.paint=function(force){
    if(!st.draft) return;
    fields.forEach(f=>paintControl(f,'df-'+key,st.draft[f.prop],force,st.draft));
    if(st.onPaint) st.onPaint();
  };
  st.load=function(id){
    st.commit();
    const pend=pending.get(coll+'/'+id);
    const r=pend?pend.payload:st.map[id];
    st.id=id;
    st.draft=r?norm(clone(r),id):norm(null,id);
    st.paint(true);
  };
  st.sync=function(){
    if(!st.draft||st.timer!==null||writing||pending.has(coll+'/'+st.id)) return;
    const r=st.map[st.id];
    if(r&&r.updatedAt>st.draft.updatedAt){st.draft=norm(clone(r),st.id);st.paint(false);}
  };
  return st;
}
const WK=makeDocForm('week','weeks',WEEK_FIELDS,normWeek);
WK.onPaint=()=>renderWeekReview();
const MO=makeDocForm('month','months',MONTH_FIELDS,normMonth);
const MIN=makeDocForm('min','ministry',MIN_FIELDS,normMin);
const minMonth=()=>monthOf(parseKey(S.weekSel));

/* ---------- streaks ---------- */
function eff(){const m=Object.assign({},S.days);m[draft.date]=draft;return m;}
function streakFor(key,m){
  const t=new Date();
  let cur=new Date(t.getFullYear(),t.getMonth(),t.getDate());
  const e0=m[keyOf(cur)];
  if(!(e0&&e0[key].done)) cur=addDays(cur,-1);
  let n=0;
  for(;;){
    const e=m[keyOf(cur)];
    if(e&&e[key].done){n++;cur=addDays(cur,-1);}else break;
  }
  return n;
}
function renderStreaks(){
  const m=eff();
  $('streakGrid').replaceChildren(...HABITS.map(hb=>{
    const n=streakFor(hb.key,m);
    return el('div',{class:'streak'+(n>0?' on':'')},el('b',{text:String(n)}),el('span',{text:hb.label}));
  }));
}

/* ---------- today ---------- */
function touchDay(){
  draft.updatedAt=Date.now();
  setStatus('Saving...');
  clearTimeout(dayTimer);
  dayTimer=setTimeout(commitDay,700);
}
function commitDay(){
  if(dayTimer===null) return;
  clearTimeout(dayTimer);dayTimer=null;
  enqueue('days',draft.date,clone(draft));
}
function buildHabits(){
  const box=$('habits');
  box.replaceChildren();
  HABITS.forEach(hb=>{
    const k=hb.key;
    const check=el('button',{type:'button',class:'check',role:'checkbox','aria-checked':'false','aria-label':hb.label+' done',id:'check-'+k,
      onclick:()=>{draft[k].done=!draft[k].done;touchDay();paintHabits();renderProgress();renderStreaks();}},svg(ICON_CHECK));
    const sum=el('p',{class:'habit-sum',id:'sum-'+k});
    const tg=el('button',{type:'button',class:'toggle',id:'toggle-'+k,'aria-expanded':'false','aria-controls':'body-'+k,
      onclick:()=>{if(expanded.has(k)) expanded.delete(k); else expanded.add(k); paintHabits();}},el('span',{text:'Notes'}),svg(ICON_DOWN));
    const mk=f=>mkControl(f,'d-'+k,(prop,val)=>{draft[k][prop]=val;touchDay();paintSummary(k);paintActions(k);});
    const fields=hb.fields.filter(f=>!f.more).map(mk);
    const moreF=hb.fields.filter(f=>f.more);
    if(moreF.length){
      fields.push(el('button',{type:'button',class:'morebtn',id:'more-'+k,'aria-expanded':'false','aria-controls':'morewrap-'+k,
        onclick:()=>{if(moreOpen.has(k)) moreOpen.delete(k); else moreOpen.add(k); paintHabits();}},
        el('span',{id:'moretext-'+k}),svg(ICON_DOWN)),
        el('div',{class:'morewrap',id:'morewrap-'+k,hidden:true},moreF.map(mk)));
    }
    const actions=el('div',{class:'actions'});
    if(hb.link) actions.append(el('a',{class:'btn ghost',id:'link-'+k,href:'https://wol.jw.org/en/wol/h/r1/lp-e',target:'_blank',rel:'noopener noreferrer',text:'Open the daily text on jw.org'}));
    if(hb.saveVerse) actions.append(el('button',{type:'button',class:'btn ghost',id:'saveverse',onclick:saveVerse},'Save verse to Treasury'));
    if(hb.saveQuestion) actions.append(el('button',{type:'button',class:'btn ghost',id:'saveq-'+k,onclick:()=>saveQuestion(k)},'Save to Questions'));
    if(hb.markRead) actions.append(el('button',{type:'button',class:'btn ghost',id:'markread',onclick:markChapters},'Mark chapters read'));
    if(hb.help) actions.append(el('button',{type:'button',class:'btn ghost',id:'help-btn-'+k,onclick:()=>dayHelp(k)},'Study help'));
    const kids=[fields];
    if(actions.childNodes.length) kids.push(actions);
    if(hb.markRead) kids.push(el('p',{class:'hint',id:'markmsg',hidden:true}));
    if(hb.help){
      kids.push(el('div',{class:'helpbox',id:'helpbox-'+k,hidden:true},
        el('p',{class:'helpcap',text:'Study help from AI. Check it against your Bible and the publications.'}),
        el('div',{class:'helptext',id:'helptext-'+k}),
        el('button',{type:'button',class:'link',onclick:()=>{draft[k].help='';touchDay();paintHabits();}},'Clear')));
    }
    const body=el('div',{class:'habit-body',id:'body-'+k,hidden:true},kids);
    box.append(el('section',{class:'habit'},
      el('div',{class:'habit-head'},check,el('div',{class:'habit-title'},el('h3',{text:hb.label}),sum),tg),body));
  });
}
function paintSummary(k){
  const s=draft[k];
  const n=$('sum-'+k);
  const t=s.ref||s.verse||s.gems||s.note||s.summary;
  n.textContent=t?t.slice(0,90):'No notes yet';
  n.classList.toggle('none',!t);
}
function paintActions(k){
  const s=draft[k];
  if(k==='bible'){
    const b=$('saveverse');
    b.disabled=!!s.verseSaved||!s.verse.trim();
    b.textContent=s.verseSaved?'Saved to Treasury':'Save verse to Treasury';
  }
  const q=$('saveq-'+k);
  if(q){
    q.disabled=!!s.qSaved||!s.question.trim();
    q.textContent=s.qSaved?'Saved to Questions':'Save to Questions';
  }
}
function paintHabits(force){
  const d=parseKey(S.sel);
  HABITS.forEach(hb=>{
    const k=hb.key,s=draft[k];
    $('check-'+k).setAttribute('aria-checked',String(s.done));
    hb.fields.forEach(f=>paintControl(f,'d-'+k,s[f.prop],force,s));
    const moreF=hb.fields.filter(f=>f.more);
    if(moreF.length){
      const forced=moreF.some(f=>String(s[f.prop]||'').trim());
      const mo=forced||moreOpen.has(k);
      $('morewrap-'+k).hidden=!mo;
      const mb=$('more-'+k);
      mb.hidden=forced;
      mb.setAttribute('aria-expanded',String(mo));
      mb.classList.toggle('open',mo);
      $('moretext-'+k).textContent=mo?'Fewer boxes':'More: what happened, people, verse, question';
    }
    const open=expanded.has(k);
    $('body-'+k).hidden=!open;
    const tg=$('toggle-'+k);
    tg.setAttribute('aria-expanded',String(open));
    tg.classList.toggle('open',open);
    if(hb.help){$('helpbox-'+k).hidden=!s.help;$('helptext-'+k).textContent=s.help;}
    paintSummary(k);
    paintActions(k);
  });
}
function saveVerse(){
  const b=draft.bible;
  if(!b.verse.trim()||b.verseSaved) return;
  b.verseSaved=createItem('verses',{ref:b.verse.trim(),context:b.ref?'From my reading of '+b.ref:'',why:b.verseWhy});
  touchDay();
  paintActions('bible');
}
function saveQuestion(k){
  const s=draft[k];
  if(!s.question.trim()||s.qSaved) return;
  s.qSaved=createItem('questions',{text:s.question.trim(),ref:s.ref||'',fromDate:draft.date});
  touchDay();
  paintActions(k);
}
async function dayHelp(k){
  const hb=HABITS.find(h=>h.key===k);
  const s=draft[k];
  if(!(s.ref||s.summary||s.gems||s.note||s.verse||s.question)){setStatus('Add what you read or a note first, then ask for study help.');return;}
  const date0=draft.date;
  const btn=$('help-btn-'+k);
  btn.disabled=true;btn.textContent='Thinking...';
  try{
    const text=await claudeText(studyHelpPrompt(hb,s));
    if(draft.date!==date0){setStatus('That study help was for a different day. Ask again here.');return;}
    draft[k].help=text;
    touchDay();
  }catch(e){
    const m=helpError(e);if(m) setStatus(m,'err');
  }finally{
    btn.disabled=false;btn.textContent='Study help';
    paintHabits();
  }
}
function renderProgress(){
  const n=doneCount(draft);
  $('segs').replaceChildren(...HABITS.map(hb=>el('span',{class:'seg'+(draft[hb.key].done?' on':'')})));
  $('progressText').textContent=n===3?'All three done':n+' of 3 done';
}
function renderToday(){
  const t=todayKey(),d=parseKey(S.sel);
  $('dateTitle').textContent=d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  const diff=Math.round((parseKey(t)-d)/86400000);
  $('dateRel').textContent=diff===0?'Today':diff===1?'Yesterday':diff+' days ago';
  $('next').disabled=S.sel>=t;
  $('jumpWrap').hidden=S.sel===t;
  $('firstRun').hidden=!(S.fresh&&Object.keys(S.days).length===0&&!HABITS.some(hb=>hasContent(draft[hb.key])));
  const wk=mondayOf(S.sel);
  const w=(WK.draft&&WK.draft.start===wk)?WK.draft:WK.map[wk];
  const reading=w&&w.reading?w.reading.trim():'';
  $('weekHint').hidden=!reading;
  $('weekHint').textContent=reading?"This week's reading: "+reading:'';
  const ph=$('d-bible-ref');
  if(ph) ph.placeholder=reading||'For example, Genesis 1-2';
  renderProgress();
  renderStreaks();
  renderSunBanner();
}
function openExpanded(){
  expanded=new Set(HABITS.filter(hb=>TEXTPROPS.some(p=>draft[hb.key][p])).map(hb=>hb.key));
}
function goTo(k){
  commitDay();
  if(document.activeElement&&document.activeElement.blur) document.activeElement.blur();
  S.sel=k;
  const pend=pending.get('days/'+k);
  const r=pend?pend.payload:S.days[k];
  draft=r?normDay(clone(r),k):normDay(null,k);
  openExpanded();
  paintHabits(true);
  renderToday();
}
function syncDraft(){
  if(dayTimer!==null||writing||pending.has('days/'+draft.date)) return;
  const r=S.days[draft.date];
  if(r&&r.updatedAt>draft.updatedAt){
    draft=normDay(clone(r),draft.date);
    paintHabits(false);
  }
}
function openDay(k){setTab('today');goTo(k);window.scrollTo(0,0);}

/* ---------- week ---------- */
function dotsEl(day){
  return el('span',{class:'dots'},HABITS.map(hb=>el('span',{class:'dot'+(day[hb.key].done?' on':'')},el('span',{class:'sr',text:hb.label+(day[hb.key].done?' done':' not done')}))));
}
function renderWeek(){
  const s=parseKey(S.weekSel),e=addDays(s,6);
  $('weekTitle').textContent=fmtShort(s)+' to '+fmtShort(e);
  const cur=mondayOf(todayKey());
  const diff=Math.round((parseKey(cur)-s)/604800000);
  $('weekRel').textContent=diff===0?'This week':diff===1?'Last week':diff+' weeks ago';
  $('wnext').disabled=S.weekSel>=cur;
  const mt=$('minTitle');
  if(mt){const p=minMonth().split('-').map(Number);mt.textContent='Ministry in '+new Date(p[0],p[1]-1,1).toLocaleDateString(undefined,{month:'long'});}
  renderWeekLog();
  renderWeekReview();
}
function renderWeekExtras(){
  const m=eff(),start=parseKey(S.weekSel);
  let tx=0,bb=0;
  const gems=[];
  for(let i=0;i<7;i++){
    const d=addDays(start,i),k=keyOf(d),day=m[k];
    if(!day) continue;
    if(day.text.done) tx++;
    if(day.bible.done) bb++;
    if(day.bible.gems.trim()) gems.push({d:d,k:k,t:day.bible.gems.trim()});
  }
  const c=$('weekCounts');
  if(c) c.replaceChildren(el('div',{class:'stats'},
    el('div',{class:'stat'},el('span',{text:'Daily text'}),el('b',{text:tx+' of 7 days'})),
    el('div',{class:'stat'},el('span',{text:'Bible reading'}),el('b',{text:bb+' of 7 days'}))));
  const g=$('gemsList');
  if(g) g.replaceChildren(gems.length
    ?el('div',{class:'gembox'},el('p',{class:'cap',text:'Gems from your daily reading'}),
      gems.map(x=>el('button',{type:'button',class:'gemrow',onclick:()=>openDay(x.k)},el('b',{text:fmtDay(x.d)+': '}),cut(x.t,160))))
    :el('p',{class:'hint',text:'Spiritual gems you write under Bible reading on Today show up here.'}));
}
function renderWeekLog(){
  renderWeekExtras();
  const box=$('weekLog');
  if(!box) return;
  const m=eff(),start=parseKey(S.weekSel),t=todayKey();
  let readDays=0;
  const rows=[];
  for(let i=0;i<7;i++){
    const d=addDays(start,i),k=keyOf(d),day=m[k];
    if(day&&day.bible.done) readDays++;
    if(k>t) continue;
    const lines=[];
    if(day){
      if(day.bible.ref) lines.push('Read: '+day.bible.ref);
      if(day.bible.gems) lines.push('Gem: '+day.bible.gems);
      if(day.bible.verse) lines.push('Verse: '+day.bible.verse);
      if(day.bible.question) lines.push('Question: '+day.bible.question);
    }
    rows.push(el('button',{type:'button',class:'row',onclick:()=>openDay(k)},
      el('div',{class:'meta'},el('span',{class:'when',text:fmtDay(d)}),day?dotsEl(day):null),
      lines.length?lines.map(l=>el('p',{class:'snip',text:l})):el('p',{class:'snip hint',text:'No entry yet'})));
  }
  box.replaceChildren(
    el('h3',{class:'subhead',text:'My week so far'}),
    el('p',{class:'hint',text:'Bible reading days: '+readDays+' of 7. Tap a day to open it.'}),
    el('div',{class:'rows'},rows),
    el('div',{class:'actions'},el('button',{type:'button',class:'btn ghost',onclick:fillWeek},'Fill key scripture and question from my week')),
    weekFillMsg?el('p',{class:'hint',text:weekFillMsg}):null);
}
function fillWeek(){
  const d=WK.draft;
  if(!d) return;
  const m=eff(),start=parseKey(S.weekSel);
  const keys=[];
  for(let i=0;i<7;i++) keys.push(keyOf(addDays(start,i)));
  let n=0;
  const withVerse=keys.map(k=>m[k]).find(day=>day&&day.bible.verse.trim());
  if(withVerse&&!d.keyRef.trim()){
    d.keyRef=withVerse.bible.verse;n++;
    if(!d.keyWhy.trim()&&withVerse.bible.verseWhy.trim()){d.keyWhy=withVerse.bible.verseWhy;n++;}
  }
  const q=Object.values(COLL.questions.items).filter(i=>i.status==='answered'&&keys.indexOf(i.fromDate)>=0).sort((a,b)=>a.createdAt-b.createdAt)[0];
  if(q&&!d.qResearched.trim()){d.qResearched=q.text+(q.answer?'\n\nWhat I found: '+q.answer:'');n++;}
  if(n){WK.touch();WK.paint(true);}
  weekFillMsg=n?'Filled '+n+' empty '+(n===1?'field':'fields')+'. Put the rest in your own words.':'Nothing to fill yet. Save a verse or answer a question this week first.';
  renderWeekLog();
}
function goWeek(k){S.weekSel=k;WK.load(k);MIN.load(minMonth());renderWeek();renderToday();}

/* ---------- history ---------- */
function renderHistory(){
  const m=eff();
  const today=parseKey(todayKey());
  const end=addDays(today,6-today.getDay());
  const start=addDays(end,-41);
  $('heatCap').textContent=fmtShort(start)+' to '+fmtShort(today);
  const cells=[];
  for(let i=0;i<42;i++){
    const d=addDays(start,i),k=keyOf(d);
    if(d>today){cells.push(el('span',{class:'cell empty','aria-hidden':'true'}));continue;}
    const day=m[k];
    const c=day?doneCount(day):0;
    cells.push(el('button',{type:'button',class:'cell c'+c+(k===S.sel?' sel':'')+(k===todayKey()?' today':''),
      'aria-label':fmtShort(d)+': '+c+' of 3 done',onclick:()=>openDay(k)},String(d.getDate())));
  }
  $('heat').replaceChildren(...cells);
  const q=S.hq.trim().toLowerCase();
  const keys=Object.keys(m).filter(k=>HABITS.some(hb=>hasContent(m[k][hb.key]))).sort().reverse();
  const hay=k=>HABITS.map(hb=>TEXTPROPS.map(p=>m[k][hb.key][p]).join(' ')).join(' ').toLowerCase();
  const filtered=q?keys.filter(k=>hay(k).includes(q)):keys;
  const shown=filtered.slice(0,S.histLimit);
  const box=$('histRows');
  if(!shown.length){
    const msg=keys.length?'No entries match "'+S.hq.trim()+'".':(S.fresh?'Your past days will show up here after your first entry.':'Loading your entries...');
    box.replaceChildren(el('p',{class:'empty-note',text:msg}));
  }else{
    box.replaceChildren(...shown.map(k=>dayRow(k,m)));
  }
  $('moreWrap').hidden=filtered.length<=shown.length;
}
function dayRow(k,m){
  const d=parseKey(k),day=m[k];
  const lines=HABITS.filter(hb=>day[hb.key].ref||day[hb.key].note||day[hb.key].verse).map(hb=>{
    const s=day[hb.key];
    return el('p',{class:'snip'},el('b',{text:hb.label+': '}),[s.ref,s.verse,s.note].filter(Boolean).join(' - '));
  });
  return el('button',{type:'button',class:'row',onclick:()=>openDay(k)},
    el('div',{class:'meta'},el('span',{class:'when',text:fmtDay(d)}),dotsEl(day)),
    lines);
}

/* ---------- month ---------- */
function renderMonth(){
  const mk=S.monthSel;
  const p=mk.split('-').map(Number);
  $('monthTitle').textContent=new Date(p[0],p[1]-1,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  $('mnext').disabled=mk>=monthOf(new Date());
  const m=eff();
  const keys=Object.keys(m).filter(k=>k.slice(0,7)===mk);
  const entry=keys.filter(k=>HABITS.some(hb=>hasContent(m[k][hb.key]))).length;
  const cnt=key=>keys.filter(k=>m[k][key].done).length;
  const all3=keys.filter(k=>doneCount(m[k])===3).length;
  const inM=ts=>!!ts&&monthOf(new Date(ts))===mk;
  const vs=Object.values(COLL.verses.items).filter(i=>inM(i.createdAt)).length;
  const qa=Object.values(COLL.questions.items).filter(i=>inM(i.createdAt)).length;
  const qd=Object.values(COLL.questions.items).filter(i=>i.status==='answered'&&inM(i.answeredAt||i.updatedAt)).length;
  const nt=Object.values(COLL.notes.items).filter(i=>inM(i.createdAt)).length;
  const qz=Object.values(S.quizzes).filter(q=>String(q.date).slice(0,7)===mk);
  const tot=qz.reduce((a,q)=>a+q.total,0);
  const avg=tot?Math.round(100*qz.reduce((a,q)=>a+q.score,0)/tot)+'%':'None yet';
  const rows=[['Days with an entry',entry],['Daily text days',cnt('text')],['Bible reading days',cnt('bible')],['Personal study days',cnt('study')],['All three in one day',all3],['Scriptures saved',vs],['Questions asked',qa],['Questions answered',qd],['Notes written',nt],['Quizzes taken',qz.length],['Average quiz score',avg]];
  $('monthStats').replaceChildren(...rows.map(r=>el('div',{class:'stat'},el('span',{text:r[0]}),el('b',{text:String(r[1])}))));
}
function goMonth(delta){
  const p=S.monthSel.split('-').map(Number);
  S.monthSel=monthOf(new Date(p[0],p[1]-1+delta,1));
  MO.load(S.monthSel);
  renderMonth();
}

/* ---------- quiz ---------- */
const SCOPES=[['week','This week'],['month','Last 30 days'],['treasury','Scripture Treasury'],['answered','Answered questions']];
const Q={phase:'setup',scope:'week',n:5,items:[],i:0,results:[],answer:'',busy:false,msg:'',feedback:null,score:0,token:0,mode:'cards',reveal:false};

function dayNotes(k,day){
  const t=day.text,b=day.bible,s=day.study,p=[];
  if(t.ref||t.vtext||t.note||t.apply) p.push('Daily text '+cut(t.ref,100)+'. Verse: '+cut(t.vtext,400)+' Comment: '+cut(t.note,500)+(t.apply?' Use: '+cut(t.apply,300):''));
  if(b.ref||b.summary||b.gems||b.note||b.people||b.verse||b.question) p.push('Bible reading '+cut(b.ref,80)+'. Spiritual gems: '+cut(b.gems,500)+' What it teaches about Jehovah: '+cut(b.note,600)+' What happened: '+cut(b.summary,600)+' People and their choices: '+cut(b.people,400)+' Verse that stood out: '+cut(b.verse,80)+' '+cut(b.verseWhy,300)+' Question: '+cut(b.question,300));
  if(s.ref||s.note||s.apply||s.question) p.push('Personal study '+cut(s.ref,100)+'. Learned: '+cut(s.note,600)+' Apply: '+cut(s.apply,300)+' Question: '+cut(s.question,300));
  return p.length?'['+fmtDay(parseKey(k))+']\n'+p.join('\n'):'';
}
function quizMaterial(scope){
  const m=eff();
  let blocks=[];
  if(scope==='week'||scope==='month'){
    const t=parseKey(todayKey());
    const from=scope==='week'?parseKey(mondayOf(todayKey())):addDays(t,-29);
    for(let d=t;d>=from;d=addDays(d,-1)){
      const k=keyOf(d);
      if(m[k]){const b=dayNotes(k,m[k]);if(b) blocks.push(b);}
    }
  }else if(scope==='treasury'){
    blocks=Object.values(COLL.verses.items).sort((a,b)=>b.updatedAt-a.updatedAt).map(v=>'['+cut(v.ref,80)+'] '+cut(v.text,400)+' Category: '+cut(v.category,60)+'. Context: '+cut(v.context,300)+' Why it matters: '+cut(v.why,300)+' When to use it: '+cut(v.when,300));
  }else{
    blocks=Object.values(COLL.questions.items).filter(i=>i.status==='answered'&&i.answer.trim()).sort((a,b)=>b.updatedAt-a.updatedAt).map(i=>'Question: '+cut(i.text,300)+'\nWhat the user found: '+cut(i.answer,800));
  }
  let out='';
  for(const b of blocks){
    if(out.length+b.length>14000) break;
    out+=(out?'\n\n':'')+b;
  }
  return out.length>=40?out:null;
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
function quizCards(scope){
  const m=eff(),cards=[];
  if(scope==='week'||scope==='month'){
    const t=parseKey(todayKey());
    const from=scope==='week'?parseKey(mondayOf(todayKey())):addDays(t,-29);
    for(let d=t;d>=from;d=addDays(d,-1)){
      const k=keyOf(d),day=m[k];
      if(!day) continue;
      const src=fmtDay(d),b=day.bible,tx=day.text,st=day.study;
      const rd=b.ref||'your Bible reading';
      if(b.gems.trim()) cards.push({q:'What spiritual gems did you find in '+rd+'?',key:b.gems,source:src});
      if(b.note.trim()) cards.push({q:'What did '+rd+' teach you about Jehovah?',key:b.note,source:src});
      if(b.summary.trim()) cards.push({q:'What happened in '+rd+'?',key:b.summary,source:src});
      if(b.people.trim()) cards.push({q:'Who made important choices in '+rd+', and what did they choose?',key:b.people,source:src});
      if(b.verse.trim()&&b.verseWhy.trim()) cards.push({q:'Why did '+b.verse+' stand out to you?',key:b.verseWhy,source:src});
      if(tx.ref.trim()&&tx.vtext.trim()) cards.push({q:'Daily text: what does '+tx.ref.trim()+' say?',key:tx.vtext,source:src});
      if(tx.note.trim()) cards.push({q:'Daily text'+(tx.ref?' ('+tx.ref+')':'')+': what was the main point?',key:tx.note,source:src});
      if(tx.apply.trim()) cards.push({q:'How could you use the daily text'+(tx.ref?' ('+tx.ref+')':'')+'?',key:tx.apply,source:src});
      if(st.note.trim()) cards.push({q:'What did you learn about '+(st.ref||'your personal study topic')+'?',key:st.note,source:src});
    }
  }else if(scope==='treasury'){
    Object.values(COLL.verses.items).forEach(v=>{
      const key=v.why||v.context;
      if(v.ref&&key.trim()) cards.push({q:v.ref+': why does it matter to you?',key:key,source:v.category||''});
    });
  }else{
    Object.values(COLL.questions.items).forEach(i=>{
      if(i.status==='answered'&&i.answer.trim()) cards.push({q:i.text,key:i.answer,source:i.sources||i.ref||''});
    });
  }
  return cards;
}
function quizPrompt(material,n){
  return [
    'You write quiz questions for someone checking how well they remember their own Bible study notes.',
    'Use ONLY the notes below as the source. Do not add facts, doctrine, or interpretation that are not in the notes.',
    'Write '+n+' questions. Mix recall questions (what happened, who, which verse, what did I learn) with a few application questions (how could I use this).',
    'Each question must be answerable from the notes, stay under 30 words, and differ from the others.',
    'Reply with JSON only, in this shape: {"questions":[{"q":"the question","key":"the answer as it appears in the notes","source":"short label such as the date or the reading"}]}',
    '',
    'NOTES:',
    material
  ].join('\n');
}
function gradePrompt(item,answer){
  return [
    "You are checking a learner's answer to a question about their own Bible study notes.",
    'Judge the answer only against the reference answer taken from their notes. Be encouraging and brief: at most 2 sentences.',
    'For application questions, accept any sensible answer that connects to the notes.',
    'If the answer is partly right, say what is missing. If it adds something that is not in the notes, do not call it wrong; tell the learner to check it in their Bible or the publications.',
    'Reply with JSON only: {"verdict":"correct" or "partial" or "missed","feedback":"your short feedback"}',
    '',
    'Question: '+item.q,
    'Reference answer from the notes: '+(item.key||'(none given)'),
    'Learner answer: '+(answer||'(no answer)')
  ].join('\n');
}
function renderQuiz(){
  const box=$('revQuiz');
  box.replaceChildren();
  if(Q.phase==='setup') renderQuizSetup(box);
  else if(Q.phase==='run') renderQuizRun(box);
  else renderQuizDone(box);
}
function renderQuizSetup(box){
  const ai=aiReady();
  if(!ai&&Q.mode==='ai') Q.mode='cards';
  box.append(el('h2',{class:'sect',text:'Quiz'}),
    el('p',{class:'hint',text:Q.mode==='ai'?'AI writes questions from your own notes only, then checks your answers.':'Flashcards made from your own notes. Think of the answer first, then check what you wrote.'}));
  if(ai) box.append(el('div',{class:'subtabs'},[['cards','Flashcards'],['ai','AI questions']].map(m=>el('button',{type:'button',class:'pill','aria-pressed':String(Q.mode===m[0]),onclick:()=>{Q.mode=m[0];renderQuiz();}},m[1]))));
  else box.append(el('p',{class:'hint',text:'To get AI-written questions and grading, add an API key under Settings.'}));
  box.append(el('div',{class:'subtabs'},SCOPES.map(s=>el('button',{type:'button',class:'pill','aria-pressed':String(Q.scope===s[0]),onclick:()=>{Q.scope=s[0];renderQuiz();}},s[1]))));
  box.append(el('div',{class:'subtabs'},[5,10].map(n=>el('button',{type:'button',class:'pill','aria-pressed':String(Q.n===n),onclick:()=>{Q.n=n;renderQuiz();}},n+' questions'))));
  const go=el('button',{type:'button',class:'btn',onclick:startQuiz},Q.busy?'Writing questions...':'Start quiz');
  go.disabled=Q.busy;
  box.append(el('div',{class:'actions'},go));
  if(Q.msg) box.append(el('p',{class:'hint',text:Q.msg}));
  const recent=Object.values(S.quizzes).sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
  if(recent.length){
    box.append(el('h3',{class:'subhead',text:'Recent quizzes'}));
    box.append(el('div',{class:'rows'},recent.map(q=>{
      const label=(SCOPES.find(s=>s[0]===q.scope)||['',q.scope])[1];
      return el('div',{class:'stat'},el('span',{text:(q.date?fmtDay(parseKey(q.date)):'')+' - '+label}),el('b',{text:q.score+' of '+q.total}));
    })));
  }
}
function renderQuizRun(box){
  const it=Q.items[Q.i];
  box.append(el('p',{class:'cap',text:'Question '+(Q.i+1)+' of '+Q.items.length}));
  if(Q.mode==='cards'){
    const card=el('div',{class:'qcard'},el('p',{class:'qtext',text:it.q}));
    if(!Q.reveal){
      card.append(el('div',{class:'actions'},el('button',{type:'button',class:'btn',onclick:()=>{Q.reveal=true;renderQuiz();}},'Show my notes')));
    }else{
      card.append(richText(it.key));
      if(it.source) card.append(el('p',{class:'hint',text:'From: '+it.source}));
      card.append(el('p',{class:'hint',text:'How did you do?'}),
        el('div',{class:'actions'},[['correct','I knew it'],['partial','Partly'],['missed','Missed']].map(g=>el('button',{type:'button',class:g[0]==='correct'?'btn':'btn ghost',onclick:()=>{Q.feedback={verdict:g[0],feedback:''};nextQ();}},g[1]))));
    }
    box.append(card,el('div',{class:'actions'},el('button',{type:'button',class:'link',onclick:stopQuiz},'Stop quiz')));
    return;
  }
  const ans=el('textarea',{id:'quizAns',rows:4,placeholder:'Type your answer',autocomplete:'off'});
  ans.value=Q.answer;
  ans.disabled=!!Q.feedback;
  ans.addEventListener('input',()=>{Q.answer=ans.value;});
  const card=el('div',{class:'qcard'},el('p',{class:'qtext',text:it.q}),el('div',{class:'field'},el('label',{for:'quizAns',text:'Your answer'}),ans));
  if(Q.feedback){
    const v=Q.feedback.verdict;
    card.append(el('span',{class:'verdict '+v,text:v==='correct'?'Correct':v==='partial'?'Partly right':'Missed'}));
    if(Q.feedback.feedback) card.append(el('p',{text:Q.feedback.feedback}));
    if(it.key) card.append(el('p',{class:'hint',text:'Your notes say: '+it.key}));
    if(it.source) card.append(el('p',{class:'hint',text:'From: '+it.source}));
    card.append(el('div',{class:'actions'},el('button',{type:'button',class:'btn',onclick:nextQ},Q.i+1>=Q.items.length?'See results':'Next question')));
  }else{
    const chk=el('button',{type:'button',class:'btn',onclick:checkAnswer},Q.busy?'Checking...':'Check answer');
    chk.disabled=Q.busy;
    card.append(el('div',{class:'actions'},chk,el('button',{type:'button',class:'btn ghost',onclick:skipQ},"I don't know")));
  }
  box.append(card,el('div',{class:'actions'},el('button',{type:'button',class:'link',onclick:stopQuiz},'Stop quiz')));
  if(Q.msg) box.append(el('p',{class:'hint',text:Q.msg}));
}
function renderQuizDone(box){
  box.append(el('h2',{class:'sect',text:'You scored '+Q.score+' of '+Q.results.length}),
    el('p',{class:'hint',text:'This quiz is saved in your Month review.'}));
  box.append(el('div',{class:'rows'},Q.results.map(r=>el('div',{class:'row'},
    el('p',{class:'snip',text:r.q}),
    el('span',{class:'verdict '+r.verdict,text:r.verdict==='correct'?'Correct':r.verdict==='partial'?'Partly right':'Missed'})))));
  box.append(el('div',{class:'actions'},el('button',{type:'button',class:'btn',onclick:()=>{Q.phase='setup';Q.items=[];Q.results=[];Q.msg='';renderQuiz();}},'Take another quiz')));
}
async function startQuiz(){
  if(Q.busy) return;
  if(Q.mode==='cards'){
    const cards=quizCards(Q.scope);
    if(!cards.length){Q.msg='There is not enough in your notes for that set yet. Add a few entries first, or choose a different set.';renderQuiz();return;}
    shuffle(cards);
    Q.items=cards.slice(0,Q.n);Q.i=0;Q.results=[];Q.answer='';Q.feedback=null;Q.reveal=false;Q.msg='';Q.phase='run';
    renderQuiz();
    return;
  }
  const mat=quizMaterial(Q.scope);
  if(!mat){Q.msg='There is not enough in your notes for that set yet. Add a few entries first, or choose a different set.';renderQuiz();return;}
  const token=++Q.token;
  Q.busy=true;Q.msg='';renderQuiz();
  try{
    const data=await claudeJson(quizPrompt(mat,Q.n));
    if(token!==Q.token) return;
    const raw=data&&Array.isArray(data.questions)?data.questions:(Array.isArray(data)?data:[]);
    const list=raw.filter(x=>x&&typeof x.q==='string'&&x.q.trim()).slice(0,Q.n).map(x=>({q:String(x.q).trim(),key:String(x.key||'').trim(),source:String(x.source||'').trim()}));
    if(!list.length) throw {code:'invalid_json'};
    Q.items=list;Q.i=0;Q.results=[];Q.answer='';Q.feedback=null;Q.reveal=false;Q.phase='run';
  }catch(e){
    if(token===Q.token) Q.msg=helpError(e);
  }finally{
    if(token===Q.token){Q.busy=false;renderQuiz();}
  }
}
async function checkAnswer(){
  if(Q.busy) return;
  const it=Q.items[Q.i];
  if(!Q.answer.trim()){Q.msg='Type an answer first, or tap "I don\'t know".';renderQuiz();return;}
  const token=Q.token;
  Q.busy=true;Q.msg='';renderQuiz();
  try{
    const r=await claudeJson(gradePrompt(it,Q.answer));
    if(token!==Q.token) return;
    const v=r&&['correct','partial','missed'].indexOf(r.verdict)>=0?r.verdict:null;
    if(!v) throw {code:'invalid_json'};
    Q.feedback={verdict:v,feedback:String(r.feedback||'').trim()};
  }catch(e){
    if(token===Q.token) Q.msg=helpError(e);
  }finally{
    if(token===Q.token){Q.busy=false;renderQuiz();}
  }
}
function skipQ(){
  Q.feedback={verdict:'missed',feedback:'No problem. Here is what your notes say.'};
  renderQuiz();
}
function nextQ(){
  const it=Q.items[Q.i];
  Q.results.push({q:it.q,verdict:Q.feedback?Q.feedback.verdict:'missed'});
  Q.feedback=null;Q.answer='';Q.msg='';Q.reveal=false;
  if(Q.i+1>=Q.items.length) finishQuiz(); else {Q.i++;renderQuiz();}
}
function stopQuiz(){
  Q.token++;
  Q.phase='setup';Q.items=[];Q.results=[];Q.feedback=null;Q.answer='';Q.msg='';Q.busy=false;
  renderQuiz();
}
function finishQuiz(){
  const score=Q.results.reduce((a,r)=>a+(r.verdict==='correct'?1:r.verdict==='partial'?0.5:0),0);
  const now=Date.now();
  const id=newId('quizzes');
  const doc={id:id,date:todayKey(),scope:Q.scope,total:Q.results.length,score:score,results:Q.results.map(r=>({q:cut(r.q,200),verdict:r.verdict})),createdAt:now,updatedAt:now};
  S.quizzes[id]=normQuiz(doc,id);
  enqueue('quizzes',id,clone(doc));
  Q.score=score;
  Q.phase='done';
  renderQuiz();
}

/* ---------- Bible read-through ---------- */
const BOOKS=[['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],['Joshua',24],['Judges',21],['Ruth',4],['1 Samuel',31],['2 Samuel',24],['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],['Ezra',10],['Nehemiah',13],['Esther',10],['Job',42],['Psalms',150],['Proverbs',31],['Ecclesiastes',12],['Song of Solomon',8],['Isaiah',66],['Jeremiah',52],['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],['Joel',3],['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],['Habakkuk',3],['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],
  ['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],['Romans',16],['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],['Ephesians',6],['Philippians',4],['Colossians',4],['1 Thessalonians',5],['2 Thessalonians',3],['1 Timothy',6],['2 Timothy',4],['Titus',3],['Philemon',1],['Hebrews',13],['James',5],['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],['3 John',1],['Jude',1],['Revelation',22]];
const NT_START=39;
const TOTAL_CH=BOOKS.reduce((a,b)=>a+b[1],0);
const B={ui:null,sec:'ot',open:null};

function normBible(v){
  const o={read:{},rounds:Number(v&&v.rounds)||0,updatedAt:Number(v&&v.updatedAt)||0};
  const r=(v&&v.read)||{};
  BOOKS.forEach((b,i)=>{
    const a=Array.isArray(r[String(i)])?r[String(i)]:[];
    const set=new Set(a.map(Number).filter(n=>n>=1&&n<=b[1]));
    if(set.size) o.read[String(i)]=Array.from(set).sort((x,y)=>x-y);
  });
  return o;
}
function countRead(){return Object.values(S.bible.read).reduce((a,x)=>a+x.length,0);}
function saveBible(){
  S.bible.updatedAt=Date.now();
  setStatus('Saving...');
  enqueue('progress','bible',clone(S.bible));
}
function setBookRead(i,set){
  if(set.size) S.bible.read[String(i)]=Array.from(set).sort((a,b)=>a-b);
  else delete S.bible.read[String(i)];
  saveBible();
  renderBible();
}
function toggleCh(i,ch){
  const cur=new Set(S.bible.read[String(i)]||[]);
  if(cur.has(ch)) cur.delete(ch); else cur.add(ch);
  setBookRead(i,cur);
}
function newRound(){
  S.bible.rounds=(S.bible.rounds||0)+1;
  S.bible.read={};
  saveBible();
  renderBible();
}
function renderBible(){
  const box=B.ui;
  if(!box) return;
  box.replaceChildren();
  if(B.open!==null){renderBook(box);return;}
  const total=countRead();
  const pct=Math.round(100*total/TOTAL_CH);
  box.append(el('h2',{class:'sect',text:'Bible read-through'}),
    el('div',{class:'pbar',role:'img','aria-label':pct+' percent read'},el('i',{style:'width:'+pct+'%'})),
    el('p',{class:'hint',text:total+' of '+TOTAL_CH+' chapters ('+pct+'%)'+(S.bible.rounds?'. Read-throughs finished: '+S.bible.rounds:'')}));
  if(total===TOTAL_CH) box.append(el('div',{class:'actions'},el('button',{type:'button',class:'btn',onclick:newRound},'Start a new read-through')));
  box.append(el('div',{class:'subtabs'},[['ot','Hebrew-Aramaic Scriptures'],['nt','Christian Greek Scriptures']].map(s=>el('button',{type:'button',class:'pill','aria-pressed':String(B.sec===s[0]),onclick:()=>{B.sec=s[0];renderBible();}},s[1]))));
  const from=B.sec==='ot'?0:NT_START,to=B.sec==='ot'?NT_START:BOOKS.length;
  const rows=[];
  for(let i=from;i<to;i++){
    const n=(S.bible.read[String(i)]||[]).length,t=BOOKS[i][1];
    rows.push(el('button',{type:'button',class:'row',onclick:()=>{B.open=i;renderBible();window.scrollTo(0,0);}},
      el('div',{class:'meta'},el('span',{class:'when',text:BOOKS[i][0]}),el('span',{text:n+' of '+t})),
      el('div',{class:'pbar',style:'margin-top:8px'},el('i',{style:'width:'+Math.round(100*n/t)+'%'}))));
  }
  box.append(el('div',{class:'rows'},rows));
}
function renderBook(box){
  const i=B.open,b=BOOKS[i],set=new Set(S.bible.read[String(i)]||[]);
  box.append(el('div',{class:'bar'},el('button',{type:'button',class:'link',onclick:()=>{B.open=null;renderBible();}},'Back to all books')),
    el('h2',{class:'sect',text:b[0]}),
    el('p',{class:'hint',text:set.size+' of '+b[1]+' chapters read. Tap a chapter to mark it.'}));
  const grid=el('div',{class:'chgrid'});
  for(let c=1;c<=b[1];c++){
    grid.append(el('button',{type:'button',class:'chbtn','aria-pressed':String(set.has(c)),'aria-label':b[0]+' chapter '+c,onclick:()=>toggleCh(i,c)},String(c)));
  }
  box.append(grid,el('div',{class:'actions'},
    el('button',{type:'button',class:'btn ghost',onclick:()=>setBookRead(i,new Set(Array.from({length:b[1]},(_,k)=>k+1)))},'Mark all read'),
    el('button',{type:'button',class:'btn ghost',onclick:()=>setBookRead(i,new Set())},'Clear this book')));
}
function onProgress(snap){
  const d=snap.docs.find(x=>x.id==='bible');
  if(d&&!pending.has('progress/bible')&&!writing) S.bible=normBible(d.data());
  if(S.tab==='library'&&S.lib==='bible') renderBible();
}

const BOOK_KEYS=BOOKS.map(b=>normBook(b[0]));
function normBook(s){return String(s).toLowerCase().replace(/[^a-z0-9]/g,'');}
function findBook(text){
  let k=normBook(text);
  if(!k) return -1;
  if(k==='psalm') k='psalms';
  if(k==='song'||k==='songofsongs') k='songofsolomon';
  const i=BOOK_KEYS.indexOf(k);
  if(i>=0) return i;
  const hits=[];
  BOOK_KEYS.forEach((x,j)=>{if(x.indexOf(k)===0) hits.push(j);});
  return hits.length===1?hits[0]:-1;
}
function parseRef(text){
  const out=[],errs=[];
  String(text||'').split(';').map(s=>s.trim()).filter(Boolean).forEach(seg=>{
    const m=seg.match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z.\s]*?)\s*(\d[\d\s,:\-–—]*)$/);
    if(!m){errs.push(seg);return;}
    const bi=findBook(m[1]);
    if(bi<0){errs.push(seg);return;}
    const max=BOOKS[bi][1],spec=m[2].replace(/\s+/g,'');
    const chs=new Set();
    if(spec.indexOf(':')>=0){
      const r=spec.match(/^(\d+):(\d+)(?:[-–—](\d+)(?::(\d+))?)?$/);
      if(!r){errs.push(seg);return;}
      const c1=+r[1];
      let c2=c1;
      if(r[3]&&r[4]) c2=+r[3];
      for(let c=c1;c<=c2&&c<=c1+200;c++) chs.add(c);
    }else{
      spec.split(',').forEach(part=>{
        const r=part.match(/^(\d+)(?:[-–—](\d+))?$/);
        if(!r) return;
        const a=+r[1],b=r[2]?+r[2]:a;
        for(let c=a;c<=b&&c<=a+200;c++) chs.add(c);
      });
    }
    const ok=Array.from(chs).filter(c=>c>=1&&c<=max).sort((x,y)=>x-y);
    if(!ok.length){errs.push(seg);return;}
    out.push({bi:bi,chapters:ok});
  });
  return {out:out,errs:errs};
}
function rangeText(chs){
  const parts=[];
  let s=chs[0],p=chs[0];
  for(let i=1;i<=chs.length;i++){
    if(chs[i]===p+1){p=chs[i];continue;}
    parts.push(s===p?String(s):s+'-'+p);
    s=chs[i];p=chs[i];
  }
  return parts.join(', ');
}
function markChapters(){
  const msg=$('markmsg');
  const r=parseRef(draft.bible.ref);
  msg.hidden=false;
  if(!r.out.length){msg.textContent='Could not read that reading. Try a format like Genesis 1-5.';return;}
  r.out.forEach(o=>{
    const set=new Set(S.bible.read[String(o.bi)]||[]);
    o.chapters.forEach(c=>set.add(c));
    S.bible.read[String(o.bi)]=Array.from(set).sort((a,b)=>a-b);
  });
  saveBible();
  msg.textContent='Marked read: '+r.out.map(o=>BOOKS[o.bi][0]+' '+rangeText(o.chapters)).join('; ')+(r.errs.length?'. Could not read: '+r.errs.join('; '):'');
  if(S.tab==='library'&&S.lib==='bible') renderBible();
}

/* ---------- weekly review ---------- */
function weekReviewPrompt(material,d){
  return [
    'You help someone reflect on a week of personal Bible study.',
    'Ask exactly 3 reflection questions based ONLY on the notes below. Each question should point to something specific they wrote (a reading, a verse, a question they had, or something they learned) and help them think deeper or connect it to their life.',
    'Do not answer the questions. Do not add facts that are not in the notes. Keep each question under 30 words.',
    'Reply with JSON only: {"questions":["...","...","..."]}',
    '',
    'Assigned reading this week: '+(d.reading||'(not given)'),
    '',
    'NOTES:',
    material
  ].join('\n');
}
function localWeekQuestions(days){
  const c=[];
  days.forEach(x=>{
    const b=x.day.bible;
    if(b.gems.trim()) c.push('You found a spiritual gem in '+(b.ref||'your reading')+'. How could you put it into words at the midweek meeting?');
    if(b.verse.trim()) c.push('Why did '+b.verse.trim()+' stand out to you, and how does it connect to what you read in '+(b.ref||'your reading')+'?');
    if(b.question.trim()) c.push('You asked: "'+cut(b.question,120)+'" Have you found an answer yet? Where will you look?');
    if(b.note.trim()) c.push('You noted something from '+(b.ref||'your reading')+'. How can you copy a good quality or avoid a mistake you saw?');
  });
  shuffle(c);
  const generic=['Which reading this week taught you the most about Jehovah, and why?','What is one change you will make because of what you studied this week?','What question do you still want to research next week?'];
  return c.slice(0,3).concat(generic).slice(0,3);
}
function renderWeekReview(){
  const box=$('weekReview');
  if(!box||!WK.draft) return;
  const qs=String(WK.draft.reviewQs||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const ai=aiReady();
  box.replaceChildren(
    el('p',{class:'hint',text:ai?'Questions are written from your notes for this week.':'These questions come from your notes. For questions written by AI, add an API key under Settings.'}),
    qs.length?el('ol',{class:'qlist'},qs.map(q=>el('li',{text:q}))):null,
    el('div',{class:'actions'},el('button',{type:'button',class:'btn ghost',id:'askWeek',onclick:askWeek},qs.length?'Ask 3 new questions':'Ask me 3 questions about my week')));
}
async function askWeek(){
  const d=WK.draft;
  if(!d) return;
  const id=WK.id;
  const start=parseKey(S.weekSel),m=eff(),days=[],blocks=[];
  for(let i=0;i<7;i++){
    const k=keyOf(addDays(start,i));
    if(m[k]){
      const b=dayNotes(k,m[k]);
      if(b){blocks.push(b);days.push({k:k,day:m[k]});}
    }
  }
  const btn=$('askWeek');
  if(!blocks.length){setStatus('Add some notes this week first, then ask for questions.');return;}
  let qs;
  if(aiReady()){
    btn.disabled=true;btn.textContent='Thinking...';
    try{
      const data=await claudeJson(weekReviewPrompt(blocks.join('\n\n').slice(0,14000),d));
      const raw=data&&Array.isArray(data.questions)?data.questions:[];
      qs=raw.map(x=>String(x||'').trim()).filter(Boolean).slice(0,3);
      if(!qs.length) throw {code:'invalid_json'};
    }catch(e){
      const msg=helpError(e);
      if(msg) setStatus(msg,'err');
      renderWeekReview();
      return;
    }
  }else{
    qs=localWeekQuestions(days);
  }
  if(WK.id!==id||!WK.draft) return;
  WK.draft.reviewQs=qs.join('\n');
  WK.touch();
  renderWeekReview();
}
function renderSunBanner(){
  const b=$('sunBanner');
  if(!b) return;
  const wk=mondayOf(todayKey());
  const w=(WK.draft&&WK.draft.start===wk)?WK.draft:WK.map[wk];
  const done=!!(w&&String(w.reviewAns||'').trim());
  if(!(S.sel===todayKey()&&new Date().getDay()===0)||done){b.hidden=true;return;}
  b.hidden=false;
  b.replaceChildren(el('p',{text:"It's Sunday. Finish your weekly summary and review."}),
    el('button',{type:'button',class:'btn',onclick:()=>{
      S.weekSel=wk;setTab('week');
      const f=$('weekFold');
      if(f){f.open=true;f.scrollIntoView({block:'start'});}
    }},'Open this week'));
}

/* ---------- verse review ---------- */
const V={phase:'idle',queue:[],i:0,reveal:false,done:0,got:0};
const INTERVALS=[3,7,14,30,60,120];
function dueVerses(){
  const t=todayKey();
  return Object.values(COLL.verses.items).filter(v=>v.ref&&(!v.nextReview||v.nextReview<=t))
    .sort((a,b)=>(a.nextReview||'').localeCompare(b.nextReview||'')||a.createdAt-b.createdAt);
}
function gradeVerse(ok){
  const v=V.queue[V.i];
  const item=clone(COLL.verses.items[v.id]||v);
  const t=parseKey(todayKey());
  if(ok){
    item.level=Math.min((item.level||0)+1,INTERVALS.length);
    item.nextReview=keyOf(addDays(t,INTERVALS[item.level-1]));
    V.got++;
  }else{
    item.level=0;
    item.nextReview=keyOf(addDays(t,1));
  }
  item.lastReviewed=todayKey();
  item.updatedAt=Date.now();
  COLL.verses.items[item.id]=item;
  enqueue('verses',item.id,clone(item));
  V.done++;V.reveal=false;
  if(V.i+1>=V.queue.length) V.phase='done'; else V.i++;
  renderVerses();
}
function renderVerses(){
  const box=$('revVerses');
  box.replaceChildren();
  const all=Object.values(COLL.verses.items).filter(v=>v.ref);
  if(V.phase==='run'){
    const v=V.queue[V.i];
    box.append(el('p',{class:'cap',text:'Verse '+(V.i+1)+' of '+V.queue.length}));
    const card=el('div',{class:'qcard'},el('p',{class:'vref',text:v.ref}),v.category?el('span',{class:'chip',text:v.category}):null);
    if(!V.reveal){
      card.append(el('p',{class:'hint',text:'Say what this verse says and why it matters to you. Then check your notes.'}),
        el('div',{class:'actions'},el('button',{type:'button',class:'btn',onclick:()=>{V.reveal=true;renderVerses();}},'Show my notes')));
    }else{
      [['Scripture text',v.text],['Context',v.context],['Why it matters to me',v.why],['When I could use it',v.when]].forEach(p=>{
        if(p[1]) card.append(el('p',{class:'cap',text:p[0]}),richText(p[1]));
      });
      if(!(v.text||v.context||v.why||v.when)) card.append(el('p',{class:'hint',text:'You have not added notes for this verse yet. Open it in the Treasury to add some.'}));
      card.append(el('div',{class:'actions'},
        el('button',{type:'button',class:'btn',onclick:()=>gradeVerse(true)},'Got it'),
        el('button',{type:'button',class:'btn ghost',onclick:()=>gradeVerse(false)},'Needs more time')));
    }
    box.append(card,el('div',{class:'actions'},el('button',{type:'button',class:'link',onclick:()=>{V.phase='idle';renderVerses();}},'Stop review')));
    return;
  }
  if(V.phase==='done'){
    box.append(el('h2',{class:'sect',text:'Review done'}),
      el('p',{text:'You went through '+V.done+(V.done===1?' verse. ':' verses. ')+V.got+' marked "Got it". The others come back tomorrow.'}),
      el('div',{class:'actions'},el('button',{type:'button',class:'btn',onclick:()=>{V.phase='idle';renderVerses();}},'Back')));
    return;
  }
  const due=dueVerses();
  const go=el('button',{type:'button',class:'btn',id:'startVerses',onclick:()=>{
    V.queue=dueVerses().slice(0,10);V.i=0;V.reveal=false;V.done=0;V.got=0;V.phase='run';renderVerses();
  }},'Start review');
  go.disabled=!due.length;
  box.append(el('h2',{class:'sect',text:'Verse review'}),
    el('p',{class:'hint',text:'Verses from your Scripture Treasury come back on a schedule. The ones you remember come back less often.'}),
    el('p',{text:all.length?due.length+' of '+all.length+(all.length===1?' verse is':' verses are')+' due today.':'Your Scripture Treasury is empty. Save verses from your daily reading first.'}),
    el('div',{class:'actions'},go));
}

/* ---------- backup and restore ---------- */
function flushAll(){
  commitDay();
  WK.commit();
  MO.commit();
  MIN.commit();
  Object.keys(COLL).forEach(k=>commitColl(COLL[k]));
}
function collectBackup(){
  flushAll();
  const docs=[];
  Object.values(S.days).forEach(d=>docs.push({coll:'days',id:d.date,data:d}));
  Object.keys(WK.map).forEach(k=>docs.push({coll:'weeks',id:k,data:WK.map[k]}));
  Object.keys(MO.map).forEach(k=>docs.push({coll:'months',id:k,data:MO.map[k]}));
  Object.keys(MIN.map).forEach(k=>docs.push({coll:'ministry',id:k,data:MIN.map[k]}));
  Object.values(S.quizzes).forEach(q=>docs.push({coll:'quizzes',id:q.id,data:q}));
  Object.keys(COLL).forEach(k=>Object.values(COLL[k].items).forEach(i=>docs.push({coll:COLL[k].cfg.coll,id:i.id,data:i})));
  docs.push({coll:'progress',id:'bible',data:S.bible});
  return {app:'study-log',version:1,exportedAt:new Date().toISOString(),docs:docs};
}
function importDocs(list){
  const allowed=new Set(['days','weeks','months','ministry','quizzes','progress'].concat(Object.keys(COLL).map(k=>COLL[k].cfg.coll)));
  let n=0;
  list.forEach(x=>{
    if(x&&typeof x.coll==='string'&&typeof x.id==='string'&&x.id&&allowed.has(x.coll)&&x.data&&typeof x.data==='object'){
      enqueue(x.coll,x.id,x.data);
      n++;
    }
  });
  return n;
}

/* ---------- settings ---------- */
const FB_RULES="rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{uid}/{document=**} {\n      allow read, write: if request.auth != null && request.auth.uid == uid;\n    }\n  }\n}";
function labeled(label,input){return el('div',{class:'field'},el('label',{for:input.id,text:label}),input);}
function aiSection(D,set){
  const prov=el('select',{id:'s-provider'},[['none','Off'],['anthropic','Claude (Anthropic)'],['openai','ChatGPT (OpenAI)']].map(o=>el('option',{value:o[0],text:o[1]})));
  prov.value=set.provider;
  const key=el('input',{type:'password',id:'s-key',autocomplete:'off',placeholder:'Paste your API key'});
  key.value=set.key;
  const model=el('input',{type:'text',id:'s-model',autocomplete:'off'});
  model.value=set.model;
  const msg=el('p',{class:'hint',id:'s-aimsg'});
  const upd=()=>{model.placeholder=prov.value==='anthropic'?'Leave blank to use claude-haiku-5-5':prov.value==='openai'?'Required: a model name from OpenAI':'';};
  prov.addEventListener('change',upd);
  upd();
  const save=()=>D.saveSettings({provider:prov.value,key:key.value.trim(),model:model.value.trim()});
  const saveBtn=el('button',{type:'button',class:'btn',id:'s-aisave',onclick:()=>{
    msg.textContent=save()?'Saved.':'Could not save in this browser.';
    renderWeekReview();
  }},'Save');
  const testBtn=el('button',{type:'button',class:'btn ghost',id:'s-aitest',onclick:async()=>{
    save();
    msg.textContent='Testing...';
    try{
      const t=await claudeText('Reply with the single word OK.');
      msg.textContent='It works. The AI answered: '+t.slice(0,40);
    }catch(e){
      msg.textContent=helpError(e)||'Test stopped.';
    }
  }},'Test');
  return el('section',{class:'setsec'},
    el('h3',{text:'AI help'}),
    el('p',{class:'note'},el('b',{text:'Optional. The app works fully without this.'}),' Skip this unless you want extra study help.'),
    el('p',{text:'It adds Study help and Research help buttons, and AI-written quiz and weekly review questions.'}),
    el('ul',{class:'qlist hint'},
      el('li',{text:'You need your own key from an AI company, and they charge a small amount each time you use it.'}),
      el('li',{text:'Your key stays on this device and is sent only to that company.'}),
      el('li',{text:'Always check what it says against your Bible and the publications.'})),
    labeled('Provider',prov),labeled('API key',key),labeled('Model (optional for Claude)',model),
    el('div',{class:'actions'},saveBtn,testBtn),msg);
}
function syncSection(D,set){
  const info=D.syncInfo();
  const msg=el('p',{class:'hint',id:'s-syncmsg'});
  const status=info.mode==='cloud'?'Sync is on. Signed in as '+info.email+'.':info.configured?'Sync is set up but not connected. '+(info.note||''):'Sync is off. Your entries stay on this device.';
  const cfg=el('textarea',{id:'s-fb',rows:5,placeholder:'Paste the firebaseConfig block here',autocomplete:'off',spellcheck:'false'});
  cfg.value=set.firebase;
  const email=el('input',{type:'text',id:'s-email',autocomplete:'username',placeholder:'Email'});
  const pw=el('input',{type:'password',id:'s-pw',autocomplete:'current-password',placeholder:'Password, 6 or more characters'});
  const saveCfg=()=>{
    const t=cfg.value.trim();
    if(t&&!D.parseFbConfig(t)){msg.textContent='That does not look like the Firebase config. It should include apiKey and projectId.';return false;}
    D.saveSettings({firebase:t});
    return true;
  };
  const go=async create=>{
    if(!saveCfg()) return;
    msg.textContent='Working...';
    try{
      await D.cloudAuth(email.value.trim(),pw.value,create);
      msg.textContent='Signed in. Reloading...';
      setTimeout(()=>location.reload(),600);
    }catch(e){
      msg.textContent=D.friendlyAuthError(e);
    }
  };
  const steps=el('details',{},el('summary',{text:'How to set up sync (about 10 minutes)'}),
    el('ol',{class:'qlist'},
      el('li',{text:'Go to console.firebase.google.com, sign in with a Google account, and choose Add project. Turn Google Analytics off.'}),
      el('li',{text:'In the project, open Build, then Authentication, then Get started. Turn on Email/Password.'}),
      el('li',{text:'Open Build, then Firestore Database, then Create database. Pick any location and start in production mode.'}),
      el('li',{text:'In Firestore, open the Rules tab. Replace everything with the rules below, then Publish.'}),
      el('li',{text:'Open Project settings (the gear), then General. Under Your apps, add a Web app. Copy the firebaseConfig block and paste it below.'}),
      el('li',{text:'Create an account below with an email and password. Do the same on your other devices and sign in.'})),
    el('pre',{class:'code',text:FB_RULES}),
    el('p',{class:'hint',text:'If sign-in says this site is not authorized, add its address under Authentication, Settings, Authorized domains.'}));
  const kids=[el('h3',{text:'Sync across devices'}),el('p',{class:'hint',id:'s-syncstatus',text:status}),steps];
  if(info.mode==='cloud'){
    kids.push(el('div',{class:'actions'},
      el('button',{type:'button',class:'btn ghost',id:'s-copylocal',onclick:()=>{
        const list=D.localDump();
        if(!list.length){msg.textContent='Nothing on this device to copy.';return;}
        const n=importDocs(list);
        msg.textContent='Copying '+n+' entries to sync. If both have the same day or item, this device\'s version replaces the synced one.';
      }},'Copy this device\'s entries to sync'),
      el('button',{type:'button',class:'btn ghost',id:'s-signout',onclick:async()=>{
        try{await D.cloudSignOut();}catch(e){}
        location.reload();
      }},'Sign out'),
      el('button',{type:'button',class:'btn danger',id:'s-syncoff',onclick:()=>{D.saveSettings({firebase:''});location.reload();}},'Turn sync off')));
  }else{
    kids.push(labeled('Firebase config',cfg),labeled('Email',email),labeled('Password',pw),
      el('div',{class:'actions'},
        el('button',{type:'button',class:'btn',id:'s-signin',onclick:()=>go(false)},'Sign in'),
        el('button',{type:'button',class:'btn ghost',id:'s-signup',onclick:()=>go(true)},'Create account')));
  }
  kids.push(msg);
  return el('section',{class:'setsec'},kids);
}
function backupSection(){
  const area=el('textarea',{id:'s-backup',rows:5,placeholder:'Backup text appears here. To restore, paste a backup here.',autocomplete:'off',spellcheck:'false'});
  const msg=el('p',{class:'hint',id:'s-backupmsg'});
  const confirm=el('div',{class:'confirm',hidden:true},
    el('p',{text:'Restore will add everything in the backup. Entries with the same date or id are replaced.'}),
    el('div',{class:'bar'},
      el('button',{type:'button',class:'btn',id:'s-restoreyes',onclick:()=>{
        confirm.hidden=true;
        let obj=null;
        try{obj=JSON.parse(area.value);}catch(e){}
        if(!obj||!Array.isArray(obj.docs)){msg.textContent='That is not a backup from this app.';return;}
        const n=importDocs(obj.docs);
        msg.textContent='Restoring '+n+' entries...';
      }},'Restore'),
      el('button',{type:'button',class:'btn ghost',onclick:()=>{confirm.hidden=true;}},'Cancel')));
  return el('section',{class:'setsec'},
    el('h3',{text:'Backup'}),
    el('p',{class:'hint',text:'A backup is a block of text with all your entries. Save it somewhere safe, like a note to yourself.'}),
    area,
    el('div',{class:'actions'},
      el('button',{type:'button',class:'btn',id:'s-makebackup',onclick:async()=>{
        const text=JSON.stringify(collectBackup());
        area.value=text;
        let copied=false;
        try{await navigator.clipboard.writeText(text);copied=true;}catch(e){}
        msg.textContent=copied?'Backup copied. It is also in the box above.':'Backup is in the box above. Select all and copy it.';
      }},'Create backup'),
      el('button',{type:'button',class:'btn ghost',id:'s-download',onclick:()=>{
        const blob=new Blob([JSON.stringify(collectBackup())],{type:'application/json'});
        const a=el('a',{href:URL.createObjectURL(blob),download:'study-log-backup-'+todayKey()+'.json'});
        document.body.append(a);a.click();a.remove();
      }},'Download file'),
      el('button',{type:'button',class:'btn ghost',id:'s-restore',onclick:()=>{confirm.hidden=false;}},'Restore from the box')),
    confirm,msg);
}
function weekSection(D){
  const cb=el('input',{type:'checkbox',id:'s-family'});
  cb.checked=D.settings.showFamily!==false;
  cb.addEventListener('change',()=>{D.saveSettings({showFamily:cb.checked});WK.paint(false);});
  return el('section',{class:'setsec'},
    el('h3',{text:'Week page'}),
    el('div',{class:'checkrow'},cb,el('label',{for:'s-family',text:'Show Family Worship'})),
    el('p',{class:'hint',text:'Turn this off if Family Worship does not apply to you. This is saved on this device.'}));
}
function installSection(){
  return el('section',{class:'setsec'},
    el('h3',{text:'Put it on your phone'}),
    el('p',{text:'iPhone: open this page in Safari, tap the Share button, then Add to Home Screen.'}),
    el('p',{text:'Android: open this page in Chrome, open the menu, then Install app or Add to Home screen.'}),
    el('p',{class:'hint',text:'Once it is on your home screen it opens like an app and works without a connection.'}));
}
function renderSettings(){
  const D=window.DSL,box=$('view-settings');
  box.replaceChildren(
    el('div',{class:'bar'},el('button',{type:'button',class:'link',onclick:()=>setTab('today')},'Back to Today')),
    el('h2',{class:'sect',text:'Settings'}),
    weekSection(D),aiSection(D,D.settings),syncSection(D,D.settings),backupSection(),installSection());
}
function showSyncNote(note){
  const n=$('syncNote');
  n.hidden=!note;
  n.textContent=note||'';
}
/* ---------- tabs ---------- */
function setTab(t){
  S.tab=t;
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.tab===t)));
  ['today','week','library','review','settings'].forEach(x=>{$('view-'+x).hidden=x!==t;});
  if(t==='week'){WK.load(S.weekSel);MIN.load(minMonth());renderWeek();}
  if(t==='library') showLib();
  if(t==='review') showRev();
  if(t==='settings') renderSettings();
}
function showRev(){
  const defs=[['quiz','Quiz'],['verses','Verses'],['month','Month'],['history','History']];
  $('revTabs').replaceChildren(...defs.map(d=>el('button',{type:'button',class:'pill','aria-pressed':String(S.rev===d[0]),onclick:()=>{S.rev=d[0];showRev();}},d[1])));
  $('revQuiz').hidden=S.rev!=='quiz';
  $('revMonth').hidden=S.rev!=='month';
  $('revHistory').hidden=S.rev!=='history';
  $('revVerses').hidden=S.rev!=='verses';
  if(S.rev==='verses') renderVerses();
  if(S.rev==='quiz') renderQuiz();
  if(S.rev==='month'){MO.load(S.monthSel);renderMonth();}
  if(S.rev==='history') renderHistory();
}

/* ---------- incoming data ---------- */
function onDays(snap){
  const m={};
  snap.docs.forEach(d=>{const v=d.data();if(v) m[d.id]=normDay(v,d.id);});
  S.days=m;
  S.daysLoaded=true;
  if(!snap.metadata.fromCache){
    S.fresh=true;
    if(!writing&&dayTimer===null&&pending.size===0) setStatus('Up to date');
  }
  syncDraft();
  renderToday();
  if(S.tab==='week') renderWeekLog();
  if(S.tab==='review'&&S.rev==='history') renderHistory();
  if(S.tab==='review'&&S.rev==='month') renderMonth();
  if(S.tab==='library'&&COLL[S.lib]) renderColl(COLL[S.lib]);
}
function onWeeks(snap){
  const m={};
  snap.docs.forEach(d=>{const v=d.data();if(v) m[d.id]=normWeek(v,d.id);});
  WK.map=m;
  WK.sync();
  renderToday();
  if(S.tab==='week') renderWeek();
}
function onMonths(snap){
  const m={};
  snap.docs.forEach(d=>{const v=d.data();if(v) m[d.id]=normMonth(v,d.id);});
  MO.map=m;
  MO.sync();
}
function onMinistry(snap){
  const m={};
  snap.docs.forEach(d=>{const v=d.data();if(v) m[d.id]=normMin(v,d.id);});
  MIN.map=m;
  MIN.sync();
}
function onQuizzes(snap){
  const m={};
  snap.docs.forEach(d=>{const v=d.data();if(v) m[d.id]=normQuiz(v,d.id);});
  S.quizzes=m;
  if(S.tab==='review'&&S.rev==='quiz'&&Q.phase==='setup'&&!Q.busy) renderQuiz();
  if(S.tab==='review'&&S.rev==='month') renderMonth();
}
function onColl(st,snap){
  const m={};
  snap.docs.forEach(d=>{const v=d.data();if(v) m[d.id]=st.cfg.norm(v,d.id);});
  if(st.draft&&(st.timer!==null||pending.has(st.cfg.coll+'/'+st.draft.id))) m[st.draft.id]=clone(st.draft);
  pending.forEach(it=>{
    if(it.coll!==st.cfg.coll) return;
    if(it.payload===null) delete m[it.id];
    else if(!m[it.id]) m[it.id]=st.cfg.norm(it.payload,it.id);
  });
  st.items=m;
  syncColl(st);
  if(S.tab==='library'&&S.lib===st.cfg.key) renderColl(st);
  renderLibTabs();
  if(S.tab==='review'&&S.rev==='month') renderMonth();
}
function onErr(e){
  setStatus(e&&e.code==='revoked'?'Access to your entries ended. Reopen the page to continue.':'Could not load your saved entries.','err');
}

/* ---------- bullet points and lists in text boxes ----------
   Text stays plain (• ◦ 1. ☐ ☑ and CAPITAL headings), so backups, sync and AI help keep working. */
const MARK_RE=/^(\s*)([•◦☐☑]|\d+[.)])\s+/;
function splitLine(line){
  const m=line.match(MARK_RE);
  if(m) return {indent:m[1],mark:m[2],rest:line.slice(m[0].length)};
  const ind=line.match(/^\s*/)[0];
  return {indent:ind,mark:'',rest:line.slice(ind.length)};
}
function setText(ta,a,b,text,caret,native){
  let ok=false;
  if(native){
    ta.focus();
    ta.setSelectionRange(a,b);
    try{ok=document.execCommand('insertText',false,text)&&ta.value.slice(a,a+text.length)===text;}catch(e){ok=false;}
  }
  if(!ok){
    ta.setRangeText(text,a,b,'end');
    ta.dispatchEvent(new Event('input',{bubbles:true}));
  }
  ta.setSelectionRange(caret,caret);
}
function editLines(ta,fn){
  const v=ta.value,s=ta.selectionStart,e=ta.selectionEnd;
  const a=v.lastIndexOf('\n',s-1)+1;
  let b=v.indexOf('\n',Math.max(e-(e>s&&v[e-1]==='\n'?1:0),s));
  if(b<0) b=v.length;
  const lines=v.slice(a,b).split('\n');
  const text=fn(lines).join('\n');
  setText(ta,a,b,text,a+text.length,true);
}
const FMT_OPS={
  bullets:lines=>{
    const full=lines.filter(l=>l.trim());
    const all=full.length>0&&full.every(l=>/^[•◦]$/.test(splitLine(l).mark));
    return lines.map(l=>{
      const p=splitLine(l);
      if(all) return p.indent+p.rest;
      if(!l.trim()&&lines.length>1) return l;
      return p.indent+(p.indent.length?'◦ ':'• ')+p.rest;
    });
  },
  numbers:lines=>{
    const full=lines.filter(l=>l.trim());
    const all=full.length>0&&full.every(l=>/^\d/.test(splitLine(l).mark));
    let n=0;
    return lines.map(l=>{
      const p=splitLine(l);
      if(all) return p.indent+p.rest;
      if(!l.trim()&&lines.length>1) return l;
      n++;
      return p.indent+n+'. '+p.rest;
    });
  },
  todo:lines=>lines.map(l=>{
    if(!l.trim()&&lines.length>1) return l;
    const p=splitLine(l);
    const mk=p.mark==='☐'?'☑':p.mark==='☑'?'☐':'☐';
    return p.indent+mk+' '+p.rest;
  }),
  indent:lines=>lines.map(l=>{
    if(!l.trim()) return l;
    const p=splitLine(l);
    return '    '+p.indent+(p.mark?(p.mark==='•'?'◦':p.mark)+' ':'')+p.rest;
  }),
  outdent:lines=>lines.map(l=>{
    const p=splitLine(l);
    const ind=p.indent.replace(/^( {1,4}|\t)/,'');
    return ind+(p.mark?(p.mark==='◦'&&!ind?'•':p.mark)+' ':'')+p.rest;
  }),
  heading:lines=>lines.map(l=>{const p=splitLine(l);return p.indent+p.rest.toUpperCase();})
};
const FMT_BTNS=[
  ['bullets','Bullets','<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="5" cy="7" r="1.6" fill="currentColor"/><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="5" cy="17" r="1.6" fill="currentColor"/><path d="M10 7h10M10 12h10M10 17h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'],
  ['numbers','Numbers','<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 5h2v4M4 9h3M4 14h3l-3 4h3M10 7h10M10 12h10M10 17h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'],
  ['todo','To-do','<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="4" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 16l1.5 1.5L9 14.5M12 7h8M12 16h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'],
  ['indent','','<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 6h16M10 10h10M10 14h10M4 18h16M4 9.5l3 2.5-3 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>','Indent'],
  ['outdent','','<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 6h16M10 10h10M10 14h10M4 18h16M7 9.5L4 12l3 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>','Outdent'],
  ['heading','Heading','']
];
function setupFormatting(){
  let target=null;
  const bar=el('div',{class:'fmtbar',role:'toolbar','aria-label':'Formatting',hidden:true});
  FMT_BTNS.forEach(b=>{
    const btn=el('button',{type:'button',class:'fmtb','aria-label':b[3]||null,
      onmousedown:e=>e.preventDefault(),
      onclick:()=>{if(target&&document.body.contains(target)) editLines(target,FMT_OPS[b[0]]);}},
      b[2]?svg(b[2]):null,b[1]||null);
    bar.append(btn);
  });
  document.addEventListener('focusin',e=>{
    const t=e.target;
    if(t&&t.tagName==='TEXTAREA'&&t.classList.contains('fmt')){
      target=t;
      if(bar.nextSibling!==t) t.parentNode.insertBefore(bar,t);
      bar.hidden=false;
    }else if(!bar.contains(t)){
      bar.hidden=true;
    }
  });
  document.addEventListener('focusout',()=>{
    setTimeout(()=>{
      const a=document.activeElement;
      if(a!==target&&!bar.contains(a)) bar.hidden=true;
    },0);
  });
  /* Enter continues a list; Enter on an empty item ends it */
  document.addEventListener('beforeinput',e=>{
    const ta=e.target;
    if(!ta||ta.tagName!=='TEXTAREA'||!ta.classList.contains('fmt')) return;
    if((e.inputType!=='insertLineBreak'&&e.inputType!=='insertParagraph')||e.isComposing) return;
    const v=ta.value,s=ta.selectionStart;
    if(s!==ta.selectionEnd) return;
    const a=v.lastIndexOf('\n',s-1)+1;
    const m=v.slice(a,s).match(/^(\s*)([•◦☐☑]|\d+[.)])(\s+)(.*)$/);
    if(!m) return;
    let lineEnd=v.indexOf('\n',s);
    if(lineEnd<0) lineEnd=v.length;
    e.preventDefault();
    if(!m[4].trim()&&!v.slice(s,lineEnd).trim()){
      setText(ta,a,lineEnd,'',a,false);
      return;
    }
    let mk=m[2];
    if(/^\d/.test(mk)) mk=(parseInt(mk,10)+1)+mk.slice(-1);
    if(mk==='☑') mk='☐';
    const ins='\n'+m[1]+mk+' ';
    setText(ta,s,s,ins,s+ins.length,false);
  });
}

/* ---------- wiring ---------- */
$('prev').appendChild(svg(ICON_LEFT));
$('next').appendChild(svg(ICON_RIGHT));
$('wprev').appendChild(svg(ICON_LEFT));
$('wnext').appendChild(svg(ICON_RIGHT));
$('mprev').appendChild(svg(ICON_LEFT));
$('mnext').appendChild(svg(ICON_RIGHT));
$('prev').addEventListener('click',()=>goTo(keyOf(addDays(parseKey(S.sel),-1))));
$('next').addEventListener('click',()=>{if(S.sel<todayKey()) goTo(keyOf(addDays(parseKey(S.sel),1)));});
$('jumpToday').addEventListener('click',()=>goTo(todayKey()));
$('wprev').addEventListener('click',()=>goWeek(keyOf(addDays(parseKey(S.weekSel),-7))));
$('wnext').addEventListener('click',()=>{if(S.weekSel<mondayOf(todayKey())) goWeek(keyOf(addDays(parseKey(S.weekSel),7)));});
$('mprev').addEventListener('click',()=>goMonth(-1));
$('mnext').addEventListener('click',()=>{if(S.monthSel<monthOf(new Date())) goMonth(1);});
$('retry').addEventListener('click',()=>{setStatus('Saving...');pump();});
$('openSettings').addEventListener('click',()=>setTab('settings'));
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(()=>{});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
$('histSearch').addEventListener('input',e=>{S.hq=e.target.value;S.histLimit=30;renderHistory();});
$('more').addEventListener('click',()=>{S.histLimit+=30;renderHistory();});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible') return;
  const t=todayKey();
  if(t!==lastToday){
    const wasToday=draft.date===lastToday&&dayTimer===null;
    lastToday=t;
    if(wasToday) goTo(t); else renderToday();
  }
});

/* ---------- start ---------- */
COLL_CFG.forEach(setupColl);
B.ui=el('div',{class:'view',hidden:true});
$('libBody').append(B.ui);
WK.build($('weekForm'));
MIN.build($('ministryForm'));
MO.build($('monthForm'));
WK.load(S.weekSel);
MIN.load(minMonth());
MO.load(S.monthSel);
setupFormatting();
buildHabits();
openExpanded();
paintHabits(true);
renderToday();
renderLibTabs();
setTab('today');
setStatus('Loading your entries...');

(async function connect(){
  const slow=setTimeout(()=>{if(!S.fresh) setStatus('Still loading your entries...');},10000);
  let conn=null;
  try{conn=await window.DSL.connect();}catch(e){}
  S.connecting=false;
  if(!conn||!conn.root){
    clearTimeout(slow);
    S.fresh=true;
    setStatus('Saving is not available in this browser.','err');
    renderToday();
    return;
  }
  S.root=conn.root;
  S.mode=conn.mode;
  showSyncNote(conn.note);
  pump();
  const sub=(coll,field,limit,ok)=>S.root.collection(coll).orderBy(field,'desc').limit(limit).onSnapshot(ok,onErr);
  sub('days','date',500,s=>{clearTimeout(slow);onDays(s);});
  sub('weeks','start',200,onWeeks);
  sub('months','month',60,onMonths);
  sub('ministry','month',60,onMinistry);
  sub('quizzes','updatedAt',60,onQuizzes);
  sub('progress','updatedAt',5,onProgress);
  Object.keys(COLL).forEach(k=>sub(COLL[k].cfg.coll,'updatedAt',500,s=>onColl(COLL[k],s)));
})();
})();
