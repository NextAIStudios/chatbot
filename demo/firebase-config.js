/**
 * Botly Firebase Configuration
 * -------------------------------------------------------------
 * In production/hosting (e.g. Northflank), values are injected at
 * container startup from FIREBASE_API_KEY environment variables.
 * In local dev, credentials can be kept in demo/firebase-config.local.js (gitignored).
 */

window.BOTLY_FIREBASE_CONFIG = window.BOTLY_FIREBASE_CONFIG || {
  apiKey: "YOUR_API_KEY",
  authDomain: "botly-662d7.firebaseapp.com",
  projectId: "botly-662d7",
  storageBucket: "botly-662d7.firebasestorage.app",
  messagingSenderId: "264733463582",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
