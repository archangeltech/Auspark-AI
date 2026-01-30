
// Parking Sign Reader Passive Service Worker v1.6
// Fixed: Deployment-ready script that clears stale caches to solve loading issues

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
      return self.clients.claim();
    })
  );
});

// Pass-through strategy to allow normal browser handling
self.addEventListener('fetch', (event) => {
  return;
});
