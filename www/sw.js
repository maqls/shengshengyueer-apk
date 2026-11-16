/* 声声悦耳 — Service Worker 离线缓存 */
const CACHE="shengshengyueer-v1";
self.addEventListener("install",e=>{ e.waitUntil(self.skipWaiting()); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin) return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
    const c=r.clone(); caches.open(CACHE).then(ca=>ca.put(e.request,c)); return r;
  }).catch(()=>caches.match("./index.html"))));
});
