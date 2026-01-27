// Passive Service Worker v1.5 - Fixes 'Incognito Only' issues by disabling caching
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => {
      // Clear any remaining site data if supported
      return self.clients.claim();
    })
  );
});

// Explicitly NOT intercepting fetch requests ensures the browser
// always pulls fresh content from the server in normal mode.
self.addEventListener('fetch', (event) => {
  return;
});