# Firebase Authentication Setup Guide for Botly Sandbox

This guide walks you through setting up Firebase Authentication on [console.firebase.google.com](https://console.firebase.google.com) to enable secure sign-in (Google & Email/Password), user accounts, bot persistence, and payment licensing in the Botly Sandbox Studio.

---

## Step 1: Create a Firebase Project

1. Open your browser and navigate to **[console.firebase.google.com](https://console.firebase.google.com)**.
2. Sign in with your Google Account.
3. Click the **Add project** card (or **Create a project**).
4. Enter a project name:
   - Example: `Botly-Chatbot` or `Botly-Studio`.
5. (Optional) Toggle off Google Analytics if you don't need it right now, then click **Create project**.
6. Wait a few seconds until the console finishes provisioning, then click **Continue**.

---

## Step 2: Register a Web Application & Get Your Config

1. On your Firebase project dashboard, locate the circle icons under **Get started by adding Firebase to your app**.
2. Click the **Web icon** (`</>`).
3. Under **App nickname**, enter:
   - `Botly Sandbox Web App`
4. (Optional) You do not need Firebase Hosting checked for now.
5. Click **Register app**.
6. Firebase will display a code block containing your **`firebaseConfig`** object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789:web:abcdef..."
   };
   ```
7. Copy the values inside that object.
8. Open `demo/firebase-config.local.js` in your project (recommended — gitignored, so your key is never committed) and paste your keys. If that file doesn't exist, create it, or paste into `demo/firebase-config.js` instead:
   ```javascript
   window.BOTLY_FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789:web:abcdef..."
   };
   ```

---

## Step 3: Enable Authentication Providers

1. In the left navigation menu of the Firebase Console, expand **Build** and click **Authentication**.
2. Click the **Get started** button.
3. You will be placed on the **Sign-in method** tab.

### A. Enable Google Sign-In (Recommended)
1. Click **Google** from the list of additional providers.
2. Toggle the **Enable** switch to ON.
3. Under **Project support email**, select your email address from the dropdown.
4. Click **Save**.

### B. Enable Email/Password Sign-In
1. In the same **Sign-in method** tab, click **Email/Password**.
2. Toggle **Email/Password** to **Enable**.
3. (Leave Email link / passwordless disabled for now).
4. Click **Save**.

---

## Step 4: Verify Authorized Domains

1. While inside **Authentication**, click the **Settings** tab at the top.
2. In the left sub-navigation, click **Authorized domains**.
3. Verify that `localhost` is listed:
   - Firebase adds `localhost` and `127.0.0.1` automatically.
4. If you deploy Botly to a live domain (e.g. `yourdomain.com`), click **Add domain**, enter your domain name, and click **Add**.

---

## Step 5: Test the Integration in the Sandbox

1. Install the crawler backend dependencies (one time only):
   ```bash
   pip install -r requirements.txt
   ```
2. Start the Botly backend server from the repo root. This is **required** for Step 4
   "Teach Your Bot" website crawling (`/api/crawl`). A plain static server such as
   `python3 -m http.server` will NOT work for crawling:
   ```bash
   python3 server.py 8080
   ```
3. Open **`http://localhost:8080/demo/customizer.html`**.
4. In the top navbar, you will see the **Sign In** button.
5. Click **Sign In**:
   - A modal appears offering **Continue with Google** or **Email & Password**.
6. Once signed in, your profile picture, display name, and a **Sign Out** menu will appear in the top navbar.
7. When users attempt to copy embed code, export JSON, or checkout, they will be authenticated and their bots tied to their Firebase user account.

---

## Troubleshooting

- **"Crawler backend not detected" / "Live crawl unavailable" in Step 4 (Teach Your Bot)**:
  You are serving the Studio with a static file server. Stop it and run `python3 server.py 8080`
  from the repo root (after `pip install -r requirements.txt`), then press Re-scan again.
  The website crawler needs the Python backend (`/api/crawl`).
- **"auth/unauthorized-domain" error**:
  Ensure the domain in your browser URL (e.g., `localhost`) is added in **Authentication > Settings > Authorized domains**.
- **"auth/popup-closed-by-user"**:
  Occurs if the Google popup is closed before selecting an account; simply click "Continue with Google" again.
- **Testing without live keys**:
  If you haven't pasted your live keys yet into `demo/firebase-config.js`, Botly will automatically run in local Sandbox Demo mode so you can preview the auth experience right away.
