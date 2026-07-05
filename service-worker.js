/*
  Flow service worker — precaches the whole app shell on install so it works
  fully offline after the first visit. Cache-first for static assets (this is
  a versioned static site: bump CACHE_VERSION when you ship changes), network-
  first-with-cache-fallback for navigations, and offline.html as a last resort.
*/
const CACHE_VERSION = 'flow-v2';
const PRECACHE_URLS = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'css/animations.css',
  'css/base.css',
  'css/calendar.css',
  'css/components.css',
  'css/dashboard.css',
  'css/layout.css',
  'css/pomodoro.css',
  'css/print.css',
  'css/notes.css',
  'css/tables.css',
  'css/variables.css',
  'icons/apple-touch-icon.png',
  'icons/favicon.ico',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'js/app.js',
  'js/features/achievements.js',
  'js/features/calendar.js',
  'js/features/dashboard.js',
  'js/features/dragdrop.js',
  'js/features/filters.js',
  'js/features/import-export.js',
  'js/features/notifications.js',
  'js/features/onboarding.js',
  'js/features/pomodoro.js',
  'js/features/print.js',
  'js/features/quotes-data.js',
  'js/features/quotes.js',
  'js/features/share.js',
  'js/features/shortcuts.js',
  'js/features/sounds.js',
  'js/features/task-modal.js',
  'js/features/tasks.js',
  'js/features/theme.js',
  'js/features/toast.js',
  'js/features/focus-sticky.js',
  'js/features/notes.js',
  'js/features/tables.js',
  'js/state/store.js',
  'js/utils/csv.js',
  'js/utils/date-utils.js',
  'js/utils/helpers.js',
  'js/utils/qrcode.js',
  'js/utils/storage.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never intercept cross-origin (e.g. share-target links)

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          try {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          } catch (_) { /* body may already be consumed */ }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('index.html')).then((r) => r || caches.match('offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
