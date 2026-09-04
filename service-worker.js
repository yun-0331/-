const CACHE='liyunjia-v13-0-0';
const CORE=['./index.html?v=13.0.0','./style.css?v=13.0.0','./app.js?v=13.0.0','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith((async()=>{try{const fresh=await fetch(e.request,{cache:'no-store'});if(fresh&&fresh.ok){const c=await caches.open(CACHE);c.put(e.request,fresh.clone()).catch(()=>{});}return fresh}catch(err){return (await caches.match(e.request))||(await caches.match('./index.html?v=13.0.0'))||Response.error()}})())});
