const CACHE_NAME = 'customer-form-v3';
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'logo.png',
  'keywords.js',
  'mylogo.png',
  'lib/xlsx.full.min.js',
  'lib/tagify.min.js',
  'lib/html-to-image.min.js',
  'lib/tagify.css'
];

// 安裝時緩存檔案
self.addEventListener('install', event => {
  self.skipWaiting(); // 強制新的 Service Worker 立即接管
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 攔截 fetch 請求，優先用 cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 如果在緩存中找到，直接返回
      if (response) {
        return response;
      }
      
      // 否則嘗試從網絡獲取
      return fetch(event.request).then(function(response) {
        // 檢查是否是有效的回應
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // 克隆回應以便緩存
        var responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(function() {
        // 網絡請求失敗時的處理
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          return caches.match('./index.html').then(function(response) {
            return response || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        }
        
        // 其他情況返回 404
        return new Response('', { status: 404, statusText: 'Not found' });
      });
    })
  );
});

// 清除舊緩存並立即接管所有頁面
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim(); // 立即接管所有頁面
    })
  );
});
