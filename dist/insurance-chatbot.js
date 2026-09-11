/**
 * Plug & Play Insurance Chatbot (Standalone UMD/IIFE Distribution)
 * Zero external dependencies. Works in any website, WordPress, React, Shopify, or Webflow.
 * https://github.com/NextAIStudios/chatbot
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.InsuranceChatbot = factory());
})(this, (function () { 'use strict';

  // 1. COMPANY GOALS CATALOG
  var COMPANY_GOALS = {
    lead_generation: {
      id: 'lead_generation',
      title: 'Lead Generation & Sales',
      icon: '🚀',
      description: 'Capture prospect names, phones, and custom needs to grow sales pipeline',
      botTitle: 'Sales & Solutions Concierge',
      greeting: "Hello! I am **{botName}**, your sales & solutions concierge. How can I help you find the perfect coverage or customized package today?",
      quickReplies: [
        { label: '🚗 Instant Quote', payload: 'intent_quote_auto' },
        { label: '💡 Custom Package', payload: 'intent_custom_package' },
        { label: '📞 Talk to Specialist', payload: 'intent_human_handover' },
        { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
      ],
      askNamePrompt: "That's a fantastic inquiry{needTopic}! That is a specialized requirement, and our solutions team can prepare a custom quote for you.\n\nMay I please have your **full name**?",
      askPhonePrompt: "Thank you, **{name}**! What is your direct **phone number** (or WhatsApp) for our solutions specialist to reach you?",
      confirmationMessage: "🎉 **Thank you, {name}!** Your custom inquiry for **{need}** has been assigned to our senior specialist. We will reach out to **{phone}** with your proposal.",
      followUpQuestion: "Would you also like an estimated price breakdown while you wait, or shall our specialist call you directly?",
      followUpTone: 'sales',
      checkoutEnabled: true
    },
    payment_checkout: {
      id: 'payment_checkout',
      title: 'In-Chat Payments & Checkout',
      icon: '💳',
      description: 'Direct frictionless transactions, M-Pesa/Card payments, and instant certificates',
      botTitle: 'Instant Checkout & Billing Concierge',
      greeting: "Welcome! I am **{botName}**, ready to assist with instant policy activations, premium payments, and digital receipt generation. What would you like to activate or pay today?",
      quickReplies: [
        { label: '💳 Pay Premium Now', payload: 'intent_pay' },
        { label: '🚗 Fast Quote & Pay', payload: 'intent_quote_auto' },
        { label: '📑 Check Active Invoices', payload: 'intent_policy_lookup' },
        { label: '🎟️ Apply Discount Promo', payload: 'intent_promo_info' }
      ],
      askNamePrompt: "While that specific package isn't in our instant checkout catalog yet, we can prepare a bespoke payment link and certificate. May I have your **full name** to start?",
      askPhonePrompt: "Thank you, **{name}**! What **phone number** should receive your M-Pesa prompt or payment confirmation SMS?",
      confirmationMessage: "🎉 **Payment request initiated, {name}!** Our billing desk has logged your order for **{need}**. You will receive an SMS confirmation at **{phone}**.",
      followUpQuestion: "Would you like to complete an instant checkout right now, or view our active promo code discounts?",
      followUpTone: 'sales',
      checkoutEnabled: true
    },
    customer_support: {
      id: 'customer_support',
      title: '24/7 Customer Support',
      icon: '🎧',
      description: 'Instant FAQ answers, claims filing, and human agent callback escalation',
      botTitle: '24/7 Customer Support Concierge',
      greeting: "Hello! I am **{botName}**, your 24/7 support assistant. Ask me anything about policies, claims, coverage rules, or account services.",
      quickReplies: [
        { label: '❓ Common FAQs', payload: 'intent_coverage_overview' },
        { label: '📑 File a Claim', payload: 'intent_claim' },
        { label: '🔍 Check Deductibles', payload: 'intent_deductible_faq' },
        { label: '🆘 Speak with Human Agent', payload: 'intent_human_handover' }
      ],
      askNamePrompt: "I want to make sure you get the exact, accurate assistance for that! Let me connect you directly with a dedicated support specialist. Could you please share your **full name**?",
      askPhonePrompt: "Thank you, **{name}**! What is the best **phone number** for our support agent to call you back?",
      confirmationMessage: "📋 **Support ticket logged, {name}!** Your inquiry regarding **{need}** has been marked for immediate agent callback at **{phone}**.",
      followUpQuestion: "Did that help resolve your current concern, or is there another account matter I can check for you?",
      followUpTone: 'support',
      checkoutEnabled: false
    },
    consultation_booking: {
      id: 'consultation_booking',
      title: 'Consultation & Booking',
      icon: '📅',
      description: 'Pre-qualify leads, assess requirements, and schedule 1-on-1 advisor sessions',
      botTitle: 'Consultation & Advisory Concierge',
      greeting: "Welcome! I am **{botName}**, your consultation advisor. I can help assess your requirements, answer questions, and schedule a 1-on-1 advisor session.",
      quickReplies: [
        { label: '📅 Book 1-on-1 Consultation', payload: 'intent_book_consultation' },
        { label: '📋 Pre-Qualify My Needs', payload: 'intent_prequalify' },
        { label: '📞 Request Advisor Callback', payload: 'intent_human_handover' },
        { label: '💼 View Advisory Services', payload: 'intent_coverage_overview' }
      ],
      askNamePrompt: "That sounds like a great topic to discuss during a dedicated consultation! Let's get your advisor session scheduled. May I have your **full name**?",
      askPhonePrompt: "Thank you, **{name}**! What is your preferred **phone number** to confirm your consultation schedule?",
      confirmationMessage: "📅 **Consultation booked, {name}!** An advisor will contact you at **{phone}** to finalize your consultation for **{need}**.",
      followUpQuestion: "Would morning or afternoon work better for your consultation call?",
      followUpTone: 'consultative',
      checkoutEnabled: true
    }
  };

  // 2. DEFAULT CONFIGURATION
  var DEFAULT_CONFIG = {
    goal: 'lead_generation',
    leadCapture: {
      enabled: true,
      triggerOnUnlisted: true,
      askNamePrompt: "That's a fantastic inquiry{needTopic}! While I don't have all the exact specifications for that right here in my instant guide, I'd love to connect you with our specialist team so they can prepare a custom solution and exact quote for you.\n\nMay I please have your **full name**?",
      askPhonePrompt: "Wonderful to meet you, **{name}**! 🤝\n\nWhat is the best **phone number** (or direct contact) for our specialist team to reach you?",
      confirmationMessage: "🎉 **Thank you, {name}!**\n\nYour request for **{need}** has been saved and routed directly to our specialist team. An advisor will reach out to you at **{phone}** shortly.",
      followUpQuestion: "💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant quote rates or see an overview of our coverage?",
      storageKey: 'botly_captured_leads',
      requirePhone: true
    },
    checkout: {
      enabled: true,
      defaultItemName: 'Comprehensive Policy Premium',
      defaultAmount: 5000,
      supportedMethods: ['mpesa', 'card', 'bank_transfer'],
      allowPromoCodes: true,
      promoCodes: {
        'BOTLY20': 0.20,
        'SAVE15': 0.15,
        'WELCOME10': 0.10
      },
      followUpQuestion: "Would you like me to email you an official stamped certificate, or download your receipt?"
    },
    followUpDynamics: {
      enabled: true,
      tone: 'consultative'
    },
    company: {
      name: 'Botly Insurance',
      tagline: 'Next-Gen Insurance AI Platform',
      logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-2.33v8.02z"/></svg>',
      supportEmail: 'care@botly.ai',
      supportPhone: '+1 (800) 555-0199',
      websiteUrl: 'https://botly.ai',
      licenseNumber: 'INS-LIC-2026-882190'
    },
    bot: {
      name: 'Botly',
      title: 'AI Assistant',
      avatar: 'demo/botly-icon.svg',
      greeting: "Hello! I am **Botly**, your 24/7 digital assistant. How can I help you today? You can explore our catalog, request a quote, or process payments securely.",
      initialQuickReplies: [
        { label: 'Auto Quote', payload: 'intent_quote_auto' },
        { label: 'Health Plans', payload: 'intent_quote_health' },
        { label: 'File a Claim', payload: 'intent_claim' },
        { label: 'Pay Premium', payload: 'intent_pay' },
        { label: 'Coverage Overview', payload: 'intent_coverage_overview' }
      ],
      typingDelayMs: 400
    },
    theme: {
      primaryColor: '#18221c',
      primaryGradient: 'linear-gradient(135deg, #18221c 0%, #26352c 100%)',
      primaryHover: '#26352c',
      accentColor: '#9be553',
      headerBg: '#18221c',
      headerText: '#ffffff',
      userBubbleBg: '#18221c',
      userBubbleText: '#ffffff',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      borderRadius: '18px',
      soundEffects: true
    },
    currency: { code: 'KES', symbol: 'KSh ', locale: 'en-KE' },
    products: {
      auto: {
        name: 'Comprehensive Auto Shield',
        icon: '🚗',
        baseAnnualRate: 48000,
        tiers: [
          { id: 'auto_standard', name: 'Liability Plus', deductible: 15000, rateMultiplier: 0.75, coverageLimit: 1500000 },
          { id: 'auto_comp', name: 'Comprehensive Shield', deductible: 10000, rateMultiplier: 1.0, coverageLimit: 3000000, popular: true },
          { id: 'auto_elite', name: 'Elite Premier Zero-Ded', deductible: 0, rateMultiplier: 1.35, coverageLimit: 6000000 }
        ],
        addons: [
          { id: 'addon_roadside', name: '24/7 Roadside Rescue & Towing', costPerYear: 3500 },
          { id: 'addon_rental', name: 'Courtesy Car Replacement (10 Days)', costPerYear: 4000 }
        ]
      },
      health: {
        name: 'CareVital Health & Medical',
        icon: '🏥',
        baseAnnualRate: 72000,
        tiers: [
          { id: 'health_silver', name: 'Silver Care', deductible: 10000, rateMultiplier: 0.8, coverageLimit: 2000000 },
          { id: 'health_gold', name: 'Gold Advantage', deductible: 5000, rateMultiplier: 1.1, coverageLimit: 5000000, popular: true },
          { id: 'health_platinum', name: 'Platinum Complete', deductible: 0, rateMultiplier: 1.5, coverageLimit: 10000000 }
        ],
        addons: [
          { id: 'addon_dental', name: 'Comprehensive Dental Care', costPerYear: 8500 },
          { id: 'addon_vision', name: 'Vision Care & Designer Frames', costPerYear: 5000 }
        ]
      },
      home: {
        name: 'HomeGuard Property & Contents',
        icon: '🏡',
        baseAnnualRate: 28000,
        tiers: [
          { id: 'home_renters', name: 'Renters Content Shield', deductible: 5000, rateMultiplier: 0.5, coverageLimit: 1500000 },
          { id: 'home_standard', name: 'Homeowners Essential', deductible: 10000, rateMultiplier: 1.0, coverageLimit: 15000000, popular: true },
          { id: 'home_estate', name: 'Estate Luxury Protection', deductible: 15000, rateMultiplier: 1.6, coverageLimit: 40000000 }
        ],
        addons: [
          { id: 'addon_flood', name: 'Flood & Water Backup Endorsement', costPerYear: 4500 }
        ]
      },
      life: {
        name: 'EverSure Term Life',
        icon: '🕊️',
        baseAnnualRate: 36000,
        tiers: [
          { id: 'life_5m', name: '20-Year Term (KSh 5,000,000)', deductible: 0, rateMultiplier: 0.8, coverageLimit: 5000000 },
          { id: 'life_10m', name: '20-Year Term (KSh 10,000,000)', deductible: 0, rateMultiplier: 1.0, coverageLimit: 10000000, popular: true },
          { id: 'life_25m', name: '30-Year Term (KSh 25,000,000)', deductible: 0, rateMultiplier: 1.8, coverageLimit: 25000000 }
        ],
        addons: [
          { id: 'addon_critical', name: 'Accelerated Critical Illness Rider', costPerYear: 6000 }
        ]
      },
      travel: {
        name: 'GlobeTrek Travel Shield',
        icon: '✈️',
        baseAnnualRate: 15000,
        tiers: [
          { id: 'travel_single', name: 'Single Trip Worldwide', deductible: 1000, rateMultiplier: 0.6, coverageLimit: 1500000 },
          { id: 'travel_annual', name: 'Multi-Trip Annual Pass', deductible: 1000, rateMultiplier: 1.0, coverageLimit: 6000000, popular: true }
        ],
        addons: [
          { id: 'addon_cancel_any', name: 'Cancel For Any Reason (CFAR 75%)', costPerYear: 2500 }
        ]
      }
    },
    payment: {
      taxRate: 0.045,
      promoCodes: { 'SAVE15': 0.15, 'SAFE20': 0.20, 'AEGIS10': 0.10 }
    },
    customFaqs: []
  };

  // 2. KNOWLEDGE BASE
  var INSURANCE_KNOWLEDGE_BASE = [
    {
      id: 'auto_comp_vs_third_party',
      category: 'auto',
      keywords: ['difference between comprehensive and third party', 'third party vs comprehensive', 'what is comprehensive', 'what is third party', 'third party'],
      question: 'What is the difference between Comprehensive and Third-Party car insurance?',
      answer: '🚗 **Comprehensive vs. Third-Party Coverage:**\n\n• **Third-Party Only (TPO):** The legal minimum. It covers bodily injury and property damage you cause to *other people* and their vehicles. It does **not** pay for repairs to your own car.\n• **Third-Party, Fire & Theft (TPFT):** Covers other people losses PLUS damage to your car caused by fire, lightning, explosion, or theft.\n• **Comprehensive Shield (Recommended):** The ultimate peace of mind. Covers third-party liabilities PLUS accidental damage, rollover, vandalism, windshield breakage, natural disasters, and repairs to your own car regardless of who was at fault!'
    },
    {
      id: 'auto_accident_steps',
      category: 'auto',
      keywords: ['car accident', 'i had an accident', 'what to do if accident', 'crashed my car', 'accident'],
      question: 'What should I do immediately if I am involved in a car accident?',
      answer: '🚨 **Immediate Steps After an Accident:**\n\n1. **Ensure Safety:** Turn on hazard lights, check for injuries, and call emergency services if needed.\n2. **Do Not Admit Fault:** Exchange contact and insurance details politely.\n3. **Document the Scene:** Take clear photos of all vehicles, damage, license plates, and surroundings.\n4. **Obtain Police Abstract:** Request a police incident reference number.\n5. **Notify Us Promptly:** Tap **"📑 File a Claim"** right here in chat to start your claim and request immediate towing assistance!'
    },
    {
      id: 'auto_deductible',
      category: 'auto',
      keywords: ['what is deductible', 'how does deductible work', 'what is excess in car insurance', 'deductible', 'excess'],
      question: 'What is an insurance deductible (excess)?',
      answer: '💰 **Insurance Deductible Explained:**\n\nThe deductible (excess) is the out-of-pocket amount you agree to pay toward a repair before your insurance covers the rest.\n\n*Example:* If your repair costs **$2,500** and your deductible is **$500**, you pay $500 and your insurer pays the remaining **$2,000**.\n\n💡 Choosing a higher deductible lowers your monthly premium, while a lower deductible provides maximum coverage.'
    },
    {
      id: 'auto_discounts',
      category: 'auto',
      keywords: ['how to get discount', 'car insurance discount', 'save money on insurance', 'promo code', 'discount'],
      question: 'How can I lower my auto insurance premium?',
      answer: '🏷️ **Discounts Available to You:**\n\n• **Safe Driver Discount:** Up to 20% off for clean driving records.\n• **Multi-Policy Bundle:** Save 15% when you bundle Auto with Home or Health.\n• **Telematics / Low Mileage:** Rate reductions for driving under 7,500 miles/year.\n• **Anti-Theft Device:** Installing verified alarms/GPS saves up to 10%.\n• **Chatbot Promo:** Use code **"SAVE15"** at checkout today for an extra 15% discount!'
    },
    {
      id: 'health_inpatient_vs_outpatient',
      category: 'health',
      keywords: ['inpatient vs outpatient', 'what is inpatient', 'what is outpatient', 'hospitalization', 'health'],
      question: 'What is the difference between Inpatient and Outpatient coverage?',
      answer: '🏥 **Inpatient vs. Outpatient Care:**\n\n• **Inpatient Care:** Medical treatment requiring hospital admission and overnight stay (surgeries, ICU, major trauma).\n• **Outpatient Care:** Consultations, lab tests, prescriptions, and minor procedures where you visit a clinic and return home the same day.\n\nAll our CareVital Health Plans include full inpatient coverage with optional outpatient riders!'
    },
    {
      id: 'health_preexisting',
      category: 'health',
      keywords: ['pre existing conditions', 'do you cover diabetes', 'waiting period for illness', 'chronic condition', 'pre-existing'],
      question: 'Are pre-existing medical conditions covered?',
      answer: '🩺 **Pre-Existing Conditions Coverage:**\n\nYes! Pre-existing conditions (e.g., asthma, hypertension, diabetes) are covered under our comprehensive health tiers after a standard waiting period of 12 to 24 months. Emergency care and accidents are covered immediately from Day 1.'
    },
    {
      id: 'home_dwelling_vs_contents',
      category: 'home',
      keywords: ['dwelling vs personal property', 'what is contents insurance', 'renters vs homeowners', 'home insurance', 'property'],
      question: 'What is the difference between Dwelling and Contents insurance?',
      answer: '🏡 **Dwelling vs. Contents Insurance:**\n\n• **Dwelling Coverage:** Protects the physical structure of your house (walls, roof, foundation, plumbing) against fire, storm, and structural hazards.\n• **Personal Property (Contents):** Protects everything inside the home (furniture, electronics, appliances, clothing, jewelry).\n\n🏢 **Renting?** Our Renters Content Shield covers all your personal possessions without charging for the building!'
    },
    {
      id: 'life_term_vs_whole',
      category: 'life',
      keywords: ['term vs whole life', 'difference between term and whole life', 'what life insurance should i get', 'life insurance'],
      question: 'Should I choose Term Life or Whole Life insurance?',
      answer: '🕊️ **Term Life vs. Whole Life:**\n\n• **Term Life (Most Popular):** Protects you for 10, 20, or 30 years. If you pass away during the term, your beneficiaries receive a tax-free cash payout. Perfect for income replacement.\n• **Whole Life (Permanent):** Covers you for your entire life and builds cash value over time.'
    },
    {
      id: 'travel_coverage',
      category: 'travel',
      keywords: ['what does travel insurance cover', 'flight cancellation', 'lost luggage', 'emergency abroad', 'travel insurance'],
      question: 'What does travel insurance cover?',
      answer: '✈️ **GlobeTrek Travel Shield Covers:**\n\n1. **Emergency Medical Evacuation:** Up to $1,000,000 overseas hospital expenses.\n2. **Trip Cancellation & Interruption:** Full refunds for non-refundable flights/hotels.\n3. **Lost or Delayed Baggage:** Up to $2,500 reimbursement.\n4. **Flight Delay:** Meal & hotel vouchers after 4-hour delay.'
    },
    {
      id: 'claims_how_to_file',
      category: 'claims',
      keywords: ['how do i file a claim', 'start a claim', 'claim process', 'make a claim', 'claim'],
      question: 'How do I file an insurance claim?',
      answer: '📑 **Filing a Claim is Simple:**\n\n1. Type **"File a claim"** or tap the button below to start our guided claims wizard in chat.\n2. Provide your policy number or registered email/phone.\n3. Describe the incident and submit details.\n4. Our automated triage reviews claims in **under 2 hours** with rapid payout via Bank or Mobile Money!'
    },
    {
      id: 'payments_methods',
      category: 'payments',
      keywords: ['how can i pay', 'payment methods', 'do you accept cards', 'can i pay with mpesa', 'apple pay', 'payment'],
      question: 'What payment methods do you accept?',
      answer: '💳 **Accepted Payment Methods:**\n\n• **Credit / Debit Cards:** Visa, Mastercard, American Express.\n• **Digital Wallets:** Apple Pay, Google Pay.\n• **Mobile Money:** M-Pesa, Airtel Money.\n• **Direct Bank Transfer:** Instant secure ACH/Wire.\n\nAll transactions are encrypted with bank-level 256-bit TLS directly in this chat!'
    },
    {
      id: 'company_contact',
      category: 'company',
      keywords: ['how to contact you', 'phone number', 'customer support email', 'talk to human agent', 'speak to representative'],
      question: 'How do I speak with a human agent or contact customer support?',
      answer: '📞 **Customer Support:**\n\n• **Toll-Free Phone:** +1 (800) 555-0199 (Mon–Fri 8am–8pm)\n• **Email Support:** care@botly.ai\n• **24/7 Claims Emergency:** Available worldwide\n\nType **"Connect to agent"** and leave your phone or email to schedule an instant callback!'
    }
  ];

  // 3. INTENT & NLP ENGINE
  function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(function(w) { return w.length > 1; });
  }

  function computeScore(queryTokens, targetText, targetKeywords) {
    var allTargetTokens = tokenize(targetText);
    if (targetKeywords) {
      targetKeywords.forEach(function(k) {
        allTargetTokens = allTargetTokens.concat(tokenize(k));
      });
    }
    var targetSet = {};
    allTargetTokens.forEach(function(t) { targetSet[t] = true; });

    var targetCount = Object.keys(targetSet).length;
    if (targetCount === 0 || queryTokens.length === 0) return 0;

    var matches = 0;
    queryTokens.forEach(function(token) {
      if (targetSet[token]) {
        matches += 1.5;
      } else {
        for (var t in targetSet) {
          if (t.indexOf(token) !== -1 || token.indexOf(t) !== -1) {
            matches += 0.8;
            break;
          }
        }
      }
    });
    return matches / Math.sqrt(queryTokens.length * targetCount);
  }

  // 3b. DATA TRAINING & INGESTION ENGINE
  function extractTokens(text) {
    if (!text) return [];
    var stopWords = ['what', 'is', 'the', 'how', 'do', 'can', 'are', 'in', 'to', 'for', 'of', 'and', 'a', 'an', 'my', 'your', 'we', 'you', 'it', 'on', 'with', 'at', 'by', 'this', 'that', 'from', 'our', 'will', 'does'];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(function(w) { return w.length > 2 && stopWords.indexOf(w) === -1; });
  }

  function parseCSVData(csvText) {
    if (!csvText || !csvText.trim()) return [];
    var lines = csvText.split(/\r?\n/).filter(function(l) { return l.trim().length > 0; });
    if (lines.length === 0) return [];

    function parseRow(row) {
      var result = [];
      var current = '';
      var inQuotes = false;
      for (var i = 0; i < row.length; i++) {
        var char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === '\t') && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return result;
    }

    var first = parseRow(lines[0]);
    var lower = first.map(function(h) { return h.toLowerCase(); });
    var hasHeader = lower.some(function(h) { return ['question', 'query', 'prompt', 'q', 'title'].indexOf(h) !== -1; });

    var qIdx = 0, aIdx = 1, catIdx = -1, kwIdx = -1;
    if (hasHeader) {
      qIdx = lower.findIndex(function(h) { return ['question', 'query', 'prompt', 'q', 'title'].indexOf(h) !== -1; });
      var foundA = lower.findIndex(function(h) { return ['answer', 'response', 'reply', 'a', 'content'].indexOf(h) !== -1; });
      if (foundA !== -1) aIdx = foundA;
      catIdx = lower.findIndex(function(h) { return ['category', 'topic', 'tag', 'department'].indexOf(h) !== -1; });
      kwIdx = lower.findIndex(function(h) { return ['keywords', 'tags', 'synonyms'].indexOf(h) !== -1; });
    }

    var items = [];
    var start = hasHeader ? 1 : 0;
    for (var i = start; i < lines.length; i++) {
      var cols = parseRow(lines[i]);
      var q = cols[qIdx] || '';
      var a = cols[aIdx] || '';
      if (!q || !a) continue;
      var cat = (catIdx >= 0 && cols[catIdx]) ? cols[catIdx] : 'general';
      var kw = (kwIdx >= 0 && cols[kwIdx]) ? cols[kwIdx].split(/[,;|]/).map(function(s) { return s.trim(); }) : extractTokens(q);
      items.push({
        id: 'custom_kb_' + Date.now() + '_' + items.length,
        question: q.trim(),
        answer: a.trim(),
        category: cat.trim(),
        keywords: kw,
        isCustomTrained: true
      });
    }
    return items;
  }

  function parseJSONData(jsonText) {
    var data = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
    var items = [];
    if (Array.isArray(data)) {
      data.forEach(function(item, idx) {
        var q = item.question || item.query || item.q || item.title;
        var a = item.answer || item.response || item.reply || item.a || item.content;
        if (q && a) {
          items.push({
            id: item.id || ('custom_kb_' + Date.now() + '_' + idx),
            question: String(q).trim(),
            answer: String(a).trim(),
            category: item.category || 'general',
            keywords: Array.isArray(item.keywords) ? item.keywords : extractTokens(String(q)),
            isCustomTrained: true
          });
        }
      });
    } else if (data && typeof data === 'object') {
      var nested = data.faqs || data.items || data.data || data.questions;
      if (Array.isArray(nested)) return parseJSONData(nested);
      var idx = 0;
      for (var k in data) {
        if (typeof data[k] === 'string' || (data[k] && data[k].answer)) {
          var ans = typeof data[k] === 'string' ? data[k] : data[k].answer;
          items.push({
            id: 'custom_kb_' + Date.now() + '_' + (idx++),
            question: k.trim(),
            answer: String(ans).trim(),
            category: 'general',
            keywords: extractTokens(k),
            isCustomTrained: true
          });
        }
      }
    }
    return items;
  }

  function parsePlainTextData(rawText) {
    if (!rawText || !rawText.trim()) return [];
    var text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var items = [];

    var lines = text.split('\n');
    var currentQ = null;
    var currentA = [];
    var currentCat = 'general';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      var qMatch = trimmed.match(/^(?:Q|Question)\s*:\s*(.+)$/i);
      var aMatch = trimmed.match(/^(?:A|Answer)\s*:\s*(.*)$/i);

      if (qMatch) {
        if (currentQ && currentA.length > 0) {
          var ans = currentA.join('\n').trim();
          if (ans) {
            items.push({
              id: 'custom_kb_' + Date.now() + '_' + items.length,
              question: currentQ.trim(),
              answer: ans,
              category: currentCat,
              keywords: extractTokens(currentQ),
              isCustomTrained: true
            });
          }
        }
        currentQ = qMatch[1].trim();
        currentA = [];
      } else if (aMatch && currentQ) {
        if (aMatch[1]) currentA.push(aMatch[1]);
      } else if (currentQ && currentA.length > 0) {
        currentA.push(line);
      }
    }

    if (currentQ && currentA.length > 0) {
      var lastAns = currentA.join('\n').trim();
      if (lastAns) {
        items.push({
          id: 'custom_kb_' + Date.now() + '_' + items.length,
          question: currentQ.trim(),
          answer: lastAns,
          category: currentCat,
          keywords: extractTokens(currentQ),
          isCustomTrained: true
        });
      }
    }

    if (items.length > 0) return items;

    var mdRegex = /(?:^|\n)#{1,4}\s*([^\n]+)\s*\n([\s\S]+?)(?=(?:\n#{1,4}\s*)|$)/g;
    while ((match = mdRegex.exec(rawText)) !== null) {
      var mq = match[1].trim();
      var ma = match[2].trim();
      if (mq && ma) {
        items.push({
          id: 'custom_kb_' + Date.now() + '_' + items.length,
          question: mq,
          answer: ma,
          category: 'general',
          keywords: extractTokens(mq),
          isCustomTrained: true
        });
      }
    }
    if (items.length > 0) return items;

    var paras = rawText.split(/\n\s*\n/).filter(function(p) { return p.trim().length > 15; });
    paras.forEach(function(p, idx) {
      var lines = p.trim().split('\n');
      var f = lines[0].replace(/^[0-9]+[\.\)]\s*/, '').trim();
      items.push({
        id: 'custom_kb_' + Date.now() + '_' + idx,
        question: f.length < 120 ? f : f.slice(0, 117) + '...',
        answer: p.trim(),
        category: 'document',
        keywords: extractTokens(f),
        isCustomTrained: true
      });
    });
    return items;
  }

  function parseTrainingData(content, format) {
    format = format || 'auto';
    var trimmed = (content || '').trim();
    var parsed = [];
    if (format === 'json' || (format === 'auto' && (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '['))) {
      try { parsed = parseJSONData(trimmed); } catch(e) {}
    }
    if (parsed.length === 0 && (format === 'csv' || (format === 'auto' && (trimmed.indexOf(',') !== -1 || trimmed.indexOf('\t') !== -1) && trimmed.indexOf('\n') !== -1))) {
      parsed = parseCSVData(trimmed);
    }
    if (parsed.length === 0) {
      parsed = parsePlainTextData(trimmed);
    }
    return parsed;
  }

  // 3c. BACKEND API CONNECTOR
  function queryBackendApi(apiConfig, text, context, callback) {
    if (!apiConfig || (!apiConfig.endpoint && !apiConfig.mockServer)) {
      callback({ success: false, error: 'API not configured' });
      return;
    }

    if (apiConfig.mockServer || apiConfig.endpoint === 'mock://insurance-ai') {
      setTimeout(function() {
        callback({
          success: true,
          reply: '[⚡ Backend API Response] "' + text + '" was verified and answered by your custom backend underwriter for ' + (context.companyName || 'Botly Insurance') + '.',
          latencyMs: 75,
          raw: { status: 'success', query: text, timestamp: new Date().toISOString() }
        });
      }, 75);
      return;
    }

    var method = (apiConfig.method || 'POST').toUpperCase();
    var url = apiConfig.endpoint;
    var headers = Object.assign({ 'Content-Type': 'application/json' }, apiConfig.headers || {});
    if (apiConfig.authBearer) {
      headers['Authorization'] = apiConfig.authBearer.indexOf('Bearer ') === 0 ? apiConfig.authBearer : ('Bearer ' + apiConfig.authBearer);
    }

    var body = null;
    if (method === 'GET') {
      url += (url.indexOf('?') === -1 ? '?' : '&') + 'query=' + encodeURIComponent(text);
    } else {
      var template = apiConfig.payloadTemplate || '{"message": "{{message}}", "sessionId": "{{sessionId}}", "company": "{{companyName}}"}';
      body = template
        .replace(/\{\{message\}\}/g, JSON.stringify(text).slice(1, -1))
        .replace(/\{\{sessionId\}\}/g, context.sessionId || 'session_web')
        .replace(/\{\{companyName\}\}/g, (context.companyName || 'Insurance Company').replace(/"/g, '\\"'));
    }

    var startTime = Date.now();
    fetch(url, { method: method, headers: headers, body: body })
      .then(function(res) {
        var latency = Date.now() - startTime;
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ': ' + res.statusText);
        }
        return res.json().then(function(data) {
          return { data: data, latency: latency };
        });
      })
      .then(function(result) {
        var path = apiConfig.responsePath || 'reply';
        var reply = result.data;
        if (path && typeof result.data === 'object' && result.data !== null) {
          var parts = path.split('.');
          var curr = result.data;
          for (var i = 0; i < parts.length; i++) {
            if (curr) curr = curr[parts[i]];
          }
          if (curr) reply = curr;
        }
        if (typeof reply === 'object') reply = reply.content || reply.text || reply.message || JSON.stringify(reply);
        callback({
          success: true,
          reply: String(reply),
          latencyMs: result.latency,
          raw: result.data,
          quickReplies: result.data.quickReplies || null,
          action: result.data.action || null
        });
      })
      .catch(function(err) {
        callback({
          success: false,
          latencyMs: Date.now() - startTime,
          error: err.message
        });
      });
  }

  function classifyQuery(text, config, customFaqs, customKnowledge) {
    var raw = (text || '').trim();
    var queryTokens = tokenize(raw);
    var lower = raw.toLowerCase();

    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
      return {
        intent: 'greeting',
        reply: "Hello! 👋 I'm **" + (config.bot?.name || 'Botly AI') + "**, your 24/7 insurance concierge. How can I protect you today? You can calculate instant quotes, report a claim, or ask any coverage question."
      };
    }

    if (/^(thank\s*you|thanks|thx|awesome|great|perfect)\b/i.test(lower)) {
      return {
        intent: 'thanks',
        reply: "You're very welcome! Protecting what matters most to you is what we do best. 😊 What else can I help you with?"
      };
    }

    if (/human|agent|representative|speak\s*to|advisor|person/i.test(lower)) {
      return {
        intent: 'human_handover',
        reply: "I'd be glad to connect you with a licensed advisor! Call us directly at **" + (config.company?.supportPhone || '+1 (800) 555-0199') + "** or email **" + (config.company?.supportEmail || 'care@insurance.example.com') + "**.\n\nLeave your phone or email below and we'll call you right back!"
      };
    }

    if (/claim|accident|stolen|theft|damage|crashed|file\s*a\s*claim/i.test(lower)) {
      if (/difference|how\s*long|timeline/i.test(lower)) {
        // fall through to FAQ
      } else {
        return { intent: 'start_claim_flow', action: 'OPEN_CLAIMS_WIZARD' };
      }
    }

    if (/\b(pay|payment|checkout|buy\s*policy|renew\s*policy|premium)\b/i.test(lower)) {
      if (/methods?|accept|how\s*can\s*i\s*pay|installment/i.test(lower)) {
        // fall through to FAQ
      } else {
        return { intent: 'start_payment_flow', action: 'OPEN_PAYMENT_WIZARD' };
      }
    }

    if (/\b(quote|price|cost|estimate|rate|how\s*much|calculate)\b/i.test(lower)) {
      var prod = 'auto';
      if (/health|medical|doctor/i.test(lower)) prod = 'health';
      else if (/home|house|property|renter/i.test(lower)) prod = 'home';
      else if (/life|death/i.test(lower)) prod = 'life';
      else if (/travel|trip|flight/i.test(lower)) prod = 'travel';
      return { intent: 'start_quote_flow', productType: prod, action: 'OPEN_QUOTE_WIZARD' };
    }

    // Knowledge Base Search (Custom Trained Knowledge has priority boost)
    var allFaqs = (customKnowledge || []).concat(customFaqs || []).concat(INSURANCE_KNOWLEDGE_BASE);
    var stopWords = { 'do': 1, 'you': 1, 'we': 1, 'i': 1, 'the': 1, 'a': 1, 'an': 1, 'and': 1, 'or': 1, 'of': 1, 'for': 1, 'in': 1, 'on': 1, 'to': 1, 'is': 1, 'are': 1, 'it': 1, 'can': 1, 'how': 1, 'what': 1, 'offer': 1, 'have': 1, 'insurance': 1, 'policy': 1 };
    var best = null;
    var highest = 0;
    allFaqs.forEach(function(item) {
      var qTokens = tokenize(item.question).concat((item.keywords || []).flatMap(function(k) { return tokenize(k); }));
      var keyMatches = 0;
      queryTokens.forEach(function(t) {
        if (qTokens.indexOf(t) !== -1 && !stopWords[t]) {
          keyMatches += 2.5;
        }
      });

      var score = computeScore(queryTokens, item.question + ' ' + item.answer, item.keywords);
      if (keyMatches > 0) {
        score += keyMatches * 0.2;
      } else {
        score *= 0.2;
      }

      if (item.isCustomTrained) score *= 1.35;
      if (score > highest) {
        highest = score;
        best = item;
      }
    });

    function generateFollowUpQuestion(item) {
      var tone = (config && config.followUpDynamics && config.followUpDynamics.tone) || (config && config.goal === 'customer_support' ? 'support' : (config && config.goal === 'payment_checkout' ? 'sales' : 'consultative'));

      if (tone === 'direct') {
        return '💬 Would you like to proceed with this or explore other options?';
      }

      if (!item) {
        if (tone === 'sales') return '💬 Would you like me to connect you with an advisor to reserve this rate today?';
        if (tone === 'support') return '💬 Did this completely solve your inquiry, or can I clarify anything else?';
        return '💬 Does this answer your question, or would you like me to clarify anything specific?';
      }

      var cat = item.category || '';
      var q = (item.question || '').toLowerCase();

      if (tone === 'sales') {
        if (cat === 'payments' || q.indexOf('pay') !== -1) {
          return '💬 Shall we complete your activation and lock in your discount right now?';
        }
        if (cat === 'auto' || cat === 'health') {
          return '💬 Would you like our underwriter to reserve this quote for you today?';
        }
      }

      if (tone === 'support') {
        if (cat === 'claims' || q.indexOf('claim') !== -1) {
          return '💬 Would you like me to file this claim for you immediately, or do you have supporting documents to check?';
        }
        return '💬 Did this help resolve your concern, or would you prefer a quick call from a support specialist?';
      }

      if (cat === 'claims' || q.indexOf('claim') !== -1) {
        return '💬 Would you like me to start an incident report and fast-track a claim for you right now?';
      }
      if (cat === 'auto' || q.indexOf('auto') !== -1 || q.indexOf('car') !== -1) {
        return '💬 Would you like me to calculate an exact quote with these options included, or compare another tier?';
      }
      if (cat === 'health' || q.indexOf('health') !== -1 || q.indexOf('medical') !== -1) {
        return '💬 Would you like to compare our Silver, Gold, and Platinum health tiers, or check family add-on rates?';
      }
      if (cat === 'payments' || q.indexOf('pay') !== -1 || q.indexOf('discount') !== -1) {
        return '💬 Would you like to proceed with checkout and apply your active discount code now?';
      }
      if (q.indexOf('deductible') !== -1) {
        return '💬 Would you like to see how choosing a higher or lower deductible affects your monthly premium?';
      }
      return '💬 Does this answer what you had in mind, or would you like me to clarify anything specific about your setup?';
    }

    if (best && highest >= 0.28) {
      var followUp = generateFollowUpQuestion(best);
      return {
        intent: 'faq',
        reply: best.answer + '\n\n' + followUp,
        suggestedQuickReplies: [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '💳 Proceed to Payment', payload: 'intent_pay' },
          { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
        ]
      };
    }

    // Lead Capture Fallback for Unlisted / Custom Queries
    var needTopic = raw.replace(/^(do you have|do you offer|can you do|can you provide|tell me about|how about|what about|i want|i need|i'm looking for|we need)\s+/i, '').trim();
    if (!needTopic || needTopic.length < 3) needTopic = raw;

    return {
      intent: 'lead_capture_needed',
      confidence: 0.2,
      action: 'LEAD_CAPTURE',
      inquiredNeed: needTopic,
      reply: "That's a fantastic inquiry regarding **" + needTopic + "**! While that isn't directly covered in my standard knowledge base right now, I want to make sure you get an accurate, personalized answer from our specialist team.\n\nCould you please share your **full name**?"
    };
  }

  // 3.5. PERSISTENT LEAD CAPTURE & INQUIRY STORAGE
  var LEAD_STORAGE_KEY = 'botly_captured_leads';
  function getStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(LEAD_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch(e) {}
    return window.__botly_memory_leads || [];
  }
  function saveStoredLead(lead) {
    try {
      var current = getStoredLeads();
      var updated = [lead].concat(current);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(updated));
      }
      window.__botly_memory_leads = updated;
      return updated;
    } catch(e) {
      if (!window.__botly_memory_leads) window.__botly_memory_leads = [];
      window.__botly_memory_leads.unshift(lead);
      return window.__botly_memory_leads;
    }
  }
  function clearStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LEAD_STORAGE_KEY);
      }
      window.__botly_memory_leads = [];
      return true;
    } catch(e) { return false; }
  }
  function exportLeadsToCsv() {
    var leads = getStoredLeads();
    if (!leads || leads.length === 0) return 'ID,Name,Phone,Need,Goal,Status,Date\n';
    var headers = ['ID', 'Name', 'Phone', 'Need', 'Goal', 'Status', 'Date'];
    var rows = leads.map(function(l) {
      return [
        '"' + (l.id || '').replace(/"/g, '""') + '"',
        '"' + (l.name || '').replace(/"/g, '""') + '"',
        '"' + (l.phone || '').replace(/"/g, '""') + '"',
        '"' + (l.need || '').replace(/"/g, '""') + '"',
        '"' + (l.goal || 'lead_generation').replace(/"/g, '""') + '"',
        '"' + (l.status || '').replace(/"/g, '""') + '"',
        '"' + (l.createdAtFormatted || l.timestamp || '').replace(/"/g, '""') + '"'
      ].join(',');
    });
    return headers.join(',') + '\n' + rows.join('\n');
  }

  // 4. MAIN CHATBOT WIDGET CONTROLLER
  function InsuranceChatbotController(userConfig) {
    this.config = Object.assign({}, DEFAULT_CONFIG, userConfig || {});
    this.trainedKnowledge = [];
    if (this.config.customKnowledge && Array.isArray(this.config.customKnowledge)) {
      this.trainedKnowledge = this.config.customKnowledge.map(function(item) {
        return Object.assign({}, item, { isCustomTrained: true });
      });
    }
    this.activeQuote = null;
    this.quoteState = { active: false, step: 0, type: 'auto', tierId: null };
    this.claimState = { active: false, step: 0 };
    this.leadState = { active: false, step: 'idle', inquiredNeed: '', name: '', phone: '' };
    this.container = null;
    this.launcher = null;
  }

  InsuranceChatbotController.prototype.init = function(selector) {
    var self = this;
    this.applyTheme();

    if (selector) {
      var target = document.querySelector(selector);
      if (target) {
        this.renderInline(target);
        this.sendGreeting();
        return;
      }
    }

    this.renderFloating();
    this.sendGreeting();
  };

  InsuranceChatbotController.prototype.applyTheme = function() {
    var root = document.documentElement;
    var t = this.config.theme || {};
    if (t.primaryColor) {
      root.style.setProperty('--ins-primary', t.primaryColor);
      if (!t.primaryGradient) {
        root.style.setProperty('--ins-primary-gradient', 'linear-gradient(135deg, ' + t.primaryColor + ' 0%, #26352c 100%)');
      }
    }
    if (t.primaryGradient) root.style.setProperty('--ins-primary-gradient', t.primaryGradient);
    if (t.primaryHover) root.style.setProperty('--ins-primary-hover', t.primaryHover);
    if (t.accentColor) root.style.setProperty('--ins-accent', t.accentColor);
    if (t.headerBg) root.style.setProperty('--ins-header-bg', t.headerBg);
    if (t.userBubbleBg) root.style.setProperty('--ins-user-bubble', t.userBubbleBg);
  };

  InsuranceChatbotController.prototype.renderFloating = function() {
    var self = this;
    var bot = this.config.bot || {};
    var company = this.config.company || {};

    var launcher = document.createElement('button');
    launcher.className = 'ins-chatbot-launcher';
    launcher.id = 'ins-widget-launcher';
    launcher.setAttribute('aria-label', 'Open Botly Assistant');
    launcher.innerHTML = '<div class="ins-launcher-teaser">Need assistance? Chat with Botly</div>' +
      '<div class="ins-launcher-icon"><svg width="34" height="34" viewBox="0 0 54 60" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M28 2C41.2548 2 52 12.7452 52 26C52 36.8835 44.7573 46.0688 34.8213 48.9712L34.12 55.48C33.95 57.08 32.22 57.94 30.85 57.07L22.61 51.82C10.66 50.15 2 39.11 2 26C2 12.7452 12.7452 2 28 2Z" fill="#ffffff"/>' +
        '<path d="M28 11C28 11 39 14.5 39 24.5C39 34.5 28 41 28 41C28 41 17 34.5 17 24.5C17 14.5 28 11 28 11Z" fill="#9be553"/>' +
        '<circle cx="28" cy="24" r="4.5" fill="#18221c"/>' +
        '<path d="M28 15V19M28 29V33M19 24H23M33 24H37" stroke="#18221c" stroke-width="2.2" stroke-linecap="round"/>' +
      '</svg></div>' +
      '<div class="ins-launcher-badge">1</div>';

    var container = document.createElement('div');
    container.className = 'ins-chatbot-container';
    container.id = 'ins-widget-window';
    container.innerHTML = '<div class="ins-header">' +
      '<div class="ins-header-profile">' +
        '<div class="ins-avatar-wrapper">' + this.renderAvatarHtml() + '<span class="ins-status-dot"></span></div>' +
        '<div class="ins-profile-info"><span class="ins-bot-name">' + this.escape(bot.name || 'Botly') + '</span><span class="ins-bot-role">' + this.escape(bot.title || company.name || 'AI Assistant') + '</span></div>' +
      '</div>' +
      '<div class="ins-header-actions">' +
        '<button class="ins-btn-icon btn-reset" title="Restart Chat">🔄</button>' +
        '<button class="ins-btn-icon btn-close" title="Close">✕</button>' +
      '</div>' +
    '</div>' +
    '<div class="ins-messages-body" id="ins-messages-list"></div>' +
    '<div class="ins-footer">' +
      '<form class="ins-input-wrapper" id="ins-chat-form">' +
        '<button type="button" class="ins-btn-mic" id="ins-mic-btn">🎙️</button>' +
        '<input type="text" class="ins-input-text" id="ins-user-input" placeholder="Ask about coverage, quotes, claims..." autocomplete="off">' +
        '<button type="submit" class="ins-btn-send" id="ins-send-btn">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</form>' +
    '</div>';

    document.body.appendChild(launcher);
    document.body.appendChild(container);

    this.launcher = launcher;
    this.container = container;
    this.messagesList = container.querySelector('#ins-messages-list');
    this.inputField = container.querySelector('#ins-user-input');

    launcher.addEventListener('click', function() { self.toggle(); });
    container.querySelector('.btn-close').addEventListener('click', function() { self.toggle(false); });
    container.querySelector('.btn-reset').addEventListener('click', function() { self.reset(); });
    container.querySelector('#ins-chat-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var txt = (self.inputField.value || '').trim();
      if (txt) {
        self.inputField.value = '';
        self.handleUserMessage(txt);
      }
    });
  };

  InsuranceChatbotController.prototype.renderAvatarHtml = function() {
    var bot = this.config.bot || {};
    var t = this.config.theme || {};
    var primary = t.primaryColor || '#18221c';
    var accent = t.accentColor || '#9be553';

    if (bot.avatar && typeof bot.avatar === 'string' && (bot.avatar.indexOf('http') === 0 || bot.avatar.indexOf('/') === 0 || bot.avatar.indexOf('./') === 0 || bot.avatar.indexOf('data:') === 0)) {
      return '<img src="' + this.escape(bot.avatar) + '" alt="' + this.escape(bot.name || 'Botly') + '" class="ins-avatar-img">';
    }

    return '<svg class="ins-avatar-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
        '<linearGradient id="ins-av-bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" stop-color="' + primary + '"/>' +
          '<stop offset="100%" stop-color="#26352c"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="44" height="44" rx="13" fill="url(#ins-av-bg)"/>' +
      '<rect x="0.75" y="0.75" width="42.5" height="42.5" rx="12.25" stroke="rgba(155, 229, 83, 0.3)" stroke-width="1.5"/>' +
      '<g transform="translate(9, 8) scale(0.48)">' +
        '<path d="M28 2C41.2548 2 52 12.7452 52 26C52 36.8835 44.7573 46.0688 34.8213 48.9712L34.12 55.48C33.95 57.08 32.22 57.94 30.85 57.07L22.61 51.82C10.66 50.15 2 39.11 2 26C2 12.7452 12.7452 2 28 2Z" fill="#ffffff"/>' +
        '<path d="M28 11C28 11 39 14.5 39 24.5C39 34.5 28 41 28 41C28 41 17 34.5 17 24.5C17 14.5 28 11 28 11Z" fill="' + accent + '"/>' +
        '<circle cx="28" cy="24" r="4.5" fill="#18221c"/>' +
        '<path d="M28 15V19M28 29V33M19 24H23M33 24H37" stroke="#18221c" stroke-width="2.2" stroke-linecap="round"/>' +
      '</g>' +
    '</svg>';
  };

  InsuranceChatbotController.prototype.renderInline = function(target) {
    var self = this;
    var bot = this.config.bot || {};
    var company = this.config.company || {};

    target.innerHTML = '<div class="ins-chatbot-container open" style="position:relative; bottom:auto; right:auto; width:100%; height:620px;">' +
      '<div class="ins-header">' +
        '<div class="ins-header-profile">' +
          '<div class="ins-avatar-wrapper">' + this.renderAvatarHtml() + '<span class="ins-status-dot"></span></div>' +
          '<div class="ins-profile-info"><span class="ins-bot-name">' + this.escape(bot.name || 'Botly') + '</span><span class="ins-bot-role">' + this.escape(bot.title || company.name || 'AI Assistant') + '</span></div>' +
        '</div>' +
        '<div class="ins-header-actions"><button class="ins-btn-icon btn-reset" title="Restart Chat">🔄</button></div>' +
      '</div>' +
      '<div class="ins-messages-body" id="ins-messages-list"></div>' +
      '<div class="ins-footer">' +
        '<form class="ins-input-wrapper" id="ins-chat-form">' +
          '<button type="button" class="ins-btn-mic" id="ins-mic-btn">🎙️</button>' +
          '<input type="text" class="ins-input-text" id="ins-user-input" placeholder="Ask about coverage, quotes, claims..." autocomplete="off">' +
          '<button type="submit" class="ins-btn-send" id="ins-send-btn">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '</button>' +
        '</form>' +
      '</div>' +
    '</div>';

    this.container = target.querySelector('.ins-chatbot-container');
    this.messagesList = target.querySelector('#ins-messages-list');
    this.inputField = target.querySelector('#ins-user-input');

    this.container.querySelector('.btn-reset').addEventListener('click', function() { self.reset(); });
    this.container.querySelector('#ins-chat-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var txt = (self.inputField.value || '').trim();
      if (txt) {
        self.inputField.value = '';
        self.handleUserMessage(txt);
      }
    });
  };

  InsuranceChatbotController.prototype.toggle = function(force) {
    if (!this.container) return;
    var open = force !== undefined ? force : !this.container.classList.contains('open');
    if (open) {
      this.container.classList.add('open');
      if (this.launcher) {
        var b = this.launcher.querySelector('.ins-launcher-badge');
        if (b) b.style.display = 'none';
      }
      var self = this;
      setTimeout(function() { self.inputField && self.inputField.focus(); }, 300);
    } else {
      this.container.classList.remove('open');
    }
  };

  InsuranceChatbotController.prototype.sendGreeting = function() {
    var self = this;
    var bot = this.config.bot || {};
    setTimeout(function() {
      self.appendBot(bot.greeting, { quickReplies: bot.initialQuickReplies });
    }, 200);
  };

  InsuranceChatbotController.prototype.appendUser = function(text) {
    var row = document.createElement('div');
    row.className = 'ins-msg-row user';
    row.innerHTML = '<div class="ins-msg-bubble">' + this.escape(text) +
      '<span class="ins-msg-time">' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span></div>';
    this.messagesList.appendChild(row);
    this.scrollDown();
  };

  InsuranceChatbotController.prototype.appendBot = function(text, opts) {
    opts = opts || {};
    this.removeTyping();

    var row = document.createElement('div');
    row.className = 'ins-msg-row bot';
    var extra = opts.html || '';

    row.innerHTML = '<div class="ins-msg-bubble">' + this.formatMd(text) + extra +
      '<span class="ins-msg-time">' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span></div>';
    this.messagesList.appendChild(row);

    if (opts.quickReplies && opts.quickReplies.length > 0) {
      var qrBox = document.createElement('div');
      qrBox.className = 'ins-quick-replies';
      var self = this;
      opts.quickReplies.forEach(function(qr) {
        var btn = document.createElement('button');
        btn.className = 'ins-chip-btn';
        btn.textContent = qr.label;
        btn.addEventListener('click', function() {
          self.handleQuickReply(qr.payload || qr.label);
        });
        qrBox.appendChild(btn);
      });
      this.messagesList.appendChild(qrBox);
    }

    this.scrollDown();
  };

  InsuranceChatbotController.prototype.showTyping = function() {
    this.removeTyping();
    var t = document.createElement('div');
    t.className = 'ins-msg-row bot ins-typing-row';
    t.innerHTML = '<div class="ins-typing-bubble"><div class="ins-typing-dot"></div><div class="ins-typing-dot"></div><div class="ins-typing-dot"></div></div>';
    this.messagesList.appendChild(t);
    this.scrollDown();
  };

  InsuranceChatbotController.prototype.removeTyping = function() {
    var ex = this.messagesList ? this.messagesList.querySelector('.ins-typing-row') : null;
    if (ex) ex.remove();
  };

  InsuranceChatbotController.prototype.scrollDown = function() {
    if (this.messagesList) {
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  };

  InsuranceChatbotController.prototype.handleQuickReply = function(payload) {
    if (payload.indexOf('intent_quote_') === 0) {
      var prod = payload.replace('intent_quote_', '');
      this.startQuoteWizard(prod);
      return;
    }
    if (payload === 'intent_quote') {
      this.startQuoteWizard('auto');
      return;
    }
    if (payload === 'intent_claim') {
      this.startClaimWizard();
      return;
    }
    if (payload === 'intent_pay' || payload === 'checkout_now') {
      this.startInChatCheckout();
      return;
    }
    if (payload.indexOf('select_tier_') === 0) {
      this.handleUserMessage(payload);
      return;
    }
    this.handleUserMessage(payload);
  };

  InsuranceChatbotController.prototype.handleUserMessage = function(text) {
    var self = this;
    this.appendUser(text);
    this.showTyping();

    // 0. Lead Capture Flow Active?
    if (self.leadState && self.leadState.active) {
      setTimeout(function() { self.processLeadCaptureStep(text); }, self.config.bot?.typingDelayMs || 400);
      return;
    }

    // 1. Quote Flow Active?
    if (self.quoteState.active) {
      setTimeout(function() { self.processQuoteStep(text); }, self.config.bot?.typingDelayMs || 400);
      return;
    }

    // 2. Claims Flow Active?
    if (self.claimState.active) {
      setTimeout(function() { self.processClaimStep(text); }, self.config.bot?.typingDelayMs || 400);
      return;
    }

    // 3. Backend API configured & active?
    var api = self.config.api;
    if (api && api.enabled && (api.endpoint || api.mockServer)) {
      var mode = api.mode || 'hybrid';
      if (mode === 'api_only' || mode === 'hybrid') {
        var context = {
          message: text,
          sessionId: 'session_web_' + (self.sessionKey || (self.sessionKey = Math.random().toString(36).slice(2))),
          companyName: self.config.company?.name || 'Insurance Carrier'
        };

        queryBackendApi(api, text, context, function(apiRes) {
          if (apiRes.success && apiRes.reply) {
            self.appendBot(apiRes.reply, { quickReplies: apiRes.quickReplies });
            if (apiRes.action === 'OPEN_QUOTE_WIZARD') self.startQuoteWizard('auto');
            else if (apiRes.action === 'OPEN_CLAIMS_WIZARD') self.startClaimWizard();
            else if (apiRes.action === 'OPEN_PAYMENT_WIZARD') self.startInChatCheckout();
            return;
          }

          if (mode === 'api_only') {
            self.appendBot('⚠️ Could not connect to the underwriting backend API (' + (apiRes.error || 'Network error') + '). Please contact support at ' + (self.config.company?.supportPhone || '+1 (800) 555-0199') + '.');
            return;
          }

          // Hybrid fallback to local NLP + trained data
          self.resolveLocalQuery(text);
        });
        return;
      }
    }

    // Default Local NLP + Custom Trained Knowledge
    setTimeout(function() {
      self.resolveLocalQuery(text);
    }, self.config.bot?.typingDelayMs || 400);
  };

  InsuranceChatbotController.prototype.resolveLocalQuery = function(text) {
    var res = classifyQuery(text, this.config, this.config.customFaqs, this.trainedKnowledge);
    if (res.action === 'LEAD_CAPTURE') {
      this.startLeadCapture(res.inquiredNeed || text);
      return;
    }
    if (res.action === 'OPEN_QUOTE_WIZARD') {
      this.startQuoteWizard(res.productType || 'auto');
      return;
    }
    if (res.action === 'OPEN_CLAIMS_WIZARD') {
      this.startClaimWizard();
      return;
    }
    if (res.action === 'OPEN_PAYMENT_WIZARD') {
      this.startInChatCheckout();
      return;
    }
    this.appendBot(res.reply, { quickReplies: res.suggestedQuickReplies });
  };

  InsuranceChatbotController.prototype.startLeadCapture = function(inquiredNeed) {
    var cleanNeed = (inquiredNeed || '').trim();
    this.leadState = {
      active: true,
      step: 'awaiting_name',
      inquiredNeed: cleanNeed || 'Custom Service & Solution Inquiry',
      name: '',
      phone: ''
    };
    var needDisplay = cleanNeed ? ' regarding "**' + this.escape(cleanNeed) + '**"' : '';
    var startMsg = '';
    if (this.config.leadCapture && this.config.leadCapture.askNamePrompt) {
      startMsg = this.config.leadCapture.askNamePrompt
        .replace(/\{need\}/g, cleanNeed || 'your custom request')
        .replace(/\{needTopic\}/g, needDisplay);
    } else {
      startMsg = "That's a fantastic inquiry" + needDisplay + "! While I don't have all the exact specifications for that right here in my instant guide, I'd love to connect you with our specialist team so they can prepare a custom solution and exact quote for you.\n\nMay I please have your **full name**?";
    }
    this.appendBot(startMsg, {
      quickReplies: [
        { label: 'Cancel & Main Menu', payload: 'intent_cancel_lead' }
      ]
    });
  };

  InsuranceChatbotController.prototype.processLeadCaptureStep = function(text) {
    var input = (text || '').trim();
    if (/^(cancel|nevermind|stop|exit|main menu|back)\b/i.test(input) || input === 'intent_cancel_lead') {
      this.leadState.active = false;
      this.leadState.step = 'idle';
      this.appendBot("No problem at all! We can explore other options anytime.\n\nWhat would you like to check next?", {
        quickReplies: [
          { label: '🚗 Auto Quote', payload: 'intent_quote_auto' },
          { label: '🏥 Health Plans', payload: 'intent_quote_health' },
          { label: '💳 Make a Payment', payload: 'intent_pay' },
          { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
        ]
      });
      return;
    }

    if (this.leadState.step === 'awaiting_name') {
      var name = input.replace(/^(my name is|i am|i'm|call me|this is)\s+/i, '').trim();
      if (!name || name.length < 2) {
        this.appendBot("Could you please share your name so our specialist knows who they'll be assisting?");
        return;
      }
      this.leadState.name = name;
      this.leadState.step = 'awaiting_phone';

      var phonePrompt = '';
      if (this.config.leadCapture && this.config.leadCapture.askPhonePrompt) {
        phonePrompt = this.config.leadCapture.askPhonePrompt.replace(/\{name\}/g, this.escape(name));
      } else {
        phonePrompt = "Wonderful to meet you, **" + this.escape(name) + "**! 🤝\n\nWhat is the best **phone number** (or direct contact) for our specialist team to reach you?";
      }
      this.appendBot(phonePrompt);
      return;
    }

    if (this.leadState.step === 'awaiting_phone') {
      var digitsOnly = input.replace(/\D/g, '');
      if (digitsOnly.length < 6) {
        this.appendBot("Please provide a valid phone number (e.g. **+1 555-0199** or **0712 345 678**) so our advisor can reach you:");
        return;
      }
      this.leadState.phone = input;
      this.leadState.step = 'completed';
      this.leadState.active = false;

      var leadRecord = {
        id: 'LEAD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        name: this.leadState.name,
        phone: this.leadState.phone,
        need: this.leadState.inquiredNeed,
        goal: this.config.goal || 'lead_generation',
        timestamp: new Date().toISOString(),
        createdAtFormatted: new Date().toLocaleString(),
        status: 'New',
        company: this.config.company?.name || 'Botly AI'
      };

      saveStoredLead(leadRecord);

      if (this.config.webhooks?.onLeadCaptured && typeof this.config.webhooks.onLeadCaptured === 'function') {
        try { this.config.webhooks.onLeadCaptured(leadRecord); } catch(e) {}
      }
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        try { window.dispatchEvent(new CustomEvent('botly:leadCaptured', { detail: leadRecord })); } catch(e) {}
      }

      var confirmMsg = '';
      if (this.config.leadCapture && this.config.leadCapture.confirmationMessage) {
        confirmMsg = this.config.leadCapture.confirmationMessage
          .replace(/\{name\}/g, this.escape(this.leadState.name))
          .replace(/\{need\}/g, this.escape(this.leadState.inquiredNeed))
          .replace(/\{phone\}/g, this.escape(this.leadState.phone));
      } else {
        confirmMsg = "🎉 **Thank you, " + this.escape(this.leadState.name) + "!**\n\nYour request for **" + this.escape(this.leadState.inquiredNeed) + "** has been saved and routed directly to our specialist team. An advisor will reach out to you at **" + this.escape(this.leadState.phone) + "** shortly.";
      }

      var followUp = (this.config.leadCapture && this.config.leadCapture.followUpQuestion) ||
        "💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant quote rates or see an overview of our coverage?";

      this.appendBot(confirmMsg + "\n\n" + followUp, {
        quickReplies: [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '💳 In-Chat Payment Checkout', payload: 'intent_pay' },
          { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
        ]
      });
      return;
    }
  };

  InsuranceChatbotController.prototype.startQuoteWizard = function(productKey) {
    this.quoteState.active = true;
    this.quoteState.step = 1;
    this.quoteState.type = productKey in this.config.products ? productKey : 'auto';

    var prod = this.config.products[this.quoteState.type];
    var sym = this.config.currency?.symbol || '$';

    var html = '<div class="ins-tiers-container" style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">';
    var qrs = [];

    prod.tiers.forEach(function(tier) {
      var est = Math.round(prod.baseAnnualRate * tier.rateMultiplier);
      html += '<div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:10px; font-size:12.5px;">' +
        '<div style="font-weight:700; color:#0f172a;">' + tier.name + (tier.popular ? ' ⭐' : '') + '</div>' +
        '<div style="color:#64748b;">Deductible: ' + sym + (tier.deductible || 0) + ' | Limit: ' + sym + Number(tier.coverageLimit).toLocaleString() + '</div>' +
        '<div style="font-weight:700; color:#2563eb; margin-top:4px;">From ' + sym + est + '/yr</div>' +
      '</div>';
      qrs.push({ label: tier.name, payload: 'select_tier_' + tier.id });
    });
    html += '</div>';

    this.appendBot("Great! Let's calculate your instant **" + prod.name + "** quote in 30 seconds. ⏱️\n\nChoose your preferred protection tier:", {
      html: html,
      quickReplies: qrs
    });
  };

  InsuranceChatbotController.prototype.processQuoteStep = function(text) {
    var self = this;
    var lower = text.toLowerCase();
    var prod = this.config.products[this.quoteState.type];
    var sym = this.config.currency?.symbol || '$';

    if (this.quoteState.step === 1) {
      var matchedTier = prod.tiers.find(function(t) {
        return lower.indexOf(t.id) !== -1 || lower.indexOf(t.name.toLowerCase()) !== -1;
      }) || prod.tiers[1] || prod.tiers[0];

      this.quoteState.tierId = matchedTier.id;
      this.quoteState.step = 2;

      var baseCost = Math.round(prod.baseAnnualRate * matchedTier.rateMultiplier);
      var tax = Math.round(baseCost * 0.045);
      var annualTotal = baseCost + tax;
      var monthlyTotal = Math.round((annualTotal / 12) * 1.05);

      this.activeQuote = {
        quoteId: 'QT-' + Math.floor(100000 + Math.random() * 900000),
        productName: prod.name,
        tierName: matchedTier.name,
        coverageLimit: sym + Number(matchedTier.coverageLimit).toLocaleString(),
        deductible: sym + (matchedTier.deductible || 0),
        annualTotal: annualTotal,
        monthlyTotal: monthlyTotal,
        currencySymbol: sym,
        currency: this.config.currency?.code || 'USD'
      };

      this.quoteState.active = false;

      var quoteHtml = '<div class="ins-quote-card">' +
        '<div class="ins-quote-header"><span class="ins-quote-id">' + this.activeQuote.quoteId + '</span><span class="ins-quote-badge">Pre-Approved</span></div>' +
        '<h4>' + this.activeQuote.productName + ' (' + this.activeQuote.tierName + ')</h4>' +
        '<div class="ins-quote-price-box">' +
          '<div class="ins-quote-price-annual">' + sym + annualTotal.toLocaleString() + '<span style="font-size:14px; font-weight:normal;">/yr</span></div>' +
          '<div class="ins-quote-price-monthly">or ' + sym + monthlyTotal + '/mo in flexible payments</div>' +
        '</div>' +
        '<div class="ins-quote-details">' +
          '<div class="ins-detail-line"><span>Coverage Limit:</span> <strong>' + this.activeQuote.coverageLimit + '</strong></div>' +
          '<div class="ins-detail-line"><span>Deductible:</span> <strong>' + this.activeQuote.deductible + '</strong></div>' +
          '<div class="ins-detail-line"><span>Statutory Taxes/Levies:</span> <strong>' + sym + tax + '</strong></div>' +
        '</div>' +
        '<button class="ins-btn-primary" onclick="InsuranceChatbot.triggerAction(\'checkout_now\')">' +
          '💳 Buy Policy Now (' + sym + annualTotal.toLocaleString() + ')' +
        '</button>' +
      '</div>';

      this.appendBot("🎉 **Your Personalized Quote is Ready!**\n\nImmediate Day 1 protection with no paper forms required:", {
        html: quoteHtml,
        quickReplies: [
          { label: '💳 Proceed to Payment (' + sym + annualTotal + ')', payload: 'checkout_now' },
          { label: '📅 Pay Monthly (' + sym + monthlyTotal + '/mo)', payload: 'checkout_now' },
          { label: '🔄 Calculate Another Plan', payload: 'intent_quote' }
        ]
      });
    }
  };

  InsuranceChatbotController.prototype.startClaimWizard = function() {
    this.claimState.active = true;
    this.claimState.step = 1;
    this.appendBot("I'm sorry to hear that you experienced a loss or damage! Don't worry—we're here to help you get back on your feet fast. 🛡️\n\nWhat kind of incident are you reporting?", {
      quickReplies: [
        { label: '🚗 Vehicle Accident / Collision', payload: 'Auto Collision' },
        { label: '🏥 Medical / Emergency Bill', payload: 'Medical' },
        { label: '🏡 Home / Water / Fire Damage', payload: 'Home Damage' },
        { label: '✈️ Lost Baggage / Flight Delay', payload: 'Travel Incident' }
      ]
    });
  };

  InsuranceChatbotController.prototype.processClaimStep = function(text) {
    if (this.claimState.step === 1) {
      this.claimState.type = text;
      this.claimState.step = 2;
      this.appendBot("Please enter your **Policy Number** or the **Email Address** linked to your policy:");
      return;
    }
    if (this.claimState.step === 2) {
      this.claimState.policyRef = text;
      this.claimState.step = 3;
      this.appendBot("Briefly describe what happened and where (e.g. *'Windshield cracked on highway'*):");
      return;
    }
    if (this.claimState.step === 3) {
      this.claimState.active = false;
      var claimId = 'CLM-2026-' + Math.floor(10000 + Math.random() * 90000);

      var cardHtml = '<div style="background:#fff; border:1px solid #10b981; border-radius:12px; padding:14px; margin-top:8px;">' +
        '<div style="font-weight:700; color:#059669; font-size:13px;">✅ CLAIM FILED: ' + claimId + '</div>' +
        '<div style="font-size:12px; color:#475569; margin-top:6px;">' +
          '<div>• <strong>Type:</strong> ' + this.claimState.type + '</div>' +
          '<div>• <strong>Policy Ref:</strong> ' + this.claimState.policyRef + '</div>' +
          '<div>• <strong>Assigned Adjuster:</strong> Sarah Jenkins (Fast-Track)</div>' +
          '<div>• <strong>Target Settlement:</strong> Under 24 Hours</div>' +
        '</div>' +
      '</div>';

      this.appendBot("✅ **Claim Registered Successfully!**\n\nYour adjuster has been assigned. You'll receive status updates via SMS and email. For immediate emergency towing or hospitalization dispatch, call our toll-free 24/7 line at **" + (this.config.company?.supportPhone || '+1 (800) 555-0199') + "**.", {
        html: cardHtml,
        quickReplies: [
          { label: '💳 Pay Premium', payload: 'intent_pay' },
          { label: '🚗 Get a Quote', payload: 'intent_quote_auto' }
        ]
      });
    }
  };

  InsuranceChatbotController.prototype.startInChatCheckout = function() {
    var quote = this.activeQuote || {
      quoteId: 'QT-DIRECT',
      productName: 'Comprehensive Shield Policy',
      tierName: 'Comprehensive Shield',
      deductible: 'KSh 10,000',
      coverageLimit: 'KSh 3,000,000',
      annualTotal: 48000,
      currencySymbol: this.config.currency?.symbol || 'KSh ',
      currency: this.config.currency?.code || 'KES'
    };

    var sym = quote.currencySymbol;
    var cardId = 'chk-' + Math.random().toString(36).substring(2, 7);
    var self = this;

    // Promo code applied initially
    var discountRate = 0.15;
    var discountedTotal = Math.round(quote.annualTotal * (1 - discountRate));

    var checkoutHtml = '<div class="inchat-checkout-card" id="' + cardId + '">' +
      '<div class="checkout-header"><div class="checkout-title"><span class="lock-icon">🔒</span><strong>Secure In-Chat Policy Checkout</strong></div><span class="pci-badge">PCI-DSS Level 1</span></div>' +
      '<div class="checkout-summary-bar">' +
        '<div class="plan-info"><span class="plan-name">' + quote.productName + '</span><span class="plan-sub">' + quote.tierName + ' • Ded: ' + quote.deductible + '</span></div>' +
        '<div class="plan-price" id="' + cardId + '-price">' + sym + discountedTotal.toLocaleString() + '</div>' +
      '</div>' +
      '<div class="payment-tabs">' +
        '<button type="button" class="tab-btn active" data-tab="mpesa">📱 M-Pesa</button>' +
        '<button type="button" class="tab-btn" data-tab="card">💳 Card (Visa/Mastercard)</button>' +
      '</div>' +
      '<div class="tab-content" id="' + cardId + '-mpesa-box">' +
        '<div class="form-group"><label>M-Pesa Mobile Number</label><input type="tel" class="input-field f-phone" value="+254 712 345 678" /><small class="helper-text">You will receive an instant STK push prompt on your phone to enter your M-Pesa PIN.</small></div>' +
      '</div>' +
      '<div class="tab-content hidden" id="' + cardId + '-card-box">' +
        '<div class="form-group"><label>Cardholder Name</label><input type="text" class="input-field f-name" value="Sarah Jenkins" /></div>' +
        '<div class="form-group"><label>Card Number</label><div class="card-input-wrapper"><input type="text" class="input-field f-num" value="4000 1234 5678 9010" /><span class="card-icon">💳</span></div></div>' +
        '<div class="form-row">' +
          '<div class="form-group half"><label>Expiry</label><input type="text" class="input-field f-exp" value="08/28" /></div>' +
          '<div class="form-group half"><label>CVV</label><input type="password" class="input-field f-cvv" value="882" /></div>' +
        '</div>' +
      '</div>' +
      '<div class="promo-code-section">' +
        '<div class="promo-input-row"><input type="text" class="input-promo" value="SAVE15" /><button type="button" class="btn-apply-promo">Apply</button></div>' +
        '<div class="promo-message" style="color:#10b981;">✅ Promo "SAVE15" active! 15% discount applied.</div>' +
      '</div>' +
      '<button type="button" class="btn-submit-payment" id="' + cardId + '-pay-btn"><span>🔒 Pay ' + sym + discountedTotal.toLocaleString() + ' & Issue Policy</span></button>' +
      '<div class="payment-processing-overlay hidden" id="' + cardId + '-proc">' +
        '<div class="processing-spinner"></div>' +
        '<div class="processing-step" id="' + cardId + '-step">Connecting to M-Pesa Gateway...</div>' +
        '<div class="processing-sub">Authorizing transaction securely</div>' +
      '</div>' +
    '</div>';

    this.appendBot("💳 **Review your policy & complete checkout below to activate instant coverage:**", {
      html: checkoutHtml
    });

    // Attach checkout interaction
    setTimeout(function() {
      var cardEl = document.getElementById(cardId);
      if (!cardEl) return;

      var tabs = cardEl.querySelectorAll('.tab-btn');
      tabs.forEach(function(t) {
        t.addEventListener('click', function() {
          tabs.forEach(function(tb) { tb.classList.remove('active'); });
          t.classList.add('active');
          var method = t.getAttribute('data-tab');
          cardEl.querySelector('#' + cardId + '-card-box').classList.toggle('hidden', method !== 'card');
          cardEl.querySelector('#' + cardId + '-mpesa-box').classList.toggle('hidden', method !== 'mpesa');
        });
      });

      var payBtn = cardEl.querySelector('#' + cardId + '-pay-btn');
      var overlay = cardEl.querySelector('#' + cardId + '-proc');
      var step = cardEl.querySelector('#' + cardId + '-step');

      function executePayment() {
        overlay.classList.remove('hidden');
        setTimeout(function() { step.textContent = 'Sending STK Prompt to Mobile Phone...'; }, 800);
        setTimeout(function() { step.textContent = 'PIN Verified! Processing Underwriting...'; }, 1600);
        setTimeout(function() { step.textContent = '✅ Payment Verified! Generating Certificate...'; }, 2400);
        setTimeout(function() {
          overlay.classList.add('hidden');
          self.renderPolicyCertificate(quote, discountedTotal);
        }, 3200);
      }

      if (payBtn) payBtn.addEventListener('click', executePayment);
    }, 100);
  };

  InsuranceChatbotController.prototype.renderPolicyCertificate = function(quote, amountPaid) {
    var policyNo = 'POL-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    var sym = quote.currencySymbol || 'KSh ';
    var company = this.config.company || {};

    this.lastIssuedReceipt = {
      policyNumber: policyNo,
      company: company,
      policyholder: { name: 'Sarah Jenkins', phone: '+254 712 345 678' },
      plan: quote,
      payment: {
        amount: amountPaid,
        currencySymbol: sym,
        method: 'M-Pesa / STK Push',
        transactionId: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      },
      dates: {
        effective: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        expires: new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
    };

    var receiptHtml = '<div class="insurance-receipt-card">' +
      '<div class="receipt-header">' +
        '<div class="receipt-status-badge"><span class="status-dot"></span> ACTIVE POLICY ISSUED</div>' +
        '<div class="receipt-policy-no"><span class="label">Policy Number</span><strong>' + policyNo + '</strong></div>' +
      '</div>' +
      '<div class="receipt-body">' +
        '<div class="receipt-row"><span>Insured:</span> <strong>Sarah Jenkins</strong></div>' +
        '<div class="receipt-row"><span>Plan:</span> <strong>' + quote.productName + ' (' + quote.tierName + ')</strong></div>' +
        '<div class="receipt-row"><span>Coverage Limit:</span> <strong>' + quote.coverageLimit + '</strong></div>' +
        '<div class="receipt-row"><span>Deductible:</span> <strong>' + quote.deductible + '</strong></div>' +
        '<div class="receipt-row"><span>Coverage Period:</span> <strong>Instant (1 Year Active)</strong></div>' +
        '<div class="receipt-row total"><span>Total Paid:</span> <strong class="receipt-amount">' + sym + Number(amountPaid).toLocaleString() + '</strong></div>' +
      '</div>' +
      '<div class="receipt-actions">' +
        '<button type="button" class="btn-receipt-action" onclick="InsuranceChatbot.printCertificate()">🖨️ Print Certificate</button>' +
        '<button type="button" class="btn-receipt-action" onclick="InsuranceChatbot.printCertificate()">📥 Save PDF Card</button>' +
      '</div>' +
    '</div>';

    this.appendBot("🎉 **Payment Verified & Policy Activated!**\n\nCongratulations! Your policy is officially in effect immediately. Your Digital Certificate of Insurance is issued below:", {
      html: receiptHtml,
      quickReplies: [
        { label: '🚗 Get Another Quote', payload: 'intent_quote' },
        { label: '📑 How to file a claim?', payload: 'How do I file a claim?' },
        { label: '❓ Ask Coverage Questions', payload: 'intent_coverage_overview' }
      ]
    });
  };

  InsuranceChatbotController.prototype.printCertificate = function() {
    var receipt = this.lastIssuedReceipt || {
      policyNumber: 'POL-2026-882190',
      company: this.config.company || { name: 'Botly Insurance', tagline: 'Next-Gen Insurance AI Platform', licenseNumber: 'INS-LIC-2026-882190' },
      policyholder: { name: 'Sarah Jenkins', phone: '+254 712 345 678' },
      plan: { productName: 'Comprehensive Auto Shield', tierName: 'Comprehensive Shield', coverageLimit: 'KSh 3,000,000', deductible: 'KSh 10,000' },
      payment: { amount: 42636, currencySymbol: 'KSh ', method: 'M-Pesa STK Push', transactionId: 'TXN-882190K' },
      dates: { effective: 'Today', expires: '1 Year From Today' }
    };

    var printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Please allow popups to print your certificate.');
      return;
    }

    var doc = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificate of Insurance - ' + receipt.policyNumber + '</title>' +
      '<style>' +
        '@page { size: A4 portrait; margin: 12mm; }' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; }' +
        '.cert-box { border: 3px double #059669; border-radius: 12px; padding: 32px; position: relative; max-width: 720px; margin: 0 auto; }' +
        '.cert-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }' +
        '.badge { background: #ecfdf5; border: 1.5px solid #10b981; color: #059669; font-weight: 800; padding: 6px 14px; border-radius: 20px; font-size: 12px; }' +
        '.title { text-align: center; margin: 20px 0; }' +
        '.title h2 { font-size: 22px; font-weight: 800; color: #059669; margin: 0; text-transform: uppercase; }' +
        '.pill { display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 8px; font-weight: 800; margin-top: 6px; }' +
        '.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }' +
        '.item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }' +
        '.item label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; }' +
        '.item value { font-size: 14px; font-weight: 700; color: #0f172a; display: block; margin-top: 2px; }' +
        '.table { width: 100%; border-collapse: collapse; margin: 20px 0; }' +
        '.table th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }' +
        '.table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }' +
        '.footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }' +
        '.seal { width: 85px; height: 85px; border: 2.5px solid #059669; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-size: 9px; font-weight: 800; color: #059669; }' +
        '.watermark { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 48px; font-weight: 900; color: rgba(5, 150, 105, 0.05); text-transform: uppercase; pointer-events: none; white-space: nowrap; }' +
      '</style></head><body>' +
      '<div class="cert-box">' +
        '<div class="watermark">OFFICIAL CERTIFIED POLICY</div>' +
        '<div class="cert-header">' +
          '<div><h1 style="font-size:22px; margin:0;">' + (receipt.company.name || 'Botly Insurance') + '</h1><div style="font-size:11px; color:#64748b;">Statutory Insurance Registrar • Lic #' + (receipt.company.licenseNumber || 'INS-2026') + '</div></div>' +
          '<div class="badge">● ACTIVE POLICY ISSUED</div>' +
        '</div>' +
        '<div class="title">' +
          '<h2>Certificate of Insurance</h2>' +
          '<p style="font-size:12px; color:#64748b;">Official proof of coverage under statutory regulatory standards.</p>' +
          '<div class="pill">Policy Reference: ' + receipt.policyNumber + '</div>' +
        '</div>' +
        '<div class="grid">' +
          '<div class="item"><label>Insured Party</label><value>' + receipt.policyholder.name + '</value></div>' +
          '<div class="item"><label>Contact</label><value>' + (receipt.policyholder.phone || '+254 712 345 678') + '</value></div>' +
          '<div class="item"><label>Policy Plan</label><value>' + receipt.plan.productName + ' (' + receipt.plan.tierName + ')</value></div>' +
          '<div class="item"><label>Coverage Limit</label><value>' + receipt.plan.coverageLimit + '</value></div>' +
          '<div class="item"><label>Deductible / Excess</label><value>' + receipt.plan.deductible + '</value></div>' +
          '<div class="item"><label>Effective Term</label><value>' + receipt.dates.effective + ' – ' + receipt.dates.expires + '</value></div>' +
        '</div>' +
        '<table class="table">' +
          '<tr><th>Coverage Details</th><th>Status</th><th style="text-align:right;">Amount Paid</th></tr>' +
          '<tr><td>' + receipt.plan.productName + '<br><small style="color:#64748b;">Statutory Premium & Mandatory Levies</small></td><td>Issued & Active</td><td style="text-align:right;">' + receipt.payment.currencySymbol + Number(receipt.payment.amount).toLocaleString() + '</td></tr>' +
          '<tr style="font-weight:800; color:#059669;"><td colspan="2">TOTAL PAID (' + receipt.payment.method + ' - ' + receipt.payment.transactionId + ')</td><td style="text-align:right;">' + receipt.payment.currencySymbol + Number(receipt.payment.amount).toLocaleString() + '</td></tr>' +
        '</table>' +
        '<div class="footer">' +
          '<div class="seal"><span>★ OFFICIAL ★</span><span>DIGITAL</span><span>SEAL</span></div>' +
          '<div style="text-align:right;"><div style="width:160px; border-bottom:1.5px solid #0f172a; margin-bottom:4px; margin-left:auto;"></div><strong>Authorized Registrar</strong><div style="font-size:11px; color:#64748b;">Digital Verification Validated</div></div>' +
        '</div>' +
      '</div>' +
      '<script>window.onload = function() { window.print(); };<\/script>' +
      '</body></html>';

    printWin.document.open();
    printWin.document.write(doc);
    printWin.document.close();
  };

  InsuranceChatbotController.prototype.reset = function() {
    this.quoteState = { active: false, step: 0, type: 'auto', tierId: null };
    this.claimState = { active: false, step: 0 };
    this.leadState = { active: false, step: 'idle', inquiredNeed: '', name: '', phone: '' };
    if (this.messagesList) this.messagesList.innerHTML = '';
    this.sendGreeting();
  };

  InsuranceChatbotController.prototype.escape = function(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  InsuranceChatbotController.prototype.formatMd = function(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/•\s/g, '•&nbsp;');
  };

  InsuranceChatbotController.prototype.trainData = function(content, format) {
    var items = parseTrainingData(content, format);
    var self = this;
    var count = 0;
    items.forEach(function(item) {
      item.isCustomTrained = true;
      var existing = self.trainedKnowledge.findIndex(function(ex) {
        return ex.question.toLowerCase().trim() === item.question.toLowerCase().trim();
      });
      if (existing >= 0) {
        self.trainedKnowledge[existing] = item;
      } else {
        self.trainedKnowledge.unshift(item);
        count++;
      }
    });
    return { success: true, countAdded: items.length, totalCount: this.trainedKnowledge.length, items: items };
  };

  InsuranceChatbotController.prototype.getTrainedData = function() {
    return this.trainedKnowledge || [];
  };

  InsuranceChatbotController.prototype.clearTrainedData = function() {
    this.trainedKnowledge = [];
  };

  InsuranceChatbotController.prototype.testApiConnection = function(callback) {
    var api = this.config.api || {};
    var context = { companyName: this.config.company?.name || 'Insurance Company' };
    if (api.mockServer || api.endpoint === 'mock://insurance-ai') {
      var res = {
        ok: true,
        latencyMs: 75,
        status: 200,
        sampleReply: 'Mock Backend API connection active! 🟢 System operational.',
        raw: { status: 'healthy', version: '2.4.0' }
      };
      if (typeof callback === 'function') callback(res);
      return Promise.resolve(res);
    }
    return new Promise(function(resolve) {
      queryBackendApi(api, 'ping test', context, function(r) {
        var out = {
          ok: r.success,
          latencyMs: r.latencyMs,
          status: r.success ? 200 : 500,
          sampleReply: r.reply,
          error: r.error,
          helpTip: (r.error && r.error.indexOf('Failed to fetch') !== -1)
            ? 'Ensure your API server allows CORS with "Access-Control-Allow-Origin: *".'
            : 'Check that your endpoint URL, method, and auth token are valid.'
        };
        if (typeof callback === 'function') callback(out);
        resolve(out);
      });
    });
  };

  InsuranceChatbotController.prototype.setApiConfig = function(apiCfg) {
    this.config.api = Object.assign({}, this.config.api || {}, apiCfg);
  };

  InsuranceChatbotController.prototype.setCompanyGoal = function(goalKey) {
    if (!COMPANY_GOALS[goalKey]) return false;
    var preset = COMPANY_GOALS[goalKey];
    this.config.goal = goalKey;
    if (!this.config.leadCapture) this.config.leadCapture = {};
    if (preset.askNamePrompt) this.config.leadCapture.askNamePrompt = preset.askNamePrompt;
    if (preset.askPhonePrompt) this.config.leadCapture.askPhonePrompt = preset.askPhonePrompt;
    if (preset.confirmationMessage) this.config.leadCapture.confirmationMessage = preset.confirmationMessage;
    if (preset.followUpQuestion) this.config.leadCapture.followUpQuestion = preset.followUpQuestion;
    if (!this.config.followUpDynamics) this.config.followUpDynamics = {};
    if (preset.followUpTone) this.config.followUpDynamics.tone = preset.followUpTone;
    return true;
  };

  InsuranceChatbotController.prototype.simulateUnlistedInquiry = function(queryText) {
    var text = queryText || 'Can you provide commercial drone delivery fleet protection?';
    this.toggle(true);
    this.handleUserInput(text);
  };

  // Public Singleton Instance
  var instance = null;

  return {
    init: function(config, selector) {
      instance = new InsuranceChatbotController(config);
      instance.init(selector);
      return instance;
    },
    open: function() { instance && instance.toggle(true); },
    close: function() { instance && instance.toggle(false); },
    toggle: function() { instance && instance.toggle(); },
    triggerAction: function(p) { instance && instance.handleQuickReply(p); },
    reset: function() { instance && instance.reset(); },
    setCompanyGoal: function(goalKey) { return instance && instance.setCompanyGoal(goalKey); },
    simulateUnlistedInquiry: function(q) { instance && instance.simulateUnlistedInquiry(q); },
    getCompanyGoals: function() { return COMPANY_GOALS; },
    printCertificate: function(r) { instance && instance.printCertificate(r); },
    trainData: function(content, format) { return instance && instance.trainData(content, format); },
    getTrainedData: function() { return (instance && instance.getTrainedData()) || []; },
    clearTrainedData: function() { instance && instance.clearTrainedData(); },
    testApiConnection: function(cb) { return instance && instance.testApiConnection(cb); },
    setApiConfig: function(cfg) { instance && instance.setApiConfig(cfg); },
    getCapturedLeads: function() { return getStoredLeads(); },
    saveLead: function(lead) { return saveStoredLead(lead); },
    clearCapturedLeads: function() { return clearStoredLeads(); },
    exportLeadsCSV: function() { return exportLeadsToCsv(); },
    startCheckout: function() { instance && instance.startInChatCheckout(); },
    getInstance: function() { return instance; }
  };
}));
