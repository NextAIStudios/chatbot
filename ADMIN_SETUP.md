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
2. Replace the whole file with the contents of `firestore.rules` in this repo
   (already allowlists `muindidiego@gmail.com` — add more admin emails with
   commas inside the brackets if needed).
3. Click **Publish**.

What the rules do:

- `botly_leads`: anyone can **create** (field-validated); only admins can
  read / triage / delete.
- `botly_bots`: signed-in Studio users write **their own** rows; admins read all.

## Step 3 — Allowlist the same email in the Admin page

In `admin.html`, set your admin email(s):

```js
var ADMIN_EMAILS = window.BOTLY_ADMIN_EMAILS || ['muindidiego@gmail.com'];
```

Add further admins by extending both this list and the email list in
`firestore.rules`, then redeploying both.

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

## Bot activation & M-Pesa payments ($10 per bot)

Building and previewing are free. Copying the embed code requires an
**activated** bot:

1. **Set your Till number.** In `demo/customizer.html`, find `BOTLY_BILLING`
   and set your real M-Pesa Till number, till name and KES amount:
   `tillNumber`, `tillName`, `kes`. Redeploy after changing it.
   **Using IntaSend?** Create a Payment Link in your IntaSend dashboard
   (fixed amount = the KES price), paste the link into
   `intasendPaymentUrl`, and payers get a **Pay securely** button
   (M-Pesa + cards) with the manual Till kept as fallback. After paying,
   they paste the M-Pesa code or IntaSend reference — you verify it in
   the IntaSend dashboard before approving. (Full API automation —
   STK push + auto-activation — needs the secret key on a backend, so it
   stays a manual-verify step while the Studio is statically hosted.)
2. **Re-publish the rules.** `firestore.rules` now also covers the
   `botly_payments` collection and protects the `active` flag (owners
   cannot self-activate). Paste the file into Firestore → Rules → Publish
   again after every rules change.
3. **Flow.** The user clicks Copy Embed Code → pays via the M-Pesa
   instructions → pastes their confirmation code → you see the claim in
   `/admin` → **Payments** → **Verify** (checks the code against your
   M-Pesa statement first!). Approving flips the bot to Active and the
   user's Copy button unlocks. You can also toggle Active manually in the
   **Chatbots** tab (e.g. to grandfather existing bots).

## Notes

- **Local dev:** reads/writes need a real key in `demo/firebase-config.local.js`
  (gitignored). Without it, pages work offline and Cloud sync silently skips.
- **Studio previews never sync test leads** (`cloudSync: false` is set on the
  preview widget). Customer embeds without Firebase also skip silently.
- **Costs:** Firestore's free tier (50k reads / 20k writes per day) is far more
  than an admin inbox needs.
- **Backups/exports:** Firestore console → the `botly_leads` / `botly_bots`
  collections can be viewed, filtered and deleted there too.
