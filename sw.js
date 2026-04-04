const CACHE_NAME = 'abundapp-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Abundapp.png',
  '/Abundapp_white.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Font se cachea dinámicamente al primer request (ver fetch handler)

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Requests a Google Fonts o gstatic: cache-first (font no cambia)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Requests a Apps Script (API): network-only, no cachear
  if (url.hostname.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Todo lo demás: cache-first, fallback a network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
