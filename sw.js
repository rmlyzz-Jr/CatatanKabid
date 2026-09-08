const CACHE_NAME = 'jadwal-splash-v1';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install - cache splash assets saja
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - bersihkan cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - hanya layani asset splash dari cache.
// Permintaan ke script.google.com (aplikasi utama) TIDAK disentuh/di-cache,
// dibiarkan lewat langsung ke jaringan seperti biasa.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname.includes('google.com') || url.hostname.includes('script.google.com')) {
    return;
  }
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
