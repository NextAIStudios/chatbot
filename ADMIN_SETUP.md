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
   `intasendPaymentUrl`, and set the link's **success redirect URL** to
   `https://www.botlypro.online/activated` — payers land there after
   paying and the bot auto-activates (license included). Opening the
   pay link files nothing by itself; everything is recorded on return.
2. **Re-publish the rules.** `firestore.rules` runs AUDIT-MODEL
   activation: owners flip their own bot false→true only via
   `/activated` (fresh `activationRef` + source stamp required), write
   only their own bot's license (uid+botId pinned, domains capped),
   and publish only their own bot's live config (`botly_configs`,
   public read). One reference activates exactly one bot
   (`botly_refs` first-come registry). Paste into Firestore → Rules →
   Publish after every rules change.
3. **Flow (publish → pay → auto-activate → audit).** The owner trains
   → **publishes** (config to the cloud; later edits auto-sync within
   seconds) → pays $10 on IntaSend → lands on `/activated` → bot
   activates, license written, `paid` claim filed, admin emailed. You
   confirm each `paid` row against your IntaSend dashboard (match the
   `ref` shown): leave it, or **⏻ Deactivate** (revokes the license;
   embed locks within 24h). Lost redirects: the payer pastes their
   IntaSend reference manually on `/activated`. Bots with no payment
   row but `active` = interrupted paper trail — check by email/time.
4. **Deactivate / re-verify.** `pending`, `paid`, approved and revoked
   rows all triage the same way: Verify confirms (+rewrites license),
   ✕/⏻ revokes, ↻ re-approves. The **Chatbots** tab toggle writes the
   license too. **⛨ License** rewrites one bot's license from its
   Studio domain. Embeds track `chatbot@main`, so deployed snippets
   pick up enforcement automatically — nobody re-copies.
5. **Email alerts.** Install "Trigger Email from Firestore"
   (collection `mail`, SMTP URI). Owner-shape mails fire from
   `/activated` on every auto-activation; anonymous-shape mails fire on every chatbot lead unless a bot opts out (`leadAlerts: false`) — both
   to **muindidiego@gmail.com**. IntaSend's own merchant emails remain
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
