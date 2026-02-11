const CACHE_NAME = 'deposito-pro-v3'; // Versión 3
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  // Forzar activación inmediata
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Borrar cachés viejas para evitar conflictos
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => {
        if (!k.includes(CACHE_NAME)) return caches.delete(k);
      })
    ))
  );
  // Tomar control de los clientes (pestañas abiertas) inmediatamente
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // ESTRATEGIA: NETWORK FIRST (Internet Primero)
  // Intentamos ir a internet para buscar lo más nuevo.
  // Solo si falla (offline), usamos lo guardado.
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en caché nueva y la mostramos
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Si falló internet (catch), devolvemos lo que haya en caché
        return caches.match(event.request);
      })
  );
});
