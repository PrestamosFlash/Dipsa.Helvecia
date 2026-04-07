
const CACHE_NAME = 'dipsa-fixed-v4';
const ASSETS = ['./','./index.html','./admin.html','./styles.css','./data.js','./shared.js','./app.js','./admin.js','./manifest.webmanifest','./assets/logo.jpg','./assets/hero.jpg','./assets/pizza.jpg','./assets/burger.jpg','./assets/pancho.jpg','./assets/empanadas.jpg','./assets/papas.jpg','./assets/mila.jpg'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isAppShell = url.origin === location.origin;
  if (isAppShell) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(caches.match(request).then(response => response || fetch(request)));
});
