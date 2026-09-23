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

# Live API wiring: proxy /api/* to the Python scraper backend when configured.
if [ -n "$SCRAPER_BACKEND_URL" ]; then
  cat <<EOF > /etc/nginx/botly-api-active.conf
# Generated: SCRAPER_BACKEND_URL is set - proxy live API to the backend.
location /api/ {
    proxy_pass ${SCRAPER_BACKEND_URL};
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_connect_timeout 30s;
    proxy_read_timeout 60s;
}
EOF
  echo "Botly: /api/* proxied to scraper backend."
fi

exec "$@"
