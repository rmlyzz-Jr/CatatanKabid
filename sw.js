const CACHE_NAME = 'jadwal-pembuka-v2';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install - cache asset halaman pembuka, lalu langsung aktif tanpa menunggu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - hapus SEMUA cache versi lama & langsung ambil alih halaman
// yang sedang terbuka (tidak perlu tutup-buka tab lagi).
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

// Fetch - strategi "network-first" untuk asset halaman pembuka:
// setiap kali online, SELALU ambil versi terbaru dari GitHub dulu dan
// timpa cache lama dengannya secara otomatis. Cache hanya dipakai
// sebagai cadangan kalau perangkat sedang offline.
// Ini membuat perubahan apa pun yang di-push ke GitHub langsung
// terlihat tanpa perlu bump versi cache secara manual.
//
// Permintaan ke domain lain (termasuk script.google.com saat tombol
// "Buka Aplikasi" diklik) TIDAK disentuh/di-cache, dibiarkan lewat
// langsung ke jaringan seperti biasa.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Terima perintah dari halaman ("SKIP_WAITING") supaya versi service worker
// yang baru terdeteksi bisa langsung aktif saat itu juga, tidak menunggu
// semua tab lama ditutup dulu.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
