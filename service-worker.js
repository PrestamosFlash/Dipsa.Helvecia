
const CACHE_NAME = 'dipsa-fixed-v2';
const ASSETS = ['./','./index.html','./admin.html','./styles.css','./data.js','./shared.js','./app.js','./admin.js','./manifest.webmanifest','./assets/logo.jpg','./assets/hero.jpg','./assets/pizza.jpg','./assets/burger.jpg','./assets/pancho.jpg','./assets/empanadas.jpg','./assets/papas.jpg','./assets/mila.jpg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
