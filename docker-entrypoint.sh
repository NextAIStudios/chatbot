#!/bin/sh
set -e

# Dynamically inject Firebase credentials if provided via Northflank Environment Variables
if [ -n "$FIREBASE_API_KEY" ]; then
  cat <<EOF > /usr/share/nginx/html/demo/firebase-config.js
window.BOTLY_FIREBASE_CONFIG = {
  apiKey: "${FIREBASE_API_KEY}",
  authDomain: "${FIREBASE_AUTH_DOMAIN:-botly-662d7.firebaseapp.com}",
  projectId: "${FIREBASE_PROJECT_ID:-botly-662d7}",
  storageBucket: "${FIREBASE_STORAGE_BUCKET:-botly-662d7.firebasestorage.app}",
  messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID:-264733463582}",
  appId: "${FIREBASE_APP_ID:-1:264733463582:web:1fe458b2f53f9b94d50a0f}",
  measurementId: "${FIREBASE_MEASUREMENT_ID:-G-9TCKG90JB1}"
};
EOF
  echo "Botly: Firebase config dynamically injected from environment variables."
fi

exec "$@"
