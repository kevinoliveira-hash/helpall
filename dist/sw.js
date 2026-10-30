const CACHE='help-all-demo-v1';
const ASSETS=['./','./index.html','./styles.css','./extras.css','./app.js','./store.js','./icons.js','./data.js','./manifest.webmanifest','./assets/logo.svg','./assets/city.svg','./assets/home-service.svg','./assets/food.svg','./assets/bowl.svg','./assets/delivery.svg','./assets/mobility.svg','./assets/stays.svg','./assets/care.svg','./assets/tech.svg','./assets/pets.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(ASSETS.map(url=>cache.add(url))))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('help-all-demo-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
