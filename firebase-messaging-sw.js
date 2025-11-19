importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyCFD1fE88T9eJV8oK7Ccm20vXq4eRvAizQ",
    authDomain: "app-vendedores-inteligente.firebaseapp.com",
    projectId: "app-vendedores-inteligente",
    messagingSenderId: "583313989429",
    appId: "1:583313989429:web:bc8110067d4d25a811367c"
});

const messaging = firebase.messaging();

// Notificaciones en background
messaging.setBackgroundMessageHandler(function(payload) {
    return self.registration.showNotification(
        payload.notification.title,
        {
            body: payload.notification.body,
            icon: 'icon-192.png'
        }
    );
});
