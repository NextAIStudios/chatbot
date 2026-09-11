# ⚡ Botly Comprehensive Quick Embed Guide

Welcome to the **Botly Quick Embed Guide**. Botly is a zero-dependency, plug-and-play conversational AI platform built for **every company** that needs an intelligent chatbot. 

Whether you need to capture qualified sales leads, collect instant in-chat payments via M-Pesa or Card, resolve customer support inquiries with human triage callback, or schedule consultations, Botly drops into any website or web framework in under 60 seconds.

---

## 📑 Table of Contents

1. [30-Second Drop-in (Zero Build Steps)](#1-30-second-drop-in-zero-build-steps)
2. [Embed by Framework & Platform](#2-embed-by-framework--platform)
   - [HTML / Static Sites](#html--static-sites)
   - [React (Vite / CRA)](#react-vite--create-react-app)
   - [Next.js (App Router & Pages Router)](#nextjs-app-router--pages-router)
   - [Vue.js 3 / Nuxt 3](#vuejs-3--nuxt-3)
   - [WordPress / WooCommerce](#wordpress--woocommerce)
   - [Shopify](#shopify)
   - [Webflow / Squarespace / Wix](#webflow--squarespace--wix)
   - [Python (FastAPI, Flask, Django)](#python-fastapi-flask-django)
   - [Node.js (Express)](#nodejs-express)
3. [Company Goals & Conversion Strategy](#3-company-goals--conversion-strategy)
   - [Goal 1: Lead Generation & Sales](#goal-1-lead-generation--sales)
   - [Goal 2: In-Chat Payments & Checkout](#goal-2-in-chat-payments--checkout)
   - [Goal 3: 24/7 Customer Support & Human Triage](#goal-3-247-customer-support--human-triage)
   - [Goal 4: Consultation & Appointment Booking](#goal-4-consultation--appointment-booking)
4. [Complete Configuration Schema](#4-complete-configuration-schema)
5. [Public JavaScript SDK API & Browser Events](#5-public-javascript-sdk-api--browser-events)
6. [Backend Webhook & CRM Sync](#6-backend-webhook--crm-sync)
7. [Production Deployment & Security Checklist](#7-production-deployment--security-checklist)

---

## 1. 30-Second Drop-in (Zero Build Steps)

To add Botly to any website, add the stylesheet link in the `<head>` and the script tag before the closing `</body>` tag:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Company Website</title>

  <!-- 1. Botly Stylesheet -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css">
</head>
<body>

  <!-- Your existing website content here -->
  <main>
    <h1>Welcome to Our Platform</h1>
  </main>

  <!-- 2. Botly Standalone Bundle (Zero Dependencies) -->
  <script src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"></script>

  <!-- 3. Initialize with your company configuration -->
  <script>
    InsuranceChatbot.init({
      company: {
        name: "Acme Corporation",
        supportPhone: "+1 (800) 555-0199",
        supportEmail: "hello@acmeco.example.com"
      },
      goal: "lead_generation", // 'lead_generation' | 'payment_checkout' | 'customer_support' | 'consultation_booking'
      bot: {
        name: "Botly",
        title: "Sales & Solutions Advisor"
      },
      theme: {
        primaryColor: "#18221c",
        accentColor: "#9be553"
      }
    });
  </script>
</body>
</html>
```

The floating launcher button appears automatically in the bottom-right corner. Clicking it opens the interactive conversational assistant.

---

## 2. Embed by Framework & Platform

### HTML / Static Sites

Simply place the code snippet above before the closing `</body>` tag of your `index.html` or global footer template.

```html
<!-- In-page trigger button example -->
<button onclick="InsuranceChatbot.open()">💬 Chat with Specialist</button>
<button onclick="InsuranceChatbot.simulateUnlistedInquiry('Can you handle custom enterprise SLA requirements?')">💡 Ask Custom Question</button>
<button onclick="InsuranceChatbot.startCheckout()">💳 Make a Payment</button>
```

---

### React (Vite / Create React App)

In React applications, mount Botly in your root `App.jsx` or a dedicated `BotlyWidget.jsx` component:

```jsx
import React, { useEffect } from 'react';

export default function BotlyWidget() {
  useEffect(() => {
    // 1. Inject Stylesheet dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css';
    document.head.appendChild(link);

    // 2. Inject Script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js';
    script.async = true;
    script.onload = () => {
      if (window.InsuranceChatbot) {
        window.InsuranceChatbot.init({
          company: {
            name: "SaaSify Cloud",
            supportPhone: "+1 (800) 555-0199",
            supportEmail: "support@saasify.example.com"
          },
          goal: "lead_generation",
          theme: {
            primaryColor: "#18221c",
            accentColor: "#9be553"
          }
        });
      }
    };
    document.body.appendChild(script);

    // 3. Listen for captured leads
    const handleLead = (event) => {
      console.log('Lead captured in React:', event.detail);
      // Optional: send to your backend or CRM
    };
    window.addEventListener('botly:leadCaptured', handleLead);

    return () => {
      window.removeEventListener('botly:leadCaptured', handleLead);
    };
  }, []);

  return null; // Botly renders its own floating launcher widget
}
```

---

### Next.js (App Router & Pages Router)

#### Next.js App Router (`app/layout.tsx` or `app/layout.jsx`)
Using Next.js `<Script>` component for optimized, non-blocking loading:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css"
        />
      </head>
      <body>
        {children}

        <Script
          src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"
          strategy="lazyOnload"
          onLoad={() => {
            // @ts-ignore
            if (window.InsuranceChatbot) {
              // @ts-ignore
              window.InsuranceChatbot.init({
                company: { name: "NextGen Solutions" },
                goal: "lead_generation",
                theme: { primaryColor: "#18221c", accentColor: "#9be553" }
              });
            }
          }}
        />
      </body>
    </html>
  );
}
```

---

### Vue.js 3 / Nuxt 3

#### Vue 3 (`src/App.vue`)
```vue
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // Stylesheet
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css';
  document.head.appendChild(link);

  // Script
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js';
  script.onload = () => {
    window.InsuranceChatbot.init({
      company: { name: "Apex Vue Hub" },
      goal: "lead_generation"
    });
  };
  document.body.appendChild(script);
});
</script>
```

---

### WordPress / WooCommerce

You can add Botly in 2 ways:

#### Option A: Theme `footer.php` or `header.php`
Add the stylesheet link in `header.php` before `</head>` and the initialization script in `footer.php` before `</body>`.

#### Option B: `functions.php` (Recommended & Clean)
Add this snippet to your child theme's `functions.php`:

```php
function add_botly_chatbot() {
    wp_enqueue_style('botly-css', 'https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css');
    wp_enqueue_script('botly-js', 'https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js', array(), null, true);

    $botly_config = "
        document.addEventListener('DOMContentLoaded', function() {
            if (window.InsuranceChatbot) {
                InsuranceChatbot.init({
                    company: {
                        name: '" . esc_js(get_bloginfo('name')) . "',
                        supportEmail: '" . esc_js(get_option('admin_email')) . "'
                    },
                    goal: 'lead_generation',
                    theme: {
                        primaryColor: '#18221c',
                        accentColor: '#9be553'
                    }
                });
            }
        });
    ";
    wp_add_inline_script('botly-js', $botly_config);
}
add_action('wp_enqueue_scripts', 'add_botly_chatbot');
```

---

### Shopify

1. In your Shopify Admin, navigate to **Online Store** → **Themes**.
2. Click **Actions** (three dots) → **Edit Code**.
3. Open `layout/theme.liquid`.
4. Just before `</head>`, add:
   ```liquid
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css">
   ```
5. Just before `</body>`, add:
   ```liquid
   <script src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"></script>
   <script>
     InsuranceChatbot.init({
       company: {
         name: "{{ shop.name | escape }}",
         supportEmail: "{{ shop.email | escape }}"
       },
       goal: "payment_checkout",
       currency: {
         code: "{{ cart.currency.iso_code }}",
         symbol: "{{ cart.currency.symbol }}"
       }
     });
   </script>
   ```
6. Click **Save**.

---

### Webflow / Squarespace / Wix

1. In **Webflow Project Settings** → **Custom Code** (or page settings).
2. Under **Header Code**, paste:
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css">
   ```
3. Under **Footer Code**, paste:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"></script>
   <script>
     document.addEventListener("DOMContentLoaded", function() {
       InsuranceChatbot.init({
         company: { name: "Webflow Company" },
         goal: "lead_generation"
       });
     });
   </script>
   ```
4. Publish your site.

---

### Python (FastAPI, Flask, Django)

Serve the botly widget on your web frontend and route conversational queries to your backend webhook:

```html
<!-- Base Template (Jinja2 / Django) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.css">
<script src="https://cdn.jsdelivr.net/gh/NextAIStudios/chatbot@main/dist/insurance-chatbot.js"></script>
<script>
  InsuranceChatbot.init({
    company: { name: "{{ company_name }}" },
    goal: "lead_generation",
    api: {
      enabled: true,
      mode: "hybrid", // Tries your API first; falls back to offline NLP if unreachable
      endpoint: "/api/chat/query",
      method: "POST"
    }
  });
</script>
```

---

### Node.js (Express)

```javascript
import express from 'express';
const app = express();
app.use(express.json());

// Webhook endpoint receiving queries or captured leads from Botly
app.post('/api/leads/captured', (req, res) => {
  const { name, phone, need, goal, timestamp } = req.body;
  console.log(`🎉 New Lead Received: ${name} (${phone}) - Goal: ${goal} - Inquired: ${need}`);
  // Store into PostgreSQL / MongoDB or dispatch to Slack / HubSpot CRM
  res.json({ success: true, message: "Lead recorded in CRM" });
});

app.listen(3000, () => console.log('Server running on :3000'));
```

---

## 3. Company Goals & Conversion Strategy

Botly is pre-configured with 4 primary company goals. Specifying the `goal` parameter automatically adapts greeting messages, role titles, quick action chips, and follow-up questioning tones:

### Goal 1: Lead Generation & Sales
**Ideal for:** B2B companies, agencies, insurance brokers, contractors, and custom service providers.

```javascript
InsuranceChatbot.init({
  company: { name: "Vanguard Tech Solutions" },
  goal: "lead_generation",
  leadCapture: {
    enabled: true,
    askNamePrompt: "That's a great inquiry regarding **{need}**! While that requires a custom setup, let me connect you with our solutions lead. May I have your **full name**?",
    askPhonePrompt: "Thank you, **{name}**! What is your best **phone number** (or WhatsApp) for our team to contact you?",
    confirmationMessage: "🎉 **Thank you, {name}!** Your custom request for **{need}** has been sent to our specialist. We will reach out to **{phone}** shortly.",
    followUpQuestion: "Would you also like an estimated price breakdown while you wait?"
  },
  followUpDynamics: {
    enabled: true,
    tone: "sales"
  }
});
```

---

### Goal 2: In-Chat Payments & Checkout
**Ideal for:** E-commerce stores, policy renewals, subscription services, and digital downloads.

```javascript
InsuranceChatbot.init({
  company: { name: "TurboShield Coverage" },
  goal: "payment_checkout",
  checkout: {
    enabled: true,
    defaultItemName: "Comprehensive Annual Policy",
    defaultAmount: 5000,
    supportedMethods: ["mpesa", "card", "bank_transfer"],
    allowPromoCodes: true,
    promoCodes: {
      "BOTLY20": 0.20,
      "SAVE15": 0.15
    },
    followUpQuestion: "Would you like me to email your official certificate or download your receipt?"
  },
  currency: {
    code: "KES",
    symbol: "KSh "
  }
});
```

---

### Goal 3: 24/7 Customer Support & Human Triage
**Ideal for:** Help desks, SaaS products, financial institutions, and medical clinics.

```javascript
InsuranceChatbot.init({
  company: { name: "CareFirst Support" },
  goal: "customer_support",
  followUpDynamics: {
    enabled: true,
    tone: "support" // Empathetic issue verification & triage
  },
  leadCapture: {
    askNamePrompt: "I want to ensure you get immediate help for that! Let me connect you directly with a dedicated support rep. May I have your **full name**?",
    askPhonePrompt: "Thank you, **{name}**! What phone number can our agent use to call you back?"
  }
});
```

---

### Goal 4: Consultation & Appointment Booking
**Ideal for:** Law firms, clinics, wealth advisors, real estate brokers, and consultants.

```javascript
InsuranceChatbot.init({
  company: { name: "Sterling Advisory Group" },
  goal: "consultation_booking",
  followUpDynamics: {
    enabled: true,
    tone: "consultative"
  }
});
```

---

## 4. Complete Configuration Schema

Here is the complete JavaScript configuration object with all available properties:

```javascript
InsuranceChatbot.init({
  // 🏢 Company Information
  company: {
    name: "Botly Insurance",
    tagline: "Next-Gen Conversational AI Platform",
    supportEmail: "care@botly.ai",
    supportPhone: "+1 (800) 555-0199",
    websiteUrl: "https://botly.ai",
    logo: "https://yourdomain.com/logo.png" // or Base64 data URI
  },

  // 🎯 Primary Company Goal
  goal: "lead_generation", // 'lead_generation' | 'payment_checkout' | 'customer_support' | 'consultation_booking'

  // 🤖 Bot Persona & Copy
  bot: {
    name: "Botly",
    title: "AI Solutions Concierge",
    avatar: "https://yourdomain.com/avatar.png",
    greeting: "Hello! I am **Botly**. How can I assist you today?",
    typingDelayMs: 400
  },

  // 🎨 Visual Theme
  theme: {
    primaryColor: "#18221c",          // Obsidian dark
    accentColor: "#9be553",           // Vibrant lime
    headerBg: "#18221c",
    userBubbleBg: "#18221c",
    position: "bottom-right",         // 'bottom-right' | 'bottom-left'
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    zIndex: 99999
  },

  // 💰 Currency Settings
  currency: {
    code: "KES",                      // e.g. KES, USD, EUR, GBP
    symbol: "KSh ",                   // e.g. 'KSh ', '$', '€', '£'
    locale: "en-KE"
  },

  // 📋 Lead Capture Settings
  leadCapture: {
    enabled: true,
    askNamePrompt: "That's a fantastic inquiry regarding **{need}**! May I have your **full name**?",
    askPhonePrompt: "Thank you, **{name}**! What is your direct **phone number**?",
    confirmationMessage: "🎉 **Thank you, {name}!** Your request for **{need}** has been recorded.",
    followUpQuestion: "Would you also like an estimated rate breakdown while you wait?"
  },

  // 💳 In-Chat Payment & Checkout Settings
  checkout: {
    enabled: true,
    defaultItemName: "Comprehensive Annual Policy",
    defaultAmount: 5000,
    supportedMethods: ["mpesa", "card", "bank_transfer"],
    allowPromoCodes: true,
    promoCodes: { "BOTLY20": 0.20, "SAVE15": 0.15 }
  },

  // 💬 Human Follow-up Dynamics
  followUpDynamics: {
    enabled: true,
    tone: "consultative"              // 'sales' | 'consultative' | 'support' | 'direct'
  },

  // 📚 Custom Training Knowledge (Q&A Pairs)
  customKnowledge: [
    {
      question: "What is your refund policy?",
      answer: "We provide a 100% money-back guarantee within the first 30 days of service activation.",
      keywords: ["refund", "money back", "guarantee"]
    }
  ],

  // 🔌 Backend REST API Webhook (Optional)
  api: {
    enabled: false,
    mode: "hybrid",                   // 'hybrid' | 'api_only' | 'local_only'
    endpoint: "https://api.yourdomain.com/v1/chat",
    method: "POST",
    responsePath: "reply"
  }
});
```

---

## 5. Public JavaScript SDK API & Browser Events

When Botly is loaded, it exposes the global `window.InsuranceChatbot` object:

### Methods

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `InsuranceChatbot.init(config, selector)` | `config` (Object), `selector` (String/Optional) | Initializes or updates the bot. If `selector` is provided, mounts inline inside that container instead of floating launcher. |
| `InsuranceChatbot.open()` | *none* | Opens the chat window. |
| `InsuranceChatbot.close()` | *none* | Closes the chat window. |
| `InsuranceChatbot.toggle()` | *none* | Toggles the chat window open/closed. |
| `InsuranceChatbot.reset()` | *none* | Resets the conversation and restarts the greeting. |
| `InsuranceChatbot.setCompanyGoal(goalKey)` | `goalKey` (String) | Dynamically switches the company goal at runtime (`lead_generation`, `payment_checkout`, `customer_support`, `consultation_booking`). |
| `InsuranceChatbot.simulateUnlistedInquiry(query)`| `query` (String) | Opens the bot and feeds a custom inquiry to test the lead capture flow. |
| `InsuranceChatbot.startCheckout()` | *none* | Opens the in-chat payment checkout card immediately. |
| `InsuranceChatbot.getCapturedLeads()` | *none* | Returns an Array of all captured customer leads from storage. |
| `InsuranceChatbot.exportLeadsCSV()` | *none* | Returns a formatted CSV string of all captured leads. |
| `InsuranceChatbot.clearCapturedLeads()` | *none* | Clears all captured leads from local storage. |
| `InsuranceChatbot.trainData(content, format)` | `content` (String), `format` ('csv'/'json'/'text') | Dynamically ingests training Q&A into memory at runtime. |

### Browser Custom Events

Botly dispatches real-time DOM events on `window`:

```javascript
// Listen for captured leads
window.addEventListener('botly:leadCaptured', (event) => {
  const lead = event.detail;
  console.log('Lead ID:', lead.id);
  console.log('Name:', lead.name);
  console.log('Phone:', lead.phone);
  console.log('Need:', lead.need);
  console.log('Goal:', lead.goal);
});
```

---

## 6. Backend Webhook & CRM Sync

You can forward leads to your webhook, CRM (HubSpot, Salesforce, Zoho), or Slack channel in real time:

```javascript
window.addEventListener('botly:leadCaptured', async (event) => {
  const lead = event.detail;

  try {
    await fetch('https://your-crm-api.com/webhook/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: lead.id,
        customer_name: lead.name,
        contact_phone: lead.phone,
        inquired_topic: lead.need,
        business_goal: lead.goal,
        source_url: window.location.href,
        created_at: lead.timestamp
      })
    });
  } catch (err) {
    console.error('Failed to forward lead to CRM:', err);
  }
});
```

---

## 7. Production Deployment & Security Checklist

Before deploying Botly to your production environment, verify the following:

- [x] **Content Security Policy (CSP)**: If your site enforces a strict CSP, whitelist:
  - `style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline';`
  - `script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline';`
  - `connect-src 'self' https://api.yourdomain.com;` (if using backend API)
- [x] **Mobile Responsiveness**: Botly automatically detects viewport widths `< 480px` and enters an app-like fullscreen drawer for optimal mobile ergonomics.
- [x] **Z-Index Positioning**: Botly uses `z-index: 99999` by default. You can adjust this in `theme.zIndex`.
- [x] **Privacy & PCI-DSS**: All payment simulations and lead collections run in encrypted sessions. Never log credit card numbers or security CVVs in plain text.

---

### Need Custom Visual Branding?
Use the **[Botly Customizer Studio](demo/customizer.html)** to visually preview colors, upload custom logos, test lead flows, and export custom JSON configs with 1 click.
