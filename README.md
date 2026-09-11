# ⚡ Botly | Conversational AI Platform for Every Company

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success.svg)](package.json)
[![PCI-DSS](https://img.shields.io/badge/Payments-In--Chat%20PCI--DSS-green.svg)](src/payments)
[![White-Label](https://img.shields.io/badge/White--Label-100%25%20Customizable-purple.svg)](demo/customizer.html)
[![Quick Embed Guide](https://img.shields.io/badge/Guide-Quick%20Embed-brightgreen.svg)](QUICK_EMBED_GUIDE.md)

Botly is a modern, plug-and-play conversational AI chatbot widget designed for **every company** that needs an intelligent assistant. Features deep natural language understanding, **proactive lead capture** (names, phones, unlisted requests), **seamless in-chat payment checkout** (Card, Apple Pay, Google Pay, M-Pesa), human follow-up triage, and a live **White-Label Customizer Studio**.

> 📖 **Looking to embed Botly quickly?** Check out the comprehensive **[⚡ Quick Embed Guide (QUICK_EMBED_GUIDE.md)](QUICK_EMBED_GUIDE.md)** or explore the interactive **[Integration Playground](demo/embed-example.html)**.

---

## 🚀 Key Capabilities

- **🎯 4 Distinct Company Goals:** Easily configure Botly's primary objective:
  1. `lead_generation`: Captures prospective buyer names, phone numbers, and custom inquiries with local CRM storage and 1-click CSV export.
  2. `payment_checkout`: Displays pre-approved quotes, discount promo codes (`SAVE15`), and executes PCI-compliant checkout in-chat.
  3. `customer_support`: Resolves everyday questions autonomously and triages complex inquiries to human specialists.
  4. `consultation_booking`: Books 1-on-1 advisor consultations and callback appointments.
- **💬 Human-Like Follow-up Dynamics:** Just like a real human advisor, Botly naturally asks contextual follow-up questions tailored to your chosen tone (`supportive`, `professional`, `conversational`, `sales_focused`).
- **⚡ Instant In-Chat Payment Checkout:** Customers review their quote, apply promo codes, and pay immediately in chat via **Credit/Debit Card, Apple Pay, or M-Pesa** without being redirected to external portals.
- **📄 Verifiable Digital Certificates & Receipts:** Automatically generates policy or transaction IDs (`POL-2026-XXXXXX`), downloadable/printable certificates, and itemized receipts upon checkout.
- **🎨 100% White-Label & Easily Customizable:** Custom brand colors, logo, agent persona, products, pricing formulas, and currencies (`$`, `€`, `£`, `KSh`, etc.).
- **🧩 Zero-Dependency Plug & Play:** Embeds into any HTML site, WordPress, Shopify, Webflow, React, Vue, Next.js, Python, or Node.js app in 60 seconds.
- **🛠️ Visual Brand Customizer Studio:** Includes a live visual editor (`demo/customizer.html`) with interactive company goal switches, lead manager modal, and instant code generation.

---

## 📦 30-Second Quickstart

### Embed on Any Website (HTML / Static / CDN)

Add the CSS stylesheet in your `<head>` and the script before the closing `</body>` tag:

```html
<!-- 1. Include Stylesheet -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css">

<!-- 2. Include Standalone Bundle (Zero Dependencies) -->
<script src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"></script>

<!-- 3. Initialize with your company branding & goal -->
<script>
  InsuranceChatbot.init({
    company: {
      name: "Acme Corporation",
      supportPhone: "+1 (800) 555-0199",
      supportEmail: "care@acmeco.example.com"
    },
    goal: "lead_generation", // 'lead_generation' | 'payment_checkout' | 'customer_support' | 'consultation_booking'
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
> See the **[⚡ Comprehensive Quick Embed Guide](QUICK_EMBED_GUIDE.md)**.

---

## 🎨 Interactive White-Label Studio & Embed Playground

Explore the interactive demos included in this repository:

1. **[Botly Customizer Studio (`demo/customizer.html`)](demo/customizer.html):**
   - Live visual editor for colors, logos, and agent personas.
   - Switch between 4 Company Goals in real time.
   - Configure Lead Capture prompts and In-Chat Payment gateways (Card, Apple Pay, M-Pesa).
   - Leads Manager modal with goal filters and 1-click CSV export.
   - Download `company-chatbot-config.json` or copy auto-generated embed codes.

2. **[Quick Embed Playground (`demo/embed-example.html`)](demo/embed-example.html):**
   - Interactive framework code switcher (HTML, React, Next.js, Vue, WordPress, Shopify, Webflow, Python, Node).
   - Live testing chips: Simulate lead capture, trigger instant checkout, export CSV.
   - Full SDK reference table.

3. **[Landing Page Demo (`index.html`)](index.html):**
   - Full Botly dark editorial design showcase with film-grain aesthetic.

---

## 💳 In-Chat Payment Checkout Flow

The chatbot handles conversions without ever leaving the conversation thread:

```
[ User asks: "Get a quote" or clicks "Buy Now" ]
                   ↓
[ Bot runs dynamic underwriting / service questionnaire ]
                   ↓
[ Bot renders Pre-Approved Quote Card with Annual/Monthly options ]
                   ↓
[ User taps "💳 Buy Policy Now" or triggers checkout ]
                   ↓
[ Bot mounts interactive in-chat Checkout Card ]
   • Method Selection: Card / Apple Pay / M-Pesa
   • Promo Code entry (e.g. SAVE15 = 15% discount)
   • 256-Bit SSL & PCI-DSS Level 1 Badging
                   ↓
[ Live 3D-Secure Biometric Authorization Simulation ]
                   ↓
[ Digital Policy Certificate & Official Receipt Issued ]
   • Policy Ref: POL-2026-XXXXXX
   • Instant Day 1 Effective Coverage
   • Print / Save PDF Certificate buttons
```

---

## ⚙️ Configuration Reference

```javascript
InsuranceChatbot.init({
  // Company Branding
  company: {
    name: 'Acme Corporation',
    supportEmail: 'care@acmeco.example.com',
    supportPhone: '+1 (800) 555-0199',
    licenseNumber: 'LIC-2026-882190'
  },

  // Primary Company Goal
  goal: 'lead_generation', // 'lead_generation' | 'payment_checkout' | 'customer_support' | 'consultation_booking'

  // Bot Persona
  bot: {
    name: 'Botly',
    title: 'Certified Solutions Advisor',
    greeting: "Hello! 👋 I'm Botly, your 24/7 digital assistant. How can I help you today?",
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

  // Currency & Payment
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US'
  },
  checkout: {
    enabled: true,
    allowCard: true,
    allowApplePay: true,
    allowMpesa: true,
    promoCodes: {
      'SAVE15': 0.15,
      'SAFE20': 0.20
    }
  }
});
```

---

## 🛠️ Public JavaScript SDK API (`window.InsuranceChatbot`)

| Method | Description |
|---|---|
| `InsuranceChatbot.init(config)` | Mounts and initializes the chatbot widget with custom options. |
| `InsuranceChatbot.open()` | Expands the chat window into view. |
| `InsuranceChatbot.close()` | Collapses the chat window back into the floating launcher icon. |
| `InsuranceChatbot.toggle()` | Toggles the open/closed state of the widget. |
| `InsuranceChatbot.setCompanyGoal(goalKey)` | Dynamically reconfigures the company goal (`lead_generation`, `payment_checkout`, etc.). |
| `InsuranceChatbot.simulateUnlistedInquiry(query)` | Simulates an unlisted customer question to test lead capture triage. |
| `InsuranceChatbot.startCheckout(quote)` | Opens the chat and displays the interactive in-chat checkout card. |
| `InsuranceChatbot.getCapturedLeads()` | Returns array of all captured leads from local CRM storage. |
| `InsuranceChatbot.exportLeadsCSV()` | Generates and downloads a clean CSV file of captured inquiries. |
| `InsuranceChatbot.reset()` | Clears conversation state and restarts fresh welcome flow. |

---

## 🧪 Testing & Verification

Run the automated test suite:

```bash
# Run 47 unit & integration tests covering NLP, quotes, payments, and company goals
npm test
```

Start the local showcase server:

```bash
# Start local server on port 8080
python3 -m http.server 8080

# View in browser:
# http://localhost:8080/index.html            (Botly Landing Page)
# http://localhost:8080/demo/customizer.html   (Botly Customizer Studio)
# http://localhost:8080/demo/embed-example.html (Quick Embed Guide & Playground)
```

---

## 📁 Repository Structure

```
chatbot/
├── dist/                              # Standalone drop-in bundles (Zero dependencies)
│   ├── insurance-chatbot.js           # UMD bundle (window.InsuranceChatbot)
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
│   │   ├── checkout-flow.js           # In-chat checkout coordinator
│   │   ├── payment-card.js            # Interactive payment card UI (Card/Apple Pay/M-Pesa)
│   │   └── receipt-generator.js       # Digital policy certificate & receipt builder
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
│   └── widget.test.js                 # 47 automated tests
├── QUICK_EMBED_GUIDE.md               # Complete framework embed guide
├── package.json
├── README.md
└── LICENSE                            # MIT License
```

---

## 📄 License

MIT License © 2026 Botly / NextAI Studios.
