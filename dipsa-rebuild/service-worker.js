const CACHE_NAME = 'dipsa-live-v3-nopass-homeclean';
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
