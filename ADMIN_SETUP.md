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
   (M-Pesa + cards) with the manual Till kept as fallback. Opening the
   link files a pending claim automatically (one per bot per day) — the
   bot itself stays LOCKED until you press Verify. Match each claim
   against your IntaSend dashboard before approving. (Full API
   automation — STK push + instant approval — needs the secret key on a
   backend, so approval stays a manual-verify step while the Studio is
   statically hosted.)
2. **Re-publish the rules.** `firestore.rules` enforces VERIFY-ONLY
   activation: owners may never touch their bot's `active` flag (neither
   on create nor update — not even via the Firebase console), and only
   admins can flip it. It also publishes the `botly_licenses`
   collection (public read so embeds can verify; admin-only write).
   Paste the file into Firestore → Rules → Publish again after every
   rules change — **the license check does nothing until this ships.**
3. **Flow (verify-only).** The user clicks the IntaSend pay link → a
   pending claim lands in `/admin` → **Payments** (watch the
   `amount?`, `×N claims` and `stale` fraud flags) → you match it
   against your IntaSend dashboard → **Verify** activates the bot,
   writes its public license (carrying the Studio-captured domain
   binding), and the user's paywall unlocks automatically within
   seconds. **✕** rejects *and revokes* the license. You can also
   toggle Active manually in the **Chatbots** tab (edit the matching
   `botly_licenses/{botId}` row too — the embed reads the license,
   not the bot row).
4. **Deactivate when the money never arrives.** An approved payment row
   has **⏻ Deactivate**: the claim becomes `revoked`, the bot
   deactivates AND its public license is revoked, so the embed locks
   (visitors with a cached license go dark within 24h). Changed your
   mind? **↻ Re-verify** approves again. The **Chatbots** tab
   Activate/Deactivate toggle writes the license too. Bots approved
   before the license system existed show a locked embed until you
   press **⛨ License** on the payment row (one click rewrites the
   license from the Studio domain binding). Embeds track
   `chatbot@main`, so already-deployed snippets pick up enforcement
   automatically — nobody needs to re-copy.
5. **Email alerts for new claims.** Install the Firebase extension
   "Trigger Email from Firestore": console → Extensions → install
   `firestore-send-email`, collection `mail`, SMTP connection URI
   (SendGrid free tier, or Gmail with an App Password:
   `smtps://ADDRESS:PASSWORD@smtp.gmail.com:465`). The Studio then
   files one mail doc per bot per day to **muindidiego@gmail.com**
   the moment a payer opens the pay link. Match each mail against
   your IntaSend dashboard — IntaSend's own merchant emails remain
   the proof that money actually moved.

## Notes

- **Local dev:** reads/writes need a real key in `demo/firebase-config.local.js`
  (gitignored). Without it, pages work offline and Cloud sync silently skips.
- **Studio previews never sync test leads** (`cloudSync: false` is set on the
  preview widget). Customer embeds without Firebase also skip silently.
- **Costs:** Firestore's free tier (50k reads / 20k writes per day) is far more
  than an admin inbox needs.
- **Backups/exports:** Firestore console → the `botly_leads` / `botly_bots`
  collections can be viewed, filtered and deleted there too.
