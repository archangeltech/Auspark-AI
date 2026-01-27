const CACHE_NAME = 'auspark-v1.4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
});

// Passive fetch to prevent caching issues during dev/testing
self.addEventListener('fetch', (event) => {
  return;
});