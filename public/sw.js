// Service worker mínimo de la PWA "Contador de cafés".
// Solo cachea estáticos del propio origen. Nunca intercepta la API de
// Supabase (otro origen) ni las escrituras, así que auth y datos no cambian.
const CACHE = 'cafes-diego-v1';
const APP_SHELL = ['./', './index.html', './coffee.svg', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // no tocar escrituras (API Supabase)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // no interceptar API/CDN externos

  // Navegaciones: red primero, con la shell cacheada como respaldo offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }

  // Estáticos propios (JS/CSS/imágenes): cache-first con relleno en segundo plano.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        }),
    ),
  );
});
