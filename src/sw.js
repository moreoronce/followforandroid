const CACHE_NAME = "follow-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/assets/**/*",
  "https://app.follow.is/**/*"
];

// 添加调试日志
console.log('[Service Worker] Installing...');

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("fetch", (event) => {
  console.log(`[Service Worker] Fetching: ${event.request.url}`);
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
        return response;
      }
      
      console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
      return fetch(event.request)
        .then((networkResponse) => {
          // 缓存新的响应
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch((error) => {
          console.error(`[Service Worker] Network request failed: ${error.message}`);
          // 回退到缓存中的旧响应
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log(`[Service Worker] Serving fallback from cache: ${event.request.url}`);
              return cachedResponse;
            }
            throw error; // 如果没有缓存，抛出错误
          });
        });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});