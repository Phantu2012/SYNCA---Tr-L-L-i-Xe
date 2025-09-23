const CACHE_NAME = 'synca-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/vite.svg',
  'https://cdn.tailwindcss.com',
  'https://js.api.here.com/v3/3.1/mapsjs-core.js',
  'https://js.api.here.com/v3/3.1/mapsjs-service.js',
  'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
  'https://js.api.here.com/v3/3.1/mapsjs-ui.css',
  'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js',
  'https://js.api.here.com/v3/3.1/mapsjs-incidents.js'
];

// Cài đặt service worker và cache các tài nguyên cốt lõi
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Kích hoạt service worker và xóa các cache cũ
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Can thiệp vào các yêu cầu fetch để phục vụ từ cache nếu có
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Don't cache API calls to Firebase to ensure data freshness
  if (requestUrl.hostname.includes('firebaseapp.com') || requestUrl.hostname.includes('googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Nếu có trong cache, trả về từ cache
        if (response) {
          return response;
        }

        // Nếu không, thực hiện yêu cầu mạng
        return fetch(event.request).then(
            (response) => {
                // Kiểm tra nếu nhận được phản hồi hợp lệ
                if(!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                    return response;
                }

                // Sao chép phản hồi để có thể lưu vào cache và trả về cho trình duyệt
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        // Chỉ cache các yêu cầu GET
                        if (event.request.method === 'GET') {
                           cache.put(event.request, responseToCache);
                        }
                    });

                return response;
            }
        );
      })
  );
});