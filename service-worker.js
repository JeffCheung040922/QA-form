const CACHE_NAME = 'customer-form-v2';
const urlsToCache = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'logo.png',
  'keywords.js',
  'mylogo.png'
];

// 安裝時緩存檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 攔截 fetch 請求，優先用 cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
