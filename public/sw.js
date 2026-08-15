// Service Worker for Offline-First PWA Support
const CACHE_NAME = 'phongtinhoc-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/background.webp',
  '/buttondnmoi.webp',
  '/formdangnhapnoi.webp',
  '/thehocsinhnam.webp',
  '/thehocsinhnu.webp',
  '/chongoi3.png',
  '/computer_card_frame.png',
  '/hoadao1.webp',
  '/hoadao2.webp',
  '/hoadao3.webp',
  '/hoadao4.webp',
  '/hoadao5.webp',
  '/hoadao6.webp',
  '/hoadao7.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Bypass Supabase API calls so client handles offline local storage gracefully
  if (url.hostname.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-While-Revalidate pattern for cached static assets
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline - use cached version silently */});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
