# Botly Admin — Inbox & Chatbots setup (one time, ~10 minutes)

The Admin page (`/admin`) shows two live collections from Cloud Firestore:

- **💬 Inquiries** — every visitor who shares a name/phone/email/concern with the
  landing-page (or contact-page) chatbot, with their reason + recent chat.
- **🤖 Chatbots** — every chatbot created in the Studio (owner, company, functions,
  knowledge counts, API status), so you can spot anyone who is struggling.

Writes are fire-and-forget and never break the chatbot if Cloud is unavailable.

## Step 1 — Enable Firestore

1. Open <https://console.firebase.google.com/project/botly-662d7/firestore>
2. Click **Create database** → **Production mode** → choose region
   (`eur3` is closest to Kenya) → Enable.

## Step 2 — Deploy the security rules

1. Open Firestore → **Rules** tab.
2. Replace the whole file with the contents of `firestore.rules` in this repo.
3. **Before publishing:** replace `admin@botlypro.online` with your real admin
   email address (add more with commas if needed).
4. Click **Publish**.

What the rules do:

- `botly_leads`: anyone can **create** (field-validated); only admins can
  read / triage / delete.
- `botly_bots`: signed-in Studio users write **their own** rows; admins read all.

## Step 3 — Allowlist the same email in the Admin page

In `admin.html`, set your admin email(s):

```js
var ADMIN_EMAILS = window.BOTLY_ADMIN_EMAILS || ['you@yourcompany.com'];
```

(Tip: to avoid committing the address, define `window.BOTLY_ADMIN_EMAILS` in
`demo/firebase-config.local.js`, which is gitignored — it loads before us.)

## Step 4 — Make sure sign-in works

- Email/password: Firebase console → **Authentication → Sign-in method** →
  enable **Email/Password**, then create your admin user
  (Authentication → Users → Add user), or
- Google: enable the **Google** provider and sign in with your admin Gmail.

Also confirm the live domain is authorized: Authentication → Settings →
**Authorized domains** must include your production host
(e.g. `www.botlypro.online`).

## Step 5 — Verify end to end

1. Deploy, open the landing page, chat with the bot and share a test name +
   phone when it asks.
2. Open `/admin`, sign in — the test inquiry appears under **Inquiries** with
   its chat transcript. Mark it Resolved, then delete it.
3. Open `/studio` signed in, save a bot — it appears under **Chatbots**.

## Notes

- **Local dev:** reads/writes need a real key in `demo/firebase-config.local.js`
  (gitignored). Without it, pages work offline and Cloud sync silently skips.
- **Studio previews never sync test leads** (`cloudSync: false` is set on the
  preview widget). Customer embeds without Firebase also skip silently.
- **Costs:** Firestore's free tier (50k reads / 20k writes per day) is far more
  than an admin inbox needs.
- **Backups/exports:** Firestore console → the `botly_leads` / `botly_bots`
  collections can be viewed, filtered and deleted there too.
