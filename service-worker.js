const CACHE_NAME = 'customer-form-v2';
const urlsToCache = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'logo.png',
  'keywords.js',
  'mylogo.png',
  // 外部庫
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js',
  'https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.css',
  'https://cdn.jsdelivr.net/npm/@yaireo/tagify'
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
    caches.match(event.request)
      .then(response => {
        // 如果在 cache 中找到，直接返回
        if (response) {
          return response;
        }
        // 如果不在 cache 中，嘗試從網絡獲取
        return fetch(event.request)
          .then(response => {
            // 檢查是否收到有效的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 克隆響應，因為響應流只能使用一次
            const responseToCache = response.clone();
            // 將新的響應添加到 cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            // 如果網絡請求失敗，可以返回一個離線頁面
            return new Response('離線模式');
          });
      })
  );
});

// 清理舊的緩存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
