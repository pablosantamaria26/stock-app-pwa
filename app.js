// === 1. CLAVES DE CONFIGURACIÓN (GLOBALES) ===
// 🚨 REEMPLAZA LOS VALORES MARCADOS CON TUS CLAVES REALES Y LA URL DE APPS SCRIPT 🚨
const firebaseConfig = {
  apiKey: "AIzaSyCFD1fE88T9eJV8oK7Ccm20vXq4eRvAizQ",
  authDomain: "app-vendedores-inteligente.firebaseapp.com",
  projectId: "app-vendedores-inteligente",
  storageBucket: "app-vendedores-inteligente.firebasestorage.app",
  messagingSenderId: "583313989429",
  appId: "1:583313989429:web:bc8110067d4d25a811367c"
};

// URL de tu implementación de Apps Script (la Web App URL desplegada)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXa7vxx1AM4nm3bVP1qhO3IbDncAQPjG4XeZdQJcONQ6ljC_OeBigGH9L_i61irhIXBw/exec'; 

// === 2. REGISTRO DEL SERVICE WORKER Y FIREBASE ===

let messaging;
let FCM_TOKEN = localStorage.getItem('fcmToken') || null;
let ENCARGADO_NAME = localStorage.getItem('encargadoName') || null;

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
            console.log('Service Worker registrado con éxito:', registration);
            // ENVIAR LA CONFIGURACIÓN AL SW
            if (registration.active) {
                registration.active.postMessage({ type: 'SET_CONFIG', config: FIREBASE_CONFIG });
            }
        })
        .catch(function(error) {
            console.log('Fallo el registro del Service Worker:', error);
        });
}

// Inicializar Firebase (usa FIREBASE_CONFIG definida arriba)
try {
    firebase.initializeApp(FIREBASE_CONFIG);
    messaging = firebase.messaging();
    console.log("Firebase inicializado.");
} catch (e) {
    console.error("Error al inicializar Firebase:", e);
}

// === 3. FUNCIONES DE INTERFAZ Y LÓGICA ===

function updateUI() {
    if (ENCARGADO_NAME) {
        document.getElementById('encargado-setup').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('current-encargado').textContent = ENCARGADO_NAME;
        requestNotificationPermission();
    } else {
        document.getElementById('encargado-setup').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    if (FCM_TOKEN) {
        document.getElementById('notification-status').textContent = 'Notificaciones: ACTIVAS';
        document.getElementById('notification-status').classList.add('status-success');
    } else {
        document.getElementById('notification-status').textContent = 'Notificaciones: PENDIENTE';
        document.getElementById('notification-status').classList.remove('status-success');
    }
}

function saveEncargado() {
    const name = document.getElementById('encargado-name').value.trim();
    if (name) {
        localStorage.setItem('encargadoName', name);
        ENCARGADO_NAME = name;
        updateUI();
    } else {
        alert("Por favor, ingresa tu nombre.");
    }
}

function requestNotificationPermission() {
    if (!messaging || FCM_TOKEN) return; 

    messaging.requestPermission()
        .then(function() {
            console.log('Permiso de notificación concedido.');
            return messaging.getToken();
        })
        .then(function(token) {
            FCM_TOKEN = token;
            localStorage.setItem('fcmToken', token);
            console.log('FCM Token:', token);
            sendTokenToAppsScript(token); 
            updateUI();
        })
        .catch(function(err) {
            console.error('No se pudo obtener el permiso de notificación. ', err);
            document.getElementById('notification-status').textContent = 'Notificaciones: BLOQUEADAS';
        });
}

function sendTokenToAppsScript(token) {
    const data = {
        action: 'saveToken',
        encargado: ENCARGADO_NAME,
        token: token
    };

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify(data) 
    })
    .then(() => {
        console.log('Token enviado a Apps Script para ser guardado.');
    })
    .catch(error => {
        console.error('Error al enviar el token:', error);
    });
}

function displayMessage(text, isError = false) {
    const msgArea = document.getElementById('message-area');
    msgArea.textContent = text;
    msgArea.classList.remove('hidden');
    msgArea.style.backgroundColor = isError ? '#f44336' : '#81c784';
    msgArea.style.color = 'white';
    setTimeout(() => msgArea.classList.add('hidden'), 5000);
}

function markStockDone(proveedor) {
    if (!ENCARGADO_NAME) {
        displayMessage("¡Primero ingresa tu nombre!", true);
        return;
    }

    displayMessage(`Marcando ${proveedor} como realizado...`);

    const data = {
        action: 'stockDone',
        proveedor: proveedor,
        encargado: ENCARGADO_NAME,
        fechaRealizacion: new Date().toISOString()
    };

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data) 
    })
    .then(() => {
        displayMessage(`✅ Stock de ${proveedor} marcado como REALIZADO. Email enviado.`);
        // Usamos el ID del contenedor para ocultar el botón
        document.querySelector(`#item-${proveedor.toLowerCase().replace(/\s/g, '-')}`).classList.add('hidden');
    })
    .catch(error => {
        console.error('Error al marcar stock como realizado:', error);
        displayMessage("Error al registrar la acción. Intenta de nuevo.", true);
    });
}

window.onload = updateUI;
