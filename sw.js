/* Keeps the app available offline. Always asks the server for the newest app files first,
   so updates show up the next time the app opens; the saved copy is only used offline. */
const CACHE='study-log-v5';
const SHELL=['./','index.html','app.js','adapters.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png'];

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
