/* Caches the app itself so it always launches, even on a bad connection.
   Bump CACHE whenever the shell file list changes. */
const CACHE = 'taproute-v2';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './vendor/leaflet.js',
  './vendor/leaflet.css',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Map tiles, routing and search must always go to the network.
  if (new URL(req.url).origin !== self.location.origin) return;

  // Serve from cache straight away, then quietly refresh it for next launch.
  event.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
