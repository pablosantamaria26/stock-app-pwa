// ===============================================
// === SERVICE WORKER OFICIAL PARA LA PWA (SIN Firebase)
// ===============================================

// Files to cache
const CACHE_NAME = "stock-supervisor-v1";
const ASSETS = [
    "./",
    "index.html",
    "app.js",
    "manifest.json",
    "icon-192.png",
    "icon-512.png"
];

// -----------------------------------------------
// 1. INSTALACIÓN DEL SERVICE WORKER
// -----------------------------------------------
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// -----------------------------------------------
// 2. ACTIVACIÓN (limpiar caches viejos)
// -----------------------------------------------
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

// -----------------------------------------------
// 3. FETCH: usar cache + network fallback
// -----------------------------------------------
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return (
                cachedResponse ||
                fetch(event.request).catch(() =>
                    caches.match("index.html")
                )
            );
        })
    );
});

// =========================================================
// 4. RECIBIR MENSAJES DEL FRONTEND (para manejar eventos)
// =========================================================
self.addEventListener("message", (event) => {
    // Aquí solo recibimos mensajes del frontend (si hace falta)
    console.log("[SW] Mensaje recibido del cliente:", event.data);
});

// =========================================================
// 🔥 IMPORTANTE:
// *NO* agregues initializeApp() en este SW.
// Firebase Messaging usa firebase-messaging-sw.js aparte.
// =========================================================
