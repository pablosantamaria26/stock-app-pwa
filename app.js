/****************************************************
 * APP.JS — STOCK SUPERVISOR (PWA)
 * Versión Final 2025 — Corregida y Operativa
 ****************************************************/


// ======================================================
// === 1. CONFIGURACIÓN FIREBASE + APPS SCRIPT ==========
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyCFD1fE88T9eJV8oK7Ccm20vXq4eRvAizQ",
  authDomain: "app-vendedores-inteligente.firebaseapp.com",
  projectId: "app-vendedores-inteligente",
  storageBucket: "app-vendedores-inteligente.firebasestorage.app",
  messagingSenderId: "583313989429",
  appId: "1:583313989429:web:bc8110067d4d25a811367c"
};

// URL de tu Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwXa7vxx1AM4nm3bVP1qhO3IbDncAQPjG4XeZdQJcONQ6ljC_OeBigGH9L_i61irhIXBw/exec";

let messaging;
let FCM_TOKEN = localStorage.getItem("fcmToken") || null;
let ENCARGADO_NAME = localStorage.getItem("encargadoName") || null;


// ======================================================
// === 2. REGISTRO DEL SERVICE WORKER ===================
// ======================================================

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
        .then((registration) => {
            console.log("Service Worker registrado:", registration);

            // Enviar config Firebase al SW
            if (registration.active) {
                registration.active.postMessage({
                    type: "SET_CONFIG",
                    config: firebaseConfig
                });
            }
        })
        .catch((error) => {
            console.error("Error registrando Service Worker:", error);
        });
}


// ======================================================
// === 3. INICIALIZAR FIREBASE ==========================
// ======================================================

try {
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    console.log("Firebase inicializado correctamente.");
} catch (e) {
    console.error("Error inicializando Firebase:", e);
}


// ======================================================
// === 4. INTERFAZ DE USUARIO ===========================
// ======================================================

function updateUI() {
    if (ENCARGADO_NAME) {
        document.getElementById("encargado-setup").classList.add("hidden");
        document.getElementById("main-app").classList.remove("hidden");
        document.getElementById("current-encargado").textContent = ENCARGADO_NAME;
        requestNotificationPermission();
    } else {
        document.getElementById("encargado-setup").classList.remove("hidden");
        document.getElementById("main-app").classList.add("hidden");
    }

    if (FCM_TOKEN) {
        const badge = document.getElementById("notification-status");
        badge.textContent = "Notificaciones: ACTIVAS";
        badge.classList.add("status-success");
    }
}

function saveEncargado() {
    const name = document.getElementById("encargado-name").value.trim();
    if (!name) {
        alert("Por favor ingresá tu nombre.");
        return;
    }

    ENCARGADO_NAME = name;
    localStorage.setItem("encargadoName", name);
    updateUI();
}


// ======================================================
// === 5. PERMISOS Y TOKEN DE NOTIFICACIONES ============
// ======================================================

function requestNotificationPermission() {
    if (!messaging || FCM_TOKEN) return;

    messaging.requestPermission()
        .then(() => {
            console.log("Permiso concedido. Obteniendo token...");
            return messaging.getToken();
        })
        .then((token) => {
            FCM_TOKEN = token;
            localStorage.setItem("fcmToken", token);
            sendTokenToAppsScript(token);
            updateUI();
        })
        .catch((err) => {
            console.error("Permiso denegado o error:", err);
            document.getElementById("notification-status").textContent = "Notificaciones: BLOQUEADAS";
        });
}

function sendTokenToAppsScript(token) {
    fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "saveToken",
            encargado: ENCARGADO_NAME,
            token: token
        })
    }).then(() => {
        console.log("Token enviado al servidor.");
    });
}


// ======================================================
// === 6. MARCAR STOCK REALIZADO ========================
// ======================================================

function markStockDone(proveedor) {
    if (!ENCARGADO_NAME) {
        displayMessage("Primero ingresá tu nombre", true);
        return;
    }

    displayMessage(`Marcando ${proveedor} como realizado...`);

    fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            action: "stockDone",
            proveedor,
            encargado: ENCARGADO_NAME,
            fechaRealizacion: new Date().toISOString()
        })
    })
    .then(() => {
        displayMessage(`✔ Stock de ${proveedor} registrado correctamente.`);
        document.querySelector(`#item-${proveedor.toLowerCase().replace(/\s/g, "-")}`).classList.add("hidden");
    })
    .catch(() => {
        displayMessage("Error al registrar stock.", true);
    });
}


// ======================================================
// === 7. MENSAJES DEL SERVICE WORKER ===================
// ======================================================

if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", (event) => {
        if (!event.data) return;

        if (event.data.type === "STOCK_CLICK") {
            const proveedor = event.data.proveedor;
            console.log("Evento STOCK_CLICK para:", proveedor);
            focusProveedor(proveedor);

            setTimeout(() => {
                openProveedorAction(proveedor);
            }, 800);
        }
    });
}


// ======================================================
// === 8. ENFOCAR AL PROVEEDOR ==========================
// ======================================================

function focusProveedor(proveedor) {
    const id = `item-${proveedor.toLowerCase().replace(/\s+/g, "-")}`;
    const card = document.getElementById(id);

    if (!card) return;

    card.style.boxShadow = "0 0 15px 3px #00c853";
    card.style.border = "2px solid #00c853";
    card.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
        card.style.boxShadow = "";
        card.style.border = "";
    }, 3000);
}


// ======================================================
// === 9. DESTACAR EL BOTÓN DE MARCAR ===================
// ======================================================

function openProveedorAction(proveedor) {
    const id = `item-${proveedor.toLowerCase().replace(/\s+/g, "-")}`;
    const card = document.getElementById(id);
    if (!card) return;

    const btn = card.querySelector("button");
    if (!btn) return;

    card.classList.remove("hidden");
    btn.style.boxShadow = "0 0 12px 3px #ffab00";
    btn.style.border = "2px solid #ffab00";

    btn.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
        btn.style.boxShadow = "";
        btn.style.border = "";
    }, 3000);
}


// ======================================================
// === 10. MENSAJES A LA UI =============================
// ======================================================

function displayMessage(text, isError = false) {
    const box = document.getElementById("message-area");
    box.textContent = text;
    box.style.display = "block";
    box.style.backgroundColor = isError ? "#e53935" : "#43a047";
    box.style.color = "white";

    setTimeout(() => {
        box.style.display = "none";
    }, 4000);
}


window.onload = updateUI;
