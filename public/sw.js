// FX Prompty - Lightweight Production Service Worker
const CACHE_NAME = 'fx-prompty-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.svg',
];

// Install: Cache essential shell assets & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Precache skipped:', err);
        return self.skipWaiting();
      })
  );
});

// Activate: Clean up any old caches & take control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic navigation / API, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass non-GET requests, Firebase auth/firestore, and chrome-extension schemes
  if (
    req.method !== 'GET' ||
    url.origin.includes('firestore') ||
    url.origin.includes('firebaseio') ||
    url.origin.includes('identitytoolkit') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // Navigation requests: Network first with cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Static assets (images, icons, fonts): Cache first, fallback to network
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return response;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
