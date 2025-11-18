// Importa las librerías de Firebase para el Service Worker
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// === CLAVES DE CONFIGURACIÓN (DEBEN SER IDÉNTICAS AL app.js) ===
const firebaseConfig = {
  apiKey: "AIzaSyCFD1fE88T9eJV8oK7Ccm20vXq4eRvAizQ",
  authDomain: "app-vendedores-inteligente.firebaseapp.com",
  projectId: "app-vendedores-inteligente",
  storageBucket: "app-vendedores-inteligente.firebasestorage.app",
  messagingSenderId: "583313989429",
  appId: "1:583313989429:web:bc8110067d4d25a811367c"
};
// ==============================================================

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Maneja los mensajes PUSH que llegan cuando la aplicación NO está abierta (Background)
messaging.onBackgroundMessage(function(payload) {
    console.log('[sw.js] Mensaje recibido en background:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png', // Asegúrate de tener un archivo icon.png en la raíz
        tag: 'stock-request', // Esto asegura que no se acumulen notificaciones duplicadas
        renotify: true // Para forzar la alerta si llega otro mensaje con el mismo tag
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});
