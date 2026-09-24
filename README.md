# Botly Pro | Conversational AI Platform for Every Company

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success.svg)](package.json)
[![White-Label](https://img.shields.io/badge/White--Label-100%25%20Customizable-purple.svg)](demo/customizer.html)
[![Quick Embed Guide](https://img.shields.io/badge/Guide-Quick%20Embed-brightgreen.svg)](QUICK_EMBED_GUIDE.md)

Botly Pro is a modern, plug-and-play conversational AI chatbot widget designed for **every company** that needs an intelligent assistant. Features deep natural language understanding, **proactive lead capture** (names, phones, unlisted requests), **live product catalog answers** (real prices and store links), human follow-up triage, and a live **White-Label Customizer Studio**.

> **Looking to embed Botly Pro quickly?** Check out the comprehensive **[Quick Embed Guide (QUICK_EMBED_GUIDE.md)](QUICK_EMBED_GUIDE.md)** or explore the interactive **[Integration Playground](demo/embed-example.html)**.

---

## Company

**Botly Pro is built, owned, and maintained by NextAI Studios Limited** (https://nextaistudios.com). All rights reserved. For sales, support, or partnership inquiries, contact david@nextaistudios.com.

---

## Key Capabilities

- **3 Distinct Company Goals:** Easily configure Botly's primary objective:
  1. `lead_generation`: Captures prospective buyer names, phone numbers, and custom inquiries with local CRM storage and 1-click CSV export.
  2. `customer_support`: Resolves everyday questions autonomously and triages complex inquiries to human specialists.
  3. `consultation_booking`: Books 1-on-1 advisor consultations and callback appointments.
- **Human-Like Follow-up Dynamics:** Just like a real human advisor, Botly naturally asks contextual follow-up questions tailored to your chosen tone (`supportive`, `professional`, `conversational`, `sales_focused`).
- **Live Product Catalog Answers:** Connect a Shopify or WooCommerce store and Botly answers product questions with live names, prices, and direct store links — shoppers check out on the store as normal.
- **Website-to-Bot Knowledge Scan:** Point the Studio at a company website and Botly crawls its pages into chatbot memory automatically, with a page-by-page review before training.
- **100% White-Label & Easily Customizable:** Custom brand colors, logo, agent persona, products, pricing formulas, and currencies (`$`, `€`, `£`, `KSh`, etc.).
- **Zero-Dependency Plug & Play:** Embeds into any HTML site, WordPress, Shopify, Webflow, React, Vue, Next.js, Python, or Node.js app in 60 seconds.
- **Visual Brand Customizer Studio:** Includes a live visual editor (`demo/customizer.html`) with interactive company goal switches, lead manager modal, and instant code generation.

---

## 30-Second Quickstart

### Embed on Any Website (HTML / Static / CDN)

Add the CSS stylesheet in your `<head>` and the script before the closing `</body>` tag:

```html
<!-- 1. Include Stylesheet -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css">

<!-- 2. Include Standalone Bundle (Zero Dependencies) -->
<script src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"></script>

<!-- 3. Initialize with your company branding & goal -->
<script>
  BotlyChatbot.init({
    company: {
      name: "Acme Corporation",
      supportPhone: "+1 (800) 555-0199",
      supportEmail: "care@acmeco.example.com"
    },
    goal: "lead_generation", // 'lead_generation' | 'customer_support' | 'consultation_booking'
    bot: {
      name: "Botly",
      title: "Solutions Advisor"
    },
    theme: {
      primaryColor: "#18221c",
      accentColor: "#9be553"
    },
    currency: {
      code: "USD",
      symbol: "$"
    }
  });
</script>
```

> **Want framework-specific code for React, Next.js, Vue, WordPress, Shopify, Python, or Node.js?**
> See the **[Comprehensive Quick Embed Guide](QUICK_EMBED_GUIDE.md)**.

---

## Interactive White-Label Studio & Embed Playground

Explore the interactive demos included in this repository:

1. **[Botly Customizer Studio (`demo/customizer.html`)](demo/customizer.html):**
   - Live visual editor for colors, logos, and agent personas.
   - Switch between Company Goals in real time.
   - Configure Lead Capture prompts and Live Catalog settings.
   - Leads Manager modal with goal filters and 1-click CSV export.
   - Download `company-chatbot-config.json` or copy auto-generated embed codes.

2. **[Quick Embed Playground (`demo/embed-example.html`)](demo/embed-example.html):**
   - Interactive framework code switcher (HTML, React, Next.js, Vue, WordPress, Shopify, Webflow, Python, Node).
   - Live testing chips: Simulate lead capture, live catalog search, export CSV.
   - Full SDK reference table.

3. **[Landing Page Demo (`index.html`)](index.html):**
   - Full Botly dark editorial design showcase with film-grain aesthetic.

---

## Live Catalog Answer Flow

The chatbot answers product questions with live store data, then hands the shopper to the store:

```
[ User asks: "Do you have whole milk?" ]
                   ↓
[ Bot queries the connected store catalog live ]
                   ↓
[ Bot replies with product name, live price & store link ]
   • Fresh Whole Milk 1L — KES 185
   • "View in store" deep link
                   ↓
[ Shopper checks out on the store as normal ]
```

Note: Botly Pro does not process payments itself — checkout always happens on the merchant's own store.

---

## Configuration Reference

```javascript
BotlyChatbot.init({
  // Company Branding
  company: {
    name: 'Acme Corporation',
    supportEmail: 'care@acmeco.example.com',
    supportPhone: '+1 (800) 555-0199',
    licenseNumber: 'LIC-2026-882190'
  },

  // Primary Company Goal
  goal: 'lead_generation', // 'lead_generation' | 'customer_support' | 'consultation_booking'

  // Bot Persona
  bot: {
    name: 'Botly',
    title: 'Certified Solutions Advisor',
    greeting: "Hello! I'm Botly, your 24/7 digital assistant. How can I help you today?",
    typingDelayMs: 400
  },

  // Color Tokens & Styling
  theme: {
    primaryColor: '#18221c',
    accentColor: '#9be553',
    headerBg: '#18221c',
    soundEffects: true,
    enableVoiceInput: true
  },

  // Lead Capture & Human Triage
  leadCapture: {
    enabled: true,
    triggerOnUnlistedQueries: true,
    collectPhone: true,
    collectName: true
  },

  // Human Follow-Up Dynamics
  followUpDynamics: {
    enabled: true,
    tone: 'conversational' // 'supportive' | 'professional' | 'conversational' | 'sales_focused'
  },

  // Currency
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US'
  }
});
```

---

## Public JavaScript SDK API (`window.BotlyChatbot`)

The widget also answers to the aliases `window.BotlyProChatbot` and `window.Botly` (`window.InsuranceChatbot` still works for backward compatibility).

| Method | Description |
|---|---|
| `BotlyChatbot.init(config)` | Mounts and initializes the chatbot widget with custom options. |
| `BotlyChatbot.open()` | Expands the chat window into view. |
| `BotlyChatbot.close()` | Collapses the chat window back into the floating launcher icon. |
| `BotlyChatbot.toggle()` | Toggles the open/closed state of the widget. |
| `BotlyChatbot.setCompanyGoal(goalKey)` | Dynamically reconfigures the company goal (`lead_generation`, `customer_support`, etc.). |
| `BotlyChatbot.simulateUnlistedInquiry(query)` | Simulates an unlisted customer question to test lead capture triage. |
| `BotlyChatbot.getCapturedLeads()` | Returns array of all captured leads from local CRM storage. |
| `BotlyChatbot.exportLeadsCSV()` | Generates and downloads a clean CSV file of captured inquiries. |
| `BotlyChatbot.reset()` | Clears conversation state and restarts fresh welcome flow. |

---

## Testing & Verification

Run the automated test suite:

```bash
# Run 234 unit & integration tests covering NLP, quotes, catalog, and company goals
npm test
```

Start the local showcase + crawler backend server (required for website crawling in the Studio):

```bash
# One-time: install the Python crawler dependencies
pip install -r requirements.txt

# Start server on port 8080 (serves the files AND the /api/crawl + /api/scrape-products APIs)
python3 server.py 8080

# View in browser:
# http://localhost:8080/index.html              (Botly Landing Page)
# http://localhost:8080/demo/customizer.html   (Botly Customizer Studio)
# http://localhost:8080/demo/embed-example.html (Quick Embed Guide & Playground)
```

Live APIs in production (Northflank): the nginx frontend is static-only, so `/api/*`
answers JSON `503` unless you deploy the Python backend as a second service from
`Dockerfile.scraper` and set `SCRAPER_BACKEND_URL=http://<scraper-host>:8080` on the
frontend service — the entrypoint then proxies `/api/*` to it. Without a backend,
the Studio shows a friendly "no live data" card with a direct store link instead of
erroring. Note: big marketplaces (e.g. Jumia) often challenge datacenter IPs with a
bot firewall; the API reports that honestly (`blocked: "waf"`) and Shopify/WooCommerce
merchant JSON APIs are tried automatically for custom stores.

---

## Repository Structure

```
chatbot/
├── dist/                              # Standalone drop-in bundles (Zero dependencies)
│   ├── insurance-chatbot.js           # UMD bundle (window.BotlyChatbot)
│   └── insurance-chatbot.css          # Core widget design system stylesheet
├── src/
│   ├── config/
│   │   ├── default-config.js          # Default schema & COMPANY_GOALS presets
│   │   └── presets.js                 # Brand presets (Auto, Health, Home, M-Pesa)
│   ├── nlp/
│   │   ├── knowledge-base.js          # Domain Q&A
│   │   ├── intent-engine.js           # Fuzzy NLP & tone-aware human follow-up generator
│   │   └── llm-connector.js           # Optional Gemini / OpenAI connector
│   ├── flows/
│   │   ├── lead-capture-flow.js       # Proactive lead capture & CSV export
│   │   ├── quote-flow.js              # Conversational quote calculator
│   │   ├── claims-flow.js             # Incident & claims filing assistant
│   │   └── policy-lookup-flow.js      # Policy lookup & triage
│   ├── payments/
│   │   ├── checkout-flow.js           # Legacy in-chat checkout coordinator (retired)
│   │   ├── payment-card.js            # Legacy payment card UI (retired)
│   │   └── receipt-generator.js       # Legacy receipt builder (retired)
│   └── core/
│       ├── chatbot-widget.js          # Master controller & Public SDK
│       ├── ui-renderer.js             # DOM renderer & animations
│       └── chatbot.css                # Polished glassmorphism styles
├── demo/
│   ├── customizer.html                # Botly Customizer Studio & Lead Manager
│   ├── embed-example.html             # Interactive Quick Embed Guide & Playground
│   ├── demo.css                       # Landing & demo styles
│   ├── botly-logo.svg                 # Botly vector brand logo
│   └── botly-icon.svg                 # Botly favicon & brand icon
├── tests/
│   └── widget.test.js                 # Automated widget tests
├── QUICK_EMBED_GUIDE.md               # Complete framework embed guide
├── package.json
├── README.md
└── LICENSE                            # Proprietary commercial license
```

---

## License

Proprietary commercial license © 2026 NextAI Studios Limited. Botly Pro is a product of NextAI Studios Limited — all rights reserved. See LICENSE.
