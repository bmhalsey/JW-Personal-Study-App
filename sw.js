/* Keeps the app available offline. Always asks the server for the newest app files first,
   so updates show up the next time the app opens; the saved copy is only used offline. */
const CACHE='study-log-v13';
const SHELL=['./','index.html','app.js','adapters.js','intros.js','together.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  const same=url.origin===self.location.origin;
  const lib=(url.hostname==='www.gstatic.com'&&url.pathname.indexOf('/firebasejs/')===0)||url.hostname==='fonts.gstatic.com'||url.hostname==='fonts.googleapis.com';
  if(same){
    e.respondWith(
      fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
        return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('index.html')))
    );
  }else if(lib){
    e.respondWith(
      caches.match(req).then(r=>r||fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
        return res;
      }))
    );
  }
});

/* Notifications from the app's server (Firebase Cloud Messaging). Each one is shown, then a tap
   opens the app at the right place: a group's comments, today's daily text, and so on. */
self.addEventListener('push',e=>{
  let j={};
  try{j=e.data?e.data.json():{};}catch(err){j={data:{body:e.data?e.data.text():''}};}
  const d=Object.assign({},j.notification||{},j.data||{},(!j.data&&!j.notification)?j:{});
  const title=d.title||'Study Log';
  e.waitUntil(self.registration.showNotification(title,{
    body:d.body||'',tag:d.tag||undefined,renotify:!!d.tag,
    icon:'icon-192.png',badge:'icon-192.png',
    data:{link:d.link||'./'}
  }));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const link=new URL((e.notification.data&&e.notification.data.link)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const open=list.find(c=>c.url.indexOf(self.registration.scope)===0);
    if(open){open.postMessage({open:link});return open.focus();}
    return self.clients.openWindow(link);
  }));
});
