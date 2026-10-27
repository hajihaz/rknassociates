/* RKN public website PWA: never cache analytics, APIs, checkout or personal data. */
'use strict';
const CACHE='rkn-offline-v1';
const OFFLINE='/offline.html';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.add(OFFLINE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('rkn-offline-')&&name!==CACHE).map(name=>caches.delete(name)))),
  self.clients.claim(),
 ]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||request.mode!=='navigate')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/admin')||url.pathname==='/login')return;
 event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match(OFFLINE))));
});
