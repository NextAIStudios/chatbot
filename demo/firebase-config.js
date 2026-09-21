/**
 * Botly Firebase Configuration
 * -------------------------------------------------------------
 * HOW TO FIX "Firebase is not configured yet":
 *   1. Open  https://console.firebase.google.com/project/botly-662d7/settings/general
 *   2. Copy the "Web API Key" (starts with AIza...)
 *   3. Paste it as apiKey in demo/firebase-config.local.js
 *      (recommended: gitignored, never committed — a starter
 *      template already exists there). Or paste it below.
 *   4. Reload the Studio and sign in again.
 *
 * In production/hosting (e.g. Northflank), values are injected at
 * container startup from FIREBASE_API_KEY environment variables.
 */

window.BOTLY_FIREBASE_CONFIG = window.BOTLY_FIREBASE_CONFIG || {
  apiKey: "YOUR_API_KEY",
  authDomain: "botly-662d7.firebaseapp.com",
  projectId: "botly-662d7",
  storageBucket: "botly-662d7.firebasestorage.app",
  messagingSenderId: "264733463582",
  appId: "1:264733463582:web:1fe458b2f53f9b94d50a0f",
  measurementId: "G-9TCKG90JB1"
};
