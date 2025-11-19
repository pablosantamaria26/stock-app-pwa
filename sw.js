// ===============================================
// === SERVICE WORKER COMPLETO (Firebase + Push Persistente)
// ===============================================

// Importa Firebase (necesario para recibir notificaciones FCM)
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

let firebaseConfig = null;

// -----------------------------------------------
// 🔹 RECIBO CONFIG desde app.js (SET_CONFIG)
// -----------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_CONFIG') {
        firebaseConfig = event.data.config;
        console.log('[SW] Configuración de Firebase recibida.');

        try {
            firebase.initializeApp(firebaseConfig);
            self.messaging = firebase.messaging();
        } catch(e) {
            console.error("[SW] Error al inicializar Firebase:", e);
        }
    }
});

// =========================================================
// 🔹 PUSH RECIBIDO (cuando la app está cerrada o en segundo plano)
//     👉 AHORA notificación PERSISTENTE (requireInteraction)
// =========================================================
self.addEventListener('push', function(event) {

    if (!event.data) return;

    let payload = {};
    try {
        payload = event.data.json();
    } catch (e) {
        payload = { notification: { title: "Stock", body: event.data.text() } };
    }

    console.log('[SW] Push recibido:', payload);

    const title = payload.notification?.title || "Stock pendiente";
    const body = payload.notification?.body || "Revisar proveedor";
    const proveedor = payload.data?.proveedor || "Proveedor";

    const notificationOptions = {
        body: body,
        icon: '/icon.png',
        badge: '/icon.png',
        requireInteraction: true,   // ⛔ NOTIFICACIÓN PERSISTENTE
        tag: 'stock-pendiente',     // agrupa las notificaciones
        renotify: true,
        data: {
            proveedor: proveedor
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
    );
});

// =========================================================
// 🔹 CUANDO EL USUARIO HACE CLICK EN LA NOTIFICACIÓN
//     👉 Abrir la app o enfocarla
//     👉 Enviar el proveedor clickeado al frontend
// =========================================================
self.addEventListener('notificationclick', event => {
    const proveedor = event.notification.data.proveedor;
    event.notification.close();

    console.log("[SW] Notificación clickeada:", proveedor);

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {

            // Si ya existe una ventana → enfocarla y enviar mensaje
            if (clientList.length > 0) {
                const client = clientList[0];
                client.focus();
                client.postMessage({ type: "STOCK_CLICK", proveedor });
                return;
            }

            // Si NO existe → abrir la app y luego enviar mensaje
            return clients.openWindow('/').then(newClient => {
                if (newClient) {
                    newClient.postMessage({ type: "STOCK_CLICK", proveedor });
                }
            });
        })
    );
});
