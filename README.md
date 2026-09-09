# 🛡️ NextAI Insurance Chatbot

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success.svg)](package.json)
[![PCI-DSS](https://img.shields.io/badge/Payments-In--Chat%20PCI--DSS-green.svg)](src/payments)
[![White-Label](https://img.shields.io/badge/White--Label-100%25%20Customizable-purple.svg)](demo/customizer.html)

A modern, plug-and-play conversational AI chatbot widget designed for **any insurance company** (Auto, Health, Home, Life, Travel, Commercial). Features deep insurance domain knowledge, real-time dynamic quote calculation, **seamless in-chat payment checkout**, and an interactive White-Label Customizer Studio.

---

## 🚀 Key Capabilities

- **💬 Answers Every Insurance Question:** Pre-loaded with deep insurance domain knowledge covering Comprehensive vs. Third-Party, deductibles/excess, inpatient/outpatient, pre-existing conditions, dwelling vs. contents, term vs. whole life, and claims filing.
- **⚡ Instant In-Chat Payment Checkout:** Policyholders can review their quote, apply promo codes (e.g. `SAVE15`), and pay immediately in chat via **Credit/Debit Card, Apple Pay, Google Pay, or M-Pesa** without being redirected to external portals.
- **📄 Instant Digital Certificate of Insurance:** Automatically generates a verifiable Policy Number (`POL-2026-XXXXXX`), downloadable/printable digital insurance certificate, and payment receipt upon checkout.
- **🎨 100% White-Label & Easily Customizable:** Custom brand colors, logo, agent persona, products, tiers, pricing formulas, and currencies (`$`, `€`, `£`, `KSh`, etc.).
- **🧩 Zero-Dependency Plug & Play:** Embeds into any HTML site, WordPress, Shopify, Webflow, React, or Next.js app with just 2 lines of code.
- **🛠️ Visual Brand Customizer Studio:** Includes a live visual editor (`demo/customizer.html`) that exports custom configurations and generates ready-to-use embed snippets.
- **🤖 Dual AI Mode:** Works completely offline using a fast built-in natural language intent engine, and optionally connects to Google Gemini, OpenAI, or custom webhook endpoints.

---

## 📦 30-Second Quickstart

### 1. Embed on Any Website (HTML / WordPress / Webflow)

Add the CSS stylesheet in your `<head>` and the script before the closing `</body>` tag:

```html
<!-- 1. Include Stylesheet -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css">

<!-- 2. Include Standalone Bundle -->
<script src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"></script>

<!-- 3. Initialize with your company branding -->
<script>
  InsuranceChatbot.init({
    company: {
      name: "Apex Mutual Insurance",
      supportPhone: "+1 (800) 555-0199",
      supportEmail: "care@apexmutual.example.com"
    },
    bot: {
      name: "Apex AI",
      title: "Underwriting Specialist"
    },
    theme: {
      primaryColor: "#2563eb",
      accentColor: "#10b981"
    },
    currency: {
      code: "USD",
      symbol: "$"
    }
  });
</script>
```

---

## 🎨 Interactive White-Label Studio

Open `demo/customizer.html` in your browser to visually customize the bot:

- Switch between ready-made presets:
  - 🛡️ **AegisGuard Blue** (Multi-Line General Insurance)
  - 🏥 **VitalHealth Emerald** (Health & Medical)
  - 🏎️ **TurboDrive Racing Red** (Auto & Motor Insurance)
  - 🏰 **HavenStone Purple** (High-Net-Worth Property & Estate)
  - 🌍 **Kilima Bima Safari** (East Africa / M-Pesa Ready with KSh)
- Tweak brand colors and agent greeting in real time.
- Download `company-chatbot-config.json` or copy the auto-generated embed snippet with 1 click.

---

## 💳 In-Chat Payment Checkout Flow

The chatbot allows policy purchases without ever leaving the conversation thread:

```
[ User asks: "Get a car insurance quote" ]
                   ↓
[ Bot runs dynamic underwriting questionnaire ]
                   ↓
[ Bot renders Pre-Approved Quote Card with Annual/Monthly options ]
                   ↓
[ User taps "💳 Buy Policy Now" ]
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

## ⚙️ Full Configuration Reference

```javascript
InsuranceChatbot.init({
  // Company Branding
  company: {
    name: 'AegisGuard Insurance',
    tagline: 'Smart, Instant & Compassionate Protection',
    supportEmail: 'care@aegisguard.example.com',
    supportPhone: '+1 (800) 555-0199',
    licenseNumber: 'INS-LIC-2026-882190'
  },

  // Bot Persona
  bot: {
    name: 'Aegis AI',
    title: 'Certified Insurance Advisor',
    greeting: "Hello! 👋 I'm Aegis, your 24/7 digital insurance assistant...",
    typingDelayMs: 400
  },

  // Color Tokens & Styling
  theme: {
    primaryColor: '#2563eb',
    accentColor: '#10b981',
    headerBg: '#0f172a',
    soundEffects: true,
    enableVoiceInput: true
  },

  // Currency & Formats
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US'
  },

  // Payment Options & Discounts
  payment: {
    provider: 'mock', // 'mock' | 'stripe'
    stripePublishableKey: 'pk_live_...',
    promoCodes: {
      'SAVE15': 0.15,
      'SAFE20': 0.20
    },
    taxRate: 0.045
  },

  // Add your company's proprietary FAQs
  customFaqs: [
    {
      id: 'custom_veteran_discount',
      keywords: ['veteran', 'military', 'discount'],
      question: 'Do you offer a military discount?',
      answer: 'Yes! Active service members and veterans receive an additional 10% discount on all policies.'
    }
  ]
});
```

---

## 🧪 Testing & Verification

Run the built-in automated test suite:

```bash
# Run 19 automated NLP, quote calculation, and payment tests
node tests/widget.test.js
```

Start the local demo showcase:

```bash
# Start local server
python3 -m http.server 8080

# View showcase in browser:
# http://localhost:8080/demo/index.html
# http://localhost:8080/demo/customizer.html
```

---

## 📁 Repository Structure

```
chatbot/
├── dist/                              # Standalone drop-in bundles
│   ├── insurance-chatbot.js           # UMD/IIFE bundle (Zero dependencies)
│   └── insurance-chatbot.css          # Core design system stylesheet
├── src/
│   ├── config/
│   │   ├── default-config.js          # Default configuration schema
│   │   └── presets.js                 # Brand presets (Auto, Health, Home, M-Pesa)
│   ├── nlp/
│   │   ├── knowledge-base.js          # Deep insurance domain Q&A
│   │   ├── intent-engine.js           # Fuzzy NLP matcher & classifier
│   │   └── llm-connector.js           # Optional Gemini / OpenAI connector
│   ├── flows/
│   │   ├── quote-flow.js              # Conversational quote calculator
│   │   ├── claims-flow.js             # Incident & claims filing assistant
│   │   └── policy-lookup-flow.js      # Policy renewal & human handover
│   ├── payments/
│   │   ├── checkout-flow.js           # In-chat checkout coordinator
│   │   ├── payment-card.js            # Interactive payment card UI
│   │   └── receipt-generator.js       # Policy certificate & receipt builder
│   └── core/
│       ├── chatbot-widget.js          # Master controller & Window SDK
│       ├── ui-renderer.js             # DOM renderer & animations
│       └── chatbot.css                # Polished glassmorphism styles
├── demo/
│   ├── index.html                     # Full insurance landing page demo
│   ├── customizer.html                # White-label studio & embed generator
│   ├── embed-example.html             # Minimal 5-line static integration
│   └── demo.css                       # Landing page styles
├── tests/
│   └── widget.test.js                 # Automated test suite
├── package.json
├── README.md
└── LICENSE                            # MIT License
```

---

## 📄 License

MIT License © 2026 NextAI Studios.
