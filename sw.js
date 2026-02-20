const CACHE_NAME = 'artel-v1';
const assets = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/offline.html' // Страница 404/Offline с разбитым стаканом
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
    .catch(() => caches.match('/offline.html'))
  );
});
