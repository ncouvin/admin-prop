// service-worker.js
const CACHE_NAME = 'admin-pro-cache-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  const req = evt.request;
  // Nunca interceptes llamadas a Supabase (o cualquier otro back-end)
  if (req.url.includes('.supabase.') || req.method !== 'GET') return;
  evt.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return r;
      }).catch(() => cached)   // offline fallback
    )
  );
});
