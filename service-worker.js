const CACHE_NAME = 'customer-form-v2';
const urlsToCache = [
  '/',
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

// 攔截 fetch 請求
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

            // 只緩存同源請求
            const url = new URL(event.request.url);
            if (url.origin !== location.origin) {
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
            // 如果請求的是 HTML 頁面，返回緩存的 index.html
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('index.html');
            }
            // 其他資源請求失敗時返回 null
            return null;
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
