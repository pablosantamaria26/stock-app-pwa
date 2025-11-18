// Importa las librerías de Firebase para el Service Worker
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

let firebaseConfig = null;

// Escucha mensajes del app.js para recibir la configuración de las claves
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_CONFIG') {
        firebaseConfig = event.data.config;
        console.log('[SW] Configuración de Firebase recibida.');
        try {
            // Inicializar Firebase en el Service Worker
            firebase.initializeApp(firebaseConfig);
            self.messaging = firebase.messaging();
        } catch(e) {
            console.error("[SW] Error al inicializar Firebase:", e);
        }
    }
});


// Maneja los mensajes PUSH que llegan cuando la aplicación NO está abierta (Background)
self.addEventListener('push', function(event) {
    if (event.data) {
        const payload = event.data.json();
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icon.png', // Debe existir un archivo icon.png en la raíz
            tag: 'stock-request', 
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(notificationTitle, notificationOptions)
        );
    }
});
