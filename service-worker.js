const CACHE_NAME = 'dipsa-live-v12-logo-bigger-title-smaller';
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './styles.css',
  './config.js',
  './shared.js',
  './app.js',
  './admin.js',
  './manifest.webmanifest',
  './assets/logo.jpg',
  './assets/hero.jpg',
  './assets/pizza.jpg',
  './assets/burger.jpg',
  './assets/pancho.jpg',
  './assets/empanadas.jpg',
  './assets/papas.jpg',
  './assets/mila.jpg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
});
