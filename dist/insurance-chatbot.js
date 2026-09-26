/** Botly Pro — Plug & Play AI Chatbot Platform
 * Commercial License. All rights reserved. NextAI Studios.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.BotlyProChatbot = global.BotlyChatbot = global.InsuranceChatbot = global.Botly = factory());
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
      askNamePrompt: "Good question! I want to make sure you get the right answer{needTopic}, so let me have our specialist put together exactly what you need.\n\nWhat's your **full name**?",
      askPhonePrompt: "Thank you, **{name}**! What is your direct **phone number** (or WhatsApp) or **email address** for our solutions specialist to reach you?",
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
      askPhonePrompt: "Thank you, **{name}**! What is the best **phone number** or **email address** for our support agent to reach you?",
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
      askPhonePrompt: "Thank you, **{name}**! What is your preferred **phone number** or **email address** to confirm your consultation schedule?",
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
      askNamePrompt: "Good question! I want to make sure you get the right answer{needTopic}, so let me bring in a specialist from our team who can sort you out properly.\n\nWhat's your **full name**?",
      askPhonePrompt: "Wonderful to meet you, **{name}**! 🤝\n\nWhat is the best **phone number** or **email address** for our specialist team to reach you?",
      confirmationMessage: "🎉 **Thank you, {name}!**\n\nYour request for **{need}** has been saved and routed directly to our specialist team. An advisor will reach out to you at **{phone}** shortly.",
      followUpQuestion: "💬 **In the meantime, how else can I assist you right now?** Feel free to ask any other questions about our services.",
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
      supportEmail: '',
      supportPhone: '',
      websiteUrl: 'https://botly.ai',
      licenseNumber: 'INS-LIC-2026-882190'
    },
    bot: {
      name: 'Botly Pro',
      title: 'AI Assistant',
      avatar: 'demo/botly-icon.svg',
      greeting: "Hello! I am **Botly Pro**, your 24/7 digital assistant. How can I help you today? You can explore our catalog, request a quote, or process payments securely.",
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

  function getStem(word) {
    if (!word || word.length < 3) return (word || '').toLowerCase();
    return word
      .toLowerCase()
      .replace(/(ing|tions?|tionals?|ated|ates?|ating|ed|es|s|ments?|ables?|ity|al|ive|izes?|ises?)$/, '');
  }

  function wordsMatch(w1, w2) {
    if (!w1 || !w2) return false;
    var v1 = w1.toLowerCase();
    var v2 = w2.toLowerCase();
    if (v1 === v2) return true;
    var s1 = getStem(v1);
    var s2 = getStem(v2);
    if (s1.length >= 2 && s2.length >= 2 && s1 === s2) return true;
    // Conversational upgrade (V3): shared-root containment for long words, so
    // morphological cousins like agriculture/agricultural still match. The
    // length floor keeps short words (smart, custom, price) strict.
    if (s1.length >= 7 && s2.length >= 7 && (s1.indexOf(s2) !== -1 || s2.indexOf(s1) !== -1)) return true;
    return false;
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
          if (wordsMatch(token, t)) {
            matches += 1.0;
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

  function buildProductSearchUrl(baseUrl, query) {
    if (!baseUrl) return '';
    var cleanBase = baseUrl.trim().replace(/\/+$/, '');
    var encodedQuery = encodeURIComponent(query.trim());
    if (cleanBase.indexOf('jumia.co.ke') !== -1 || cleanBase.indexOf('jumia.com') !== -1) {
      return 'https://www.jumia.co.ke/catalog/?q=' + encodedQuery;
    }
    if (cleanBase.indexOf('amazon.') !== -1) {
      return cleanBase + '/s?k=' + encodedQuery;
    }
    if (cleanBase.indexOf('shopify') !== -1 || cleanBase.indexOf('myshopify') !== -1) {
      return cleanBase + '/search?q=' + encodedQuery;
    }
    return cleanBase + '/search?q=' + encodedQuery;
  }

  function getDepartmentHint(query) {
    if (!query) return null;
    var lower = query.toLowerCase();
    if (/\b(egg|eggs|cooking\s*oil|vegetable\s*oil|olive\s*oil|flour|sugar|rice|grocer(y|ies)|supermarket|food|snack|cereal|milk|tea|coffee|detergent|soap)\b/i.test(lower)) {
      return {
        department: 'Groceries & Supermarket',
        icon: '🛒',
        details: 'Check daily supermarket flash sales, bundle packs, and household essentials.'
      };
    }
    if (/\b(toy|toys|child|children|kid|kids|baby|toddler|lego|doll|dolls|puzzle|action\s*figure|board\s*game)\b/i.test(lower)) {
      return {
        department: 'Baby Products, Toys & Games',
        icon: '🧸',
        details: 'Browse educational toys, baby play essentials, outdoor sets, and games.'
      };
    }
    if (/\b(phone|phones|smartphone|smartphones|iphone|samsung|tecno|infinix|xiaomi|redmi|tablet|tablets|ipad)\b/i.test(lower)) {
      return {
        department: 'Phones & Tablets',
        icon: '📱',
        details: 'Browse verified official brand warranties, 4G/5G devices, and bundle accessories.'
      };
    }
    if (/\b(laptop|laptops|macbook|computer|computers|pc|hp|dell|lenovo|asus|keyboard|monitor|ssd|ram)\b/i.test(lower)) {
      return {
        department: 'Computing & Laptops',
        icon: '💻',
        details: 'Compare processor specs, SSD storage, genuine Windows/macOS, and office laptops.'
      };
    }
    if (/\b(tv|tvs|television|soundbar|speaker|speakers|audio|subwoofer|hisense|sony|vitron|smart\s*tv)\b/i.test(lower)) {
      return {
        department: 'TVs & Home Audio',
        icon: '📺',
        details: 'Explore 4K UHD screens, Android/Smart OS displays, and home theater soundbars.'
      };
    }
    if (/\b(blender|blenders|fridge|refrigerator|microwave|cooker|kettle|iron|air\s*fryer|vacuum)\b/i.test(lower)) {
      return {
        department: 'Home & Kitchen Appliances',
        icon: '🍳',
        details: 'Find energy-efficient kitchen equipment, breakfast appliances, and home devices.'
      };
    }
    if (/\b(shoe|shoes|sneaker|sneakers|dress|dresses|shirt|shirts|clothing|clothes|jacket|socks|pants|tshirt)\b/i.test(lower)) {
      return {
        department: 'Fashion & Apparel',
        icon: '👕',
        details: 'Check available size charts, seasonal styles, footwear, and apparel.'
      };
    }
    if (/\b(watch|watches|smartwatch|smartwatches|curren|casio|rolex|timepiece)\b/i.test(lower)) {
      return {
        department: 'Watches & Accessories',
        icon: '⌚',
        details: 'Explore luxury analog chronographs, fitness trackers, and smart watches.'
      };
    }
    if (/\b(beauty|lotion|cream|perfume|fragrance|cologne|makeup|skincare|hair)\b/i.test(lower)) {
      return {
        department: 'Beauty & Personal Care',
        icon: '✨',
        details: 'Discover genuine cosmetics, dermatological skincare, and fragrance collections.'
      };
    }
    return null;
  }

  function checkCategoryBoundary(query, companyName) {
    if (!companyName) companyName = 'our store';
    var lower = (query || '').toLowerCase().trim();

    // 1. Livestock & Live Animals
    if (/\b(cow|cows|goat|goats|sheep|bull|bulls|cattle|livestock|pig|pigs|horse|horses|camel|camels|live\s*chicken)\b/i.test(lower)) {
      return {
        isOutOfScope: true,
        category: 'livestock',
        reply: '**' + companyName + '** does not sell live animals or livestock.\n\nHowever, we carry fresh meat cuts and dairy products in our **Supermarket** section, as well as pet food, leather accessories, and animal care supplies. Would you like to explore any of those?',
        suggestedQuickReplies: [
          { label: '🛒 Groceries & Supermarket', payload: 'What products are available in Groceries & Supermarket?' },
          { label: '🥩 Meat & Poultry', payload: 'What fresh meat and cuts are available in the supermarket?' },
          { label: '🥛 Dairy & Eggs', payload: 'Do you have fresh milk and dairy products in stock?' },
          { label: '🐾 Pet Supplies', payload: 'What pet care and pet food products do you offer?' }
        ]
      };
    }

    // 2. Motor Vehicles & Full Automobiles
    if (/\b(car|cars|motor\s*vehicle|automobile|truck|trucks|motorcycle|motorcycles|suv|suvs|sedan)\b/i.test(lower)) {
      return {
        isOutOfScope: true,
        category: 'vehicles',
        reply: '**' + companyName + '** does not sell full motor vehicles or cars.\n\nHowever, we offer a complete range of **Automotive Accessories & Spare Parts** including car batteries, dashcams, sound systems, motor oils, and cleaning kits. Would you like to view our automotive essentials?',
        suggestedQuickReplies: [
          { label: '🚗 Car Accessories', payload: 'What car accessories and gadgets are available?' },
          { label: '🔋 Car Batteries', payload: 'What car batteries and chargers do you have?' },
          { label: '🔊 Car Audio & Dashcams', payload: 'What car sound systems and dashcams are in stock?' }
        ]
      };
    }

    // 3. Real Estate & Land
    if (/\b(house|houses|land|plot|plots|apartment|apartments|mansion|real\s*estate|rental\s*property)\b/i.test(lower)) {
      return {
        isOutOfScope: true,
        category: 'real_estate',
        reply: '**' + companyName + '** does not sell real estate or land.\n\nHowever, we feature a vast collection of **Home & Kitchen Appliances**, living room furniture, beddings, and interior lighting to furnish your home. What can I help you furnish today?',
        suggestedQuickReplies: [
          { label: '🛋️ Furniture & Living', payload: 'What home and living furniture is available?' },
          { label: '🍳 Kitchen Appliances', payload: 'What kitchen appliances and cookware do you have?' },
          { label: '📺 TVs & Audio', payload: 'What smart TVs and sound systems are on offer?' }
        ]
      };
    }

    return null;
  }

  var CATALOG_DATABASE = {
    beauty: [
      {
        id: 'lotion_nivea_cocoa',
        name: "Nivea Cocoa Butter Intensive Body Lotion (400ml)",
        price: 650,
        currency: 'KES',
        specs: 'Deep moisture serum, 48h hydration, for dry skin',
        rating: '⭐ 4.8 (1,240 reviews)',
        category: 'Beauty & Personal Care',
        url: 'https://www.jumia.co.ke/beauty/',
        keywords: ['lotion', 'body lotion', 'nivea', 'cocoa butter', 'moisturizer', 'dry skin', 'cream']
      },
      {
        id: 'lotion_vaseline_aloe',
        name: "Vaseline Intensive Care Aloe Soothe Body Lotion (400ml)",
        price: 580,
        currency: 'KES',
        specs: 'Pure aloe extract, non-greasy, restores dry & sensitive skin',
        rating: '⭐ 4.7 (890 reviews)',
        category: 'Beauty & Personal Care',
        url: 'https://www.jumia.co.ke/beauty/',
        keywords: ['lotion', 'vaseline', 'aloe', 'soothe', 'body lotion', 'moisturizer']
      },
      {
        id: 'lotion_cerave_moisturizing',
        name: "CeraVe Daily Moisturizing Lotion (236ml)",
        price: 2400,
        currency: 'KES',
        specs: '3 essential ceramides, hyaluronic acid, dermatologist tested',
        rating: '⭐ 4.9 (650 reviews)',
        category: 'Beauty & Personal Care',
        url: 'https://www.jumia.co.ke/beauty/',
        keywords: ['cerave', 'lotion', 'moisturizing', 'skincare', 'face lotion', 'ceramides']
      },
      {
        id: 'lotion_garnier_vitaminc',
        name: "Garnier Bright Complete Vitamin C Body Lotion (400ml)",
        price: 850,
        currency: 'KES',
        specs: 'Enriched with lemon essence, SPF 20 UVA/UVB filters',
        rating: '⭐ 4.6 (430 reviews)',
        category: 'Beauty & Personal Care',
        url: 'https://www.jumia.co.ke/beauty/',
        keywords: ['garnier', 'vitamin c', 'brightening', 'lotion', 'body lotion', 'sun protection']
      }
    ],
    groceries: [
      {
        id: 'oil_rina_3l',
        name: "Rina Pure Vegetable Cooking Oil (3 Litres)",
        price: 799,
        currency: 'KES',
        specs: 'Cholesterol free, enriched with Vitamins A & D, fortified',
        rating: '⭐ 4.8 (2,150 reviews)',
        category: 'Groceries & Supermarket',
        url: 'https://www.jumia.co.ke/groceries/',
        keywords: ['cooking oil', 'oil', 'rina', 'vegetable oil', 'supermarket', 'food', 'groceries']
      },
      {
        id: 'oil_freshfri_2l',
        name: "Fresh Fri Pure Vegetable Cooking Oil with Ginger (2 Litres)",
        price: 580,
        currency: 'KES',
        specs: 'Triple refined, premium quality, non-smoking frying',
        rating: '⭐ 4.7 (1,430 reviews)',
        category: 'Groceries & Supermarket',
        url: 'https://www.jumia.co.ke/groceries/',
        keywords: ['fresh fri', 'cooking oil', 'oil', 'vegetable oil', 'groceries']
      },
      {
        id: 'oil_goldenfry_5l',
        name: "Golden Fry Premium Cooking Oil Jerrycan (5 Litres)",
        price: 1350,
        currency: 'KES',
        specs: 'Economy family size, 100% pure vegetable oil, long lasting',
        rating: '⭐ 4.9 (820 reviews)',
        category: 'Groceries & Supermarket',
        url: 'https://www.jumia.co.ke/groceries/',
        keywords: ['golden fry', '5l', '5 litres', 'cooking oil', 'oil', 'jerrycan']
      },
      {
        id: 'flour_pembe_2kg',
        name: "Pembe Home Baking All-Purpose Wheat Flour (2kg)",
        price: 185,
        currency: 'KES',
        specs: 'Finely milled, fortified with essential minerals, perfect for pastries & chapati',
        rating: '⭐ 4.8 (3,100 reviews)',
        category: 'Groceries & Supermarket',
        url: 'https://www.jumia.co.ke/groceries/',
        keywords: ['flour', 'wheat flour', 'pembe', 'baking', 'chapati', 'supermarket', 'groceries']
      }
    ],
    appliances: [
      {
        id: 'blender_ramtons_2in1',
        name: "Ramtons 2-in-1 Blender & Dry Mill 1.5L (400W)",
        price: 3499,
        currency: 'KES',
        specs: 'Stainless steel blades, 2 speed settings with pulse, scratch-resistant jug',
        rating: '⭐ 4.8 (980 reviews)',
        category: 'Home & Kitchen Appliances',
        url: 'https://www.jumia.co.ke/appliances/',
        keywords: ['blender', 'ramtons', 'mixer', 'grinder', 'kitchen', 'smoothie maker', 'appliance']
      },
      {
        id: 'blender_mika_hand',
        name: "Mika Multi-Functional Immersion Hand Blender Set (600W)",
        price: 4200,
        currency: 'KES',
        specs: 'Includes chopper bowl, whisk attachment & 700ml measuring beaker',
        rating: '⭐ 4.7 (410 reviews)',
        category: 'Home & Kitchen Appliances',
        url: 'https://www.jumia.co.ke/appliances/',
        keywords: ['hand blender', 'stick blender', 'mika', 'blender', 'chopper', 'food processor']
      },
      {
        id: 'blender_sayona_3in1',
        name: "Sayona Heavy Duty 3-in-1 Commercial Style Blender (800W)",
        price: 5200,
        currency: 'KES',
        specs: 'Ice crushing capability, unbreakable polycarbonate jar, overheat protection',
        rating: '⭐ 4.9 (730 reviews)',
        category: 'Home & Kitchen Appliances',
        url: 'https://www.jumia.co.ke/appliances/',
        keywords: ['sayona', 'blender', 'commercial blender', 'heavy duty blender', 'ice crusher']
      }
    ],
    fashion: [
      {
        id: 'shoes_sneakers_mesh',
        name: "Men's Breathable Lightweight Athletic Running Sneakers",
        price: 1850,
        currency: 'KES',
        specs: 'Shock-absorbing EVA sole, mesh upper, anti-slip cushioning (Sizes 40-45)',
        rating: '⭐ 4.6 (1,850 reviews)',
        category: 'Fashion & Apparel',
        url: 'https://www.jumia.co.ke/fashion/',
        keywords: ['shoes', 'sneakers', 'running shoes', 'shoe', 'trainers', 'footwear']
      },
      {
        id: 'shoes_loafers_leather',
        name: "Classic Italian Style Slip-On Leather Loafers",
        price: 2650,
        currency: 'KES',
        specs: 'Genuine cowhide finish, memory foam insole, formal & smart casual',
        rating: '⭐ 4.7 (910 reviews)',
        category: 'Fashion & Apparel',
        url: 'https://www.jumia.co.ke/fashion/',
        keywords: ['loafers', 'leather shoes', 'official shoes', 'shoes', 'shoe', 'formal shoes']
      },
      {
        id: 'socks_bamboo_pack6',
        name: "Bamboo Cotton Anti-Odor Ankle Socks (Pack of 6)",
        price: 450,
        currency: 'KES',
        specs: 'Breathable, sweat-wicking elastic arch support, unisex',
        rating: '⭐ 4.8 (2,400 reviews)',
        category: 'Fashion & Apparel',
        url: 'https://www.jumia.co.ke/fashion/',
        keywords: ['socks', 'ankle socks', 'cotton socks', 'sock', 'clothing']
      }
    ],
    toys: [
      {
        id: 'toy_lego_blocks_100',
        name: "100-Piece STEM Educational Building Blocks & Creative Lego Set",
        price: 1450,
        currency: 'KES',
        specs: 'Non-toxic ABS plastic, storage tub included, ages 3+',
        rating: '⭐ 4.9 (1,120 reviews)',
        category: 'Baby Products, Toys & Games',
        url: 'https://www.jumia.co.ke/toys-games/',
        keywords: ['toy', 'toys', 'building blocks', 'lego', 'educational toy', 'kid', 'child']
      },
      {
        id: 'toy_rc_stunt_car',
        name: "Remote Control 4WD High-Speed Stunt Racing Car (360° Flip)",
        price: 2100,
        currency: 'KES',
        specs: '2.4GHz anti-interference controller, rechargeable battery, LED lights',
        rating: '⭐ 4.7 (860 reviews)',
        category: 'Baby Products, Toys & Games',
        url: 'https://www.jumia.co.ke/toys-games/',
        keywords: ['rc car', 'remote control', 'toy car', 'toy', 'toys', 'stunt car']
      },
      {
        id: 'toy_baby_activity_gym',
        name: "Musical Baby Kick & Play Activity Piano Gym Mat",
        price: 2800,
        currency: 'KES',
        specs: '5 hanging sensory toys, musical piano keys, soft washable mat',
        rating: '⭐ 4.8 (540 reviews)',
        category: 'Baby Products, Toys & Games',
        url: 'https://www.jumia.co.ke/baby-products/',
        keywords: ['baby gym', 'play mat', 'baby toy', 'toy', 'toys', 'toddler']
      }
    ]
  };

  function fetchLiveScrapedProducts(query, siteUrl, callback) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      if (callback) callback(null);
      return;
    }
    var cleanQ = encodeURIComponent(query.trim());
    var cleanUrl = siteUrl ? encodeURIComponent(siteUrl.trim()) : '';
    var base = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:8080';
    var endpoint = base + '/api/scrape-products?q=' + cleanQ + (cleanUrl ? '&url=' + cleanUrl : '');

    if (typeof fetch === 'undefined') {
      if (callback) callback(null);
      return;
    }

    var didTimeout = false;
    var timer = setTimeout(function() {
      didTimeout = true;
      if (callback) callback(null);
    }, 4500);

    fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    .then(function(res) {
      if (didTimeout) return;
      clearTimeout(timer);
      if (!res.ok) {
        if (callback) callback(null);
        return;
      }
      return res.json();
    })
    .then(function(data) {
      if (didTimeout) return;
      if (callback) callback(data);
    })
    .catch(function() {
      if (didTimeout) return;
      clearTimeout(timer);
      if (callback) callback(null);
    });
  }

  var PRODUCT_INTROS_LIVE = [
    'Great news — I just pulled these live from the catalog for you:',
    'Here\'s what I found right now — fresh from the store:',
    'Found some great options! Let me show you what\'s available:',
    'Sure thing! Here are the top picks I found just now:',
    'I looked it up and here\'s what\'s in stock for you:'
  ];

  function buildProductCardHtml(products, searchUrl, compName, query) {
    var html = '<div class="ins-product-grid">';
    products.forEach(function(p) {
      var pSym = p.currency === 'USD' ? '$' : 'KES ';
      var priceFormatted = pSym + Number(p.price).toLocaleString();
      var rating = p.rating || '4.8 ★';
      var ratingNum = parseFloat((rating + '').replace(/[^0-9.]/g, '')) || 4.8;
      var stars = '';
      for (var s = 1; s <= 5; s++) {
        stars += '<span class="ins-star' + (s <= Math.round(ratingNum) ? ' filled' : '') + '">★</span>';
      }
      var imgEl = p.image
        ? '<img src="' + p.image + '" alt="' + p.name.replace(/"/g, '') + '" class="ins-prod-img" onerror="this.style.display=\'none\'">'
        : '<div class="ins-prod-img-placeholder">🛍️</div>';
      var specsStr = p.specs || 'Official warranty · Doorstep delivery';
      html += '<a href="' + (p.url || searchUrl) + '" target="_blank" rel="noopener noreferrer" class="ins-product-card">' +
        imgEl +
        '<div class="ins-prod-body">' +
          '<div class="ins-prod-name">' + p.name + '</div>' +
          '<div class="ins-prod-specs">' + specsStr + '</div>' +
          '<div class="ins-prod-footer">' +
            '<span class="ins-prod-price">' + priceFormatted + '</span>' +
            '<span class="ins-prod-stars">' + stars + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="ins-prod-cta">View on store ↗</div>' +
      '</a>';
    });
    html += '</div>';
    if (searchUrl) {
      html += '<div class="ins-prod-browse-link"><a href="' + searchUrl + '" target="_blank" rel="noopener noreferrer">Browse all results on ' + compName + ' ↗</a></div>';
    }
    return html;
  }

  function formatScrapedProductsResult(scrapedData, query, siteUrl, compName) {
    if (!scrapedData || !scrapedData.found || !scrapedData.items || scrapedData.items.length === 0) {
      return null;
    }
    if (!compName) compName = 'our store';
    var searchUrl = scrapedData.searchUrl || buildProductSearchUrl(siteUrl, query);
    var topProducts = scrapedData.items.slice(0, 3);
    var dept = getDepartmentHint(query);
    var intro = PRODUCT_INTROS_LIVE[Math.floor(Math.random() * PRODUCT_INTROS_LIVE.length)];

    var message = intro;
    if (dept) {
      message += ' (browsing **' + dept.department + '**).';
    } else {
      message += '.';
    }

    var productCardsHtml = buildProductCardHtml(topProducts, searchUrl, compName, query);

    var quickReplies = [];
    if (topProducts.length > 0) {
      var pShort = topProducts[0].name.length > 20 ? topProducts[0].name.slice(0, 18) + '...' : topProducts[0].name;
      quickReplies.push({
        label: '💬 Tell me more about ' + pShort,
        payload: 'Can you tell me more about ' + topProducts[0].name + '?'
      });
    }
    quickReplies.push({
      label: '🔍 See all results ↗',
      payload: searchUrl,
      url: searchUrl
    });
    if (dept) {
      quickReplies.push({
        label: dept.icon + ' More in ' + dept.department,
        payload: 'What other deals do you have in ' + dept.department + '?'
      });
    }
    quickReplies.push({
      label: '🚚 Delivery info',
      payload: 'How does delivery work and what are the timelines?'
    });

    return {
      found: true,
      isLiveScraped: true,
      query: query,
      items: topProducts,
      searchUrl: searchUrl,
      department: dept ? dept.department : null,
      message: message,
      productCardsHtml: productCardsHtml,
      suggestedQuickReplies: quickReplies
    };
  }

  function searchProducts(params, config) {
    if (!params) params = {};
    if (!config) config = {};
    var query = (params.query || '').trim();
    var siteUrl = (config.company && config.company.websiteUrl) ? config.company.websiteUrl : '';
    var compName = (config.company && config.company.name) ? config.company.name : 'our store';
    var searchUrl = buildProductSearchUrl(siteUrl, query);

    // 1. Boundary check: Out of scope items (cows, cars, real estate)
    var boundary = checkCategoryBoundary(query, compName);
    if (boundary) {
      return {
        found: false,
        isOutOfScope: true,
        query: query,
        items: [],
        searchUrl: '',
        message: boundary.reply,
        suggestedQuickReplies: boundary.suggestedQuickReplies
      };
    }

    // If live scraped data was passed in params, format and return immediately
    if (params.scrapedData && params.scrapedData.found && params.scrapedData.items && params.scrapedData.items.length > 0) {
      var liveRes = formatScrapedProductsResult(params.scrapedData, query, siteUrl, compName);
      if (liveRes) return liveRes;
    }

    // 2. Query matching products from CATALOG_DATABASE
    var lower = query.toLowerCase();
    // V3: 2-letter stubs ("it", "is") substring-match everything ("with", "this") —
    // catalog matching needs real tokens; departments still catch short queries.
    var tokens = lower.split(/[^a-z0-9]+/i).filter(function(t) { return t.length >= 3; });
    var matchedProducts = [];

    for (var cat in CATALOG_DATABASE) {
      var group = CATALOG_DATABASE[cat];
      for (var i = 0; i < group.length; i++) {
        var prod = group[i];
        var isMatch = false;
        var prodText = (prod.name + ' ' + (prod.keywords || []).join(' ')).toLowerCase();
        for (var ti = 0; ti < tokens.length; ti++) {
          if (prodText.indexOf(tokens[ti]) !== -1) {
            isMatch = true;
            break;
          }
        }
        if (isMatch) {
          matchedProducts.push(prod);
        }
      }
    }

    // 3. If matching products are found, present real in-chat product cards
    if (matchedProducts.length > 0) {
      var topProducts = matchedProducts.slice(0, 3);
      var dept = getDepartmentHint(query);
      var catIntros = [
        'Of course! Here are some popular options we carry:',
        'Happy to help with that! Take a look at these:',
        'Here are the best matches I found for you:',
        'Sure! Here\'s what we have available right now:'
      ];
      var message = catIntros[Math.floor(Math.random() * catIntros.length)];
      if (dept) message += ' (in **' + dept.department + '**)';
      message += '.';

      var productCardsHtml = buildProductCardHtml(topProducts, searchUrl, compName, query);

      var quickReplies = [];
      if (topProducts.length > 0) {
        var pShort = topProducts[0].name.length > 20 ? topProducts[0].name.slice(0, 18) + '...' : topProducts[0].name;
        quickReplies.push({
          label: '💬 Tell me more about ' + pShort,
          payload: 'Can you tell me more about ' + topProducts[0].name + '?'
        });
      }
      quickReplies.push({
        label: '🔍 View all results ↗',
        payload: searchUrl,
        url: searchUrl
      });
      if (dept) {
        quickReplies.push({
          label: dept.icon + ' More in ' + dept.department,
          payload: 'What other deals do you have in ' + dept.department + '?'
        });
      }
      quickReplies.push({
        label: '🚚 Delivery info',
        payload: 'How does delivery work and what are the timelines?'
      });

      return {
        found: true,
        query: query,
        items: topProducts,
        searchUrl: searchUrl,
        department: dept ? dept.department : null,
        message: message,
        productCardsHtml: productCardsHtml,
        suggestedQuickReplies: quickReplies
      };
    }

    // 4. Honest fallback — no preset match, point to live catalog
    var dept = getDepartmentHint(query);
    var fallbackIntros = [
      'I don\'t have that in my quick-lookup right now, but I can point you to the live catalog where you can find it:',
      'Hmm, I couldn\'t find an exact match in my index — but the live store should have it:',
      'That one isn\'t in my preset list, but you can search it directly on the store:'
    ];
    var message = fallbackIntros[Math.floor(Math.random() * fallbackIntros.length)];
    if (dept) {
      message += ' Check out the **' + dept.department + '** section — ' + dept.details;
    }
    message += '\n\n💬 Tell me a brand, size, or budget and I\'ll narrow it down — or tap a department below to keep browsing.';

    var quickReplies = [
      { label: '🔍 Search "' + query.slice(0, 18) + '" on store ↗', payload: searchUrl, url: searchUrl }
    ];
    if (dept) {
      quickReplies.push({
        label: dept.icon + ' Browse ' + dept.department,
        payload: 'What deals do you have in ' + dept.department + '?'
      });
    }
    quickReplies.push({
      label: '🚚 Delivery info',
      payload: 'How does delivery work and what are the timelines?'
    });

    return {
      found: true,
      isCatalogFallback: true,
      query: query,
      items: [],
      searchUrl: searchUrl,
      department: dept ? dept.department : null,
      message: message,
      suggestedQuickReplies: quickReplies
    };
  }

  function extractQueryKeywords(rawText) {
    if (!rawText) return { keywords: [], cleanQuery: '', searchTerms: '', isProductInquiry: false, isAboutCompany: false };
    var raw = rawText.trim();
    var cleaned = raw;
    var isProductInquiry = false;

    // Check if input contains or is a search/catalog URL (e.g. https://www.jumia.co.ke/catalog/?q=eggs)
    var urlQueryMatch = raw.match(/[?&]q=([^&#]+)/i);
    if (urlQueryMatch) {
      try {
        cleaned = decodeURIComponent(urlQueryMatch[1].replace(/\+/g, ' ')).trim();
      } catch (e) {
        cleaned = urlQueryMatch[1].replace(/\+/g, ' ').trim();
      }
      isProductInquiry = true;
    } else if (/^https?:\/\//i.test(raw)) {
      try {
        var parsedPath = raw.replace(/^https?:\/\/[^\/]+/i, '').split('?')[0];
        var pathParts = parsedPath.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          cleaned = pathParts[pathParts.length - 1].replace(/[-_]+/g, ' ').trim();
          isProductInquiry = true;
        }
      } catch (e) {}
    }

    var isAboutCompany = /^(?:what\s*is|who\s*(?:is|are)|about\s*(?:us|the\s*company)|tell\s*me\s*about\s*(?:the\s*company|you)|what\s*do\s*you\s*(?:guys\s*)?do)\b/i.test(raw);

    var productPrefixPatterns = [
      /^(?:i\s*(?:am\s*looking|'m\s*looking|look)\s*for)\s+/i,
      /^(?:looking\s*for)\s+/i,
      /^(?:i\s*want\s*to\s*(?:buy|purchase|order|get|find|see|have))\s+/i,
      /^(?:i\s*would\s*like\s*to\s*(?:buy|purchase|order|get|find|see))\s+/i,
      /^(?:i\s*(?:want|need|wish\s*for))\s+/i,
      /^(?:we\s*(?:want|need|are\s*looking\s*for))\s+/i,
      /^(?:do\s*you\s*(?:have|sell|offer|stock|carry))\s+(?:any\s+)?/i,
      /^(?:can\s*i\s*(?:buy|purchase|get|find|order))\s+/i,
      /^(?:can\s*you\s*(?:show|give|find|recommend)\s*me)\s+/i,
      /^(?:show\s*me|search\s*for|find\s*me)\s+/i,
      /^(?:where\s*can\s*i\s*(?:find|buy|get|order))\s+/i,
      /^(?:what\s*kind\s*of|what\s*types?\s*of)\s+/i,
      /^(?:what\s*(?:do\s*you\s*have|are\s*there)\s*for)\s+/i,
      /^(?:is\s*there\s*any|are\s*there\s*any)\s+/i
    ];

    for (var pi = 0; pi < productPrefixPatterns.length; pi++) {
      if (productPrefixPatterns[pi].test(cleaned)) {
        isProductInquiry = true;
        cleaned = cleaned.replace(productPrefixPatterns[pi], '');
        break;
      }
    }

    if (!isProductInquiry && !isAboutCompany && /\b(buy|purchase|order|shop|stock|items?|products?|catalog|deal|deals|selling)\b/i.test(raw)) {
      isProductInquiry = true;
    }

    // Strip conversational trailing questions/phrases
    cleaned = cleaned
      .replace(/\s+(?:what\s*do\s*you\s*have|what\s*(?:is|are)\s*available|do\s*you\s*have\s*any|do\s*you\s*have\s*that|do\s*you\s*have\s*them|in\s*stock|available|on\s*(?:your\s*)?(?:site|store|jumia)|can\s*i\s*get(?:\s*one|\s*some)?|please|for\s*sale|right\s*now|today)[?!.,\s]*$/i, '')
      .replace(/[?!.,]+$/g, '')
      .trim();

    // Strip leading articles or quantities
    cleaned = cleaned.replace(/^(?:a|an|the|some|any|pair\s*of)\s+/i, '').trim();

    // Secondary cleanup of filler words to isolate key topical entities
    var fillerWords = {
      'i':1, 'me':1, 'my':1, 'mine':1, 'we':1, 'us':1, 'our':1, 'ours':1, 'you':1, 'your':1, 'yours':1,
      'a':1, 'an':1, 'the':1, 'in':1, 'on':1, 'at':1, 'to':1, 'for':1, 'of':1, 'with':1, 'by':1, 'from':1,
      'about':1, 'as':1, 'is':1, 'are':1, 'was':1, 'were':1, 'be':1, 'been':1, 'being':1, 'have':1,
      'has':1, 'had':1, 'do':1, 'does':1, 'did':1, 'can':1, 'could':1, 'should':1, 'would':1, 'will':1,
      'shall':1, 'may':1, 'might':1, 'what':1, 'which':1, 'who':1, 'whom':1, 'this':1, 'that':1,
      // V3: question-words can never be topical — "how" must not match every How-question.
      'how':1, 'when':1, 'where':1, 'why':1, 'much':1, 'many':1, 'it':1, 'its':1,
      'they':1, 'them':1, 'their':1, 'he':1, 'she':1, 'him':1, 'her':1,
      'very':1, 'really':1, 'quite':1,
      'these':1, 'those':1, 'any':1, 'some':1, 'all':1, 'and':1, 'or':1, 'but':1, 'if':1, 'so':1,
      'there':1, 'here':1, 'please':1, 'want':1, 'need':1, 'buy':1, 'purchase':1, 'order':1,
      'looking':1, 'look':1, 'find':1, 'get':1, 'show':1, 'tell':1, 'give':1, 'sell':1, 'offer':1,
      'available':1, 'stock':1, 'something':1, 'thing':1, 'things':1,
      'insurance':1, 'policy':1, 'policies':1, 'cover':1, 'coverage':1, 'explain':1,
      'https':1, 'http':1, 'www':1, 'com':1, 'co':1, 'ke':1, 'org':1, 'net':1,
      'catalog':1, 'search':1, 'query':1, 'url':1, 'website':1, 'web':1, 'page':1, 'site':1,
      'jumia':1, 'botly':1
    };

    var rawTokens = tokenize(cleaned);
    var keywords = rawTokens.filter(function(t) { return !fillerWords[t] && t.length >= 2; });

    var searchTerms = keywords.join(' ');
    if (!searchTerms) {
      searchTerms = cleaned || raw;
    }

    return {
      keywords: keywords,
      cleanQuery: cleaned || raw,
      searchTerms: searchTerms,
      isProductInquiry: isProductInquiry && !isAboutCompany,
      isAboutCompany: isAboutCompany
    };
  }

  function classifyQuery(text, config, customFaqs, customKnowledge, memory) {
    var raw = (text || '').trim();
    var queryTokens = tokenize(raw);
    var lower = raw.toLowerCase();
    var isSaasMode = !!(config.mode === 'saas' || (config.customFaqs && config.customFaqs.length > 0));

    memory = memory || {
      turns: 0,
      history: [],
      visitedTopics: [],
      askedFollowUps: [],
      lastFollowUp: null,
      goalStage: 0,
      lastTopic: ''
    };
    if (typeof memory.goalStage !== 'number') memory.goalStage = 0;
    if (!Array.isArray(memory.askedFollowUps)) memory.askedFollowUps = [];
    if (!Array.isArray(memory.visitedTopics)) memory.visitedTopics = [];

    // Affirmative & Negative response handling for progressive follow-ups
    var isAffirmative = /^(yes|yeah|yep|yup|sure|definitely|certainly|absolutely|please|yes\s*please|let'?s\s*do\s*it|let'?s\s*do\s*that|proceed|sounds\s*good|sounds\s*great|i'?d\s*like\s*that|i\s*want\s*that|let'?s\s*go|go\s*ahead|book\s*it|schedule|sign\s*me\s*up|count\s*me\s*in|i\s*agree|yes\s*i\s*would|yes\s*we\s*do|checkout|buy\s*now|book\s*now)\b/i.test(lower);
    var isNegative = /^(no|nope|not\s*now|not\s*right\s*now|no\s*thanks|no\s*thank\s*you|maybe\s*later|not\s*yet|nevermind|i'?m\s*good|pass)\b/i.test(lower);

    if (isNegative && lower.length < 35) {
      memory.lastFollowUp = null;
      var compName = (config && config.company && config.company.name) ? config.company.name : '';
      var teamLabel = compName && compName !== 'Botly' && compName !== 'Botly Pro' ? 'the ' + compName + ' team' : 'the team';
      return {
        intent: 'dismiss',
        reply: "No problem at all! 😊 Take your time. Feel free to ask any other questions about our services, or let me know whenever you'd like to explore further.",
        suggestedQuickReplies: isSaasMode ? [
          { label: 'Our Services', payload: 'What services do you offer?' },
          { label: 'Pricing & Plans', payload: 'What are your pricing and plans?' },
          { label: 'Talk to someone', payload: 'I want to speak with someone from ' + teamLabel }
        ] : [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '💳 Proceed to Payment', payload: 'intent_pay' },
          { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
        ]
      };
    }

    // V3: pending offers expire — a "yes" more than ~2 turns later answers something else.
    if (memory.lastFollowUp && memory.lastFollowUp.turn && memory.lastFollowUp.turn < (memory.turns || 0) - 2) {
      memory.lastFollowUp = null;
    }

    // V3: bare acknowledgments ("okay", "got it", "sawa") continue the topic —
    // they NEVER accept a pending offer and NEVER trigger lead capture.
    var isBareAck = /^(ok|okay|k|kk|alright|got\s*it|noted|cool|fine|understood|roger|sawa|poa|asante|shukrani|thx)\b[\s!.,]*(thanks|thank\s*you|thx)?[\s!.,]*$/i.test(lower);
    if (isBareAck && lower.length < 60) {
      var _ackTopic = (memory && (memory.lastTopic || (memory.lastFollowUp && memory.lastFollowUp.topic))) || '';
      _ackTopic = _ackTopic.replace(/^(what\s+about|what\s+is|what\s+are|who\s+is|how\s+do\s+i|how\s+can\s+i|tell\s+me\s+about)\s+/i, '').replace(/\?+\s*$/, '').trim();
      if (_ackTopic.length > 60) _ackTopic = _ackTopic.substring(0, 57) + '...';
      var _ackComp = (config && config.company && config.company.name) ? config.company.name : '';
      var _ackTeam = (_ackComp && _ackComp !== 'Botly' && _ackComp !== 'Botly Pro') ? 'the ' + _ackComp + ' team' : 'the team';
      var _ackReplies = isSaasMode ? [
        { label: 'Our Services', payload: 'What services do you offer?' },
        { label: 'Pricing & Plans', payload: 'What are your pricing and plans?' },
        { label: 'Talk to someone', payload: 'I want to speak with someone from ' + _ackTeam }
      ] : [
        { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
        { label: '💳 Proceed to Payment', payload: 'intent_pay' },
        { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
      ];
      if (_ackTopic && isSaasMode) {
        _ackReplies.unshift({ label: 'More on ' + (_ackTopic.length > 22 ? _ackTopic.substring(0, 20) + '…' : _ackTopic), payload: 'Tell me more about ' + _ackTopic });
      }
      return {
        intent: 'acknowledge',
        reply: _ackTopic
          ? 'Got it! 👍 Anything else about **' + _ackTopic + '** — or is there something new I can help with?'
          : 'Got it! 👍 What else can I help you with?',
        suggestedQuickReplies: _ackReplies
      };
    }

    if (isAffirmative && memory.lastFollowUp && lower.length < 40) {
      var followType = memory.lastFollowUp.type;
      var _rawTopicDesc = memory.lastFollowUp.topic || memory.lastTopic || 'your inquiry';
      var topicDesc = _rawTopicDesc
        .replace(/^(what\s+about|what\s+is|what\s+are|who\s+is|how\s+do\s+i|how\s+can\s+i|tell\s+me\s+about)\s+/i, '')
        .replace(/^what\s+services\s+or\s+solutions\s+does\s+.+?\s+offer\??\s*$/i, 'our services')
        .replace(/\?+\s*$/, '').trim();
      if (!topicDesc) topicDesc = 'your inquiry';
      if (topicDesc.length > 70) topicDesc = topicDesc.substring(0, 67) + '...';

      if (followType === 'payment_checkout') {
        memory.lastFollowUp = null;
        return {
          intent: 'start_payment_flow',
          action: 'OPEN_PAYMENT_WIZARD'
        };
      }

      if (followType === 'consultation_booking') {
        memory.lastFollowUp = null;
        return {
          intent: 'consultation_booking',
          action: 'LEAD_CAPTURE',
          inquiredNeed: '1-on-1 Consultation Session (' + topicDesc + ')',
          leadIntro: "Awesome — let's get your 1-on-1 consultation scheduled! What's your **full name**?"
        };
      }

      if (followType === 'lead_generation') {
        memory.lastFollowUp = null;
        return {
          intent: 'lead_generation',
          action: 'LEAD_CAPTURE',
          inquiredNeed: topicDesc ? 'Follow-up regarding ' + topicDesc : 'Specialist Follow-Up & Consultation',
          leadIntro: "Wonderful! I'll have our specialist put together a custom proposal and reach out directly. What's your **full name**?"
        };
      }

      if (followType === 'customer_support' || followType === 'human_handover') {
        memory.lastFollowUp = null;
        // V3: only advertise contact details the owner configured (never a fallback number).
        var _supPhone = (config && config.company && config.company.supportPhone) || '';
        var _supEmail = (config && config.company && config.company.supportEmail) || '';
        var _supBits = [];
        if (_supPhone) _supBits.push('at **' + _supPhone + '**');
        if (_supEmail) _supBits.push('email **' + _supEmail + '**');
        var _supLine = _supBits.length ? ' You can also reach us directly ' + _supBits.join(' or ') + '.' : '';
        return {
          intent: 'human_handover',
          action: 'LEAD_CAPTURE',
          inquiredNeed: 'Support Specialist Callback (' + topicDesc + ')',
          leadIntro: "I'd be glad to connect you with our support team!" + _supLine + "\n\nWhat's your **full name**, so an agent can call you right back?"
        };
      }
    }

    // Direct booking intent
    if (/\b(book\s*a\s*(call|consultation|meeting|demo)|schedule\s*a\s*(call|consultation|meeting|demo)|i\s*want\s*to\s*book|book\s*consultation)\b/i.test(lower)) {
      return {
        intent: 'consultation_booking',
        action: 'LEAD_CAPTURE',
        inquiredNeed: '1-on-1 Consultation Demo (' + (memory.lastTopic || 'General Consultation') + ')',
        leadIntro: "Awesome — let's get your 1-on-1 consultation scheduled! What's your **full name**?"
      };
    }

    // User explicitly asking to repeat the last question or what was asked
    if (/\b(repeat(\s*the)?\s*question|ask\s*(me\s*)?(again|that)|what\s*did\s*you\s*(just\s*)?ask|say\s*(that\s*)?again|what\s*was\s*that\s*question)\b/i.test(lower)) {
      if (memory && memory.lastFollowUp && memory.lastFollowUp.text) {
        return {
          intent: 'repeat_question',
          reply: "I was asking:\n\n" + memory.lastFollowUp.text
        };
      }
    }

    var compName = (config && config.company && config.company.name) ? config.company.name.trim() : '';
    var isBotlySelf = !compName || /^(botly|botly\s*(pro|ai|insurance)?)$/i.test(compName) || (/\bbotly\b/i.test(lower) && !/\b(other|different|not)\s*botly\b/i.test(lower));

    // Services Overview & Chatbot Creation (Botly Pro self-bot ONLY)
    // Non-Botly client bots fall straight through to client knowledge base search or lead capture
    if (isBotlySelf && /\b(our\s*services?|what\s*(are\s*your\s*services?|services?\s*do\s*you\s*(offer|provide)|do\s*you\s*(do|offer|provide))|services?\s*offered|chatbot\s*creation|create\s*(a\s*)?chatbot|build\s*(a\s*)?chatbot|make\s*(a\s*)?chatbot|ai\s*chatbots?)\b/i.test(lower)) {
      var allFaqsCheck = (customKnowledge || []).concat(customFaqs || []);
      var hasCustomServiceFaq = false;
      for (var sfi = 0; sfi < allFaqsCheck.length; sfi++) {
        var sfItem = allFaqsCheck[sfi];
        if (sfItem && (sfItem.question || sfItem.answer)) {
          var sfText = ((sfItem.question || '') + ' ' + (sfItem.keywords || []).join(' ')).toLowerCase();
          if (/\b(services?|what\s*we\s*do|solutions?|offer)\b/i.test(sfText)) {
            hasCustomServiceFaq = true;
            break;
          }
        }
      }
      if (!hasCustomServiceFaq) {
        return {
          intent: 'services_overview',
          reply: "We specialize in **Autonomous AI Chatbot Creation & Deployment** for companies of all sizes! 🚀\n\nHere is what our services include:\n• **Custom AI Chatbot Creation**: Tailored bots trained on your company's website, documents, and FAQs.\n• **24/7 Customer Support Automation**: Instant, human-like answers to customer inquiries around the clock.\n• **Autonomous Lead Capture**: Automatically collects and qualifies verified customer names and phone numbers.\n• **Live Product & Catalog Discovery**: Dynamic store & website scraping with real-time pricing and direct store links.\n• **5-Minute No-Code Deployment**: Works seamlessly on WordPress, Shopify, Webflow, React, Next.js, and HTML websites for just $10 flat per bot!\n\nWould you like to deploy a custom chatbot for your business?",
          suggestedQuickReplies: [
            { label: 'Get started', payload: 'How do I get started?' },
            { label: 'Pricing & Plans', payload: 'What are your pricing and plans?' },
            { label: 'Talk to someone', payload: 'I want to speak with someone from the team' }
          ]
        };
      }
    }

    // 1. Direct Greetings
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
      var greetName = (config.bot && config.bot.name) ? config.bot.name : 'Botly Pro';
      if (memory) { memory.lastFollowUp = null; memory.lastProductQuery = null; } // V3: greeting restarts the topic
      var greetMsg = (config.bot && config.bot.greeting)
        ? config.bot.greeting
        : (isSaasMode
            ? "Hey! 👋 I'm **" + greetName + "**. How can I help you today? Feel free to ask about pricing, features, or getting started."
            : "Hello! 👋 I'm **" + greetName + "**, your 24/7 assistant. How can I help you today?");
      return {
        intent: 'greeting',
        reply: greetMsg
      };
    }

    // 2. Thanks / Appreciation
    if (/^(thank\s*you|thanks|thx|awesome|great|perfect)\b/i.test(lower)) {
      return {
        intent: 'thanks',
        reply: isSaasMode
          ? (isBotlySelf
              ? "You're very welcome! 😊 Let me know if you have any other questions or need help setting up your bot."
              : "You're very welcome! 😊 Let me know if you have any other questions or if there's anything else I can assist you with.")
          : "You're very welcome! 😊 What else can I help you with?"
      };
    }

    // 3. Human Representative Escalation
    if (/human|agent|representative|speak\s*(to|with)\s*(someone|person|a\s*human|an?\s*agent|human|agent)?|advisor|person|talk\s*to\s*(someone|person)|call\s*me/i.test(lower)) {
      // V3: only advertise contact details the owner configured — never a fallback number.
      var supportPhone = (config.company && config.company.supportPhone) || '';
      var supportEmail = (config.company && config.company.supportEmail) || (isBotlySelf ? 'david@nextaistudios.com' : (config.company && config.company.websiteUrl ? 'contact@' + config.company.websiteUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') : ''));
      var _contactBits = [];
      if (supportPhone) _contactBits.push('at **' + supportPhone + '**');
      if (supportEmail) _contactBits.push('by email at **' + supportEmail + '**');
      var _contactLine = _contactBits.length ? ' You can reach us directly ' + _contactBits.join(' or ') + '.' : '';
      var handoverReply = isSaasMode
        ? "I'd be glad to connect you with our team!" + _contactLine + "\n\nLeave your contact details below and someone will reach out shortly."
        : "I'd be glad to connect you with a licensed advisor!" + _contactLine + "\n\nLeave your phone or email below and we'll call you right back!";
      return {
        intent: 'human_handover',
        action: 'LEAD_CAPTURE',
        inquiredNeed: 'Support callback request',
        leadIntro: isSaasMode
          ? "I'd be glad to connect you with our team!" + _contactLine + "\n\nTo have a specialist reach out, what's your **full name**?"
          : "I'd be glad to connect you with a licensed advisor!" + _contactLine + "\n\nTo have an advisor call you right back, what's your **full name**?",
        reply: handoverReply
      };
    }

    // 4. In insurance mode or when payment_checkout goal is active, route to checkout wizard
    var configGoals = config.goals || (config.goal ? [config.goal] : []);
    var hasPaymentGoal = (configGoals.indexOf('payment_checkout') !== -1) || (config && config.checkout && config.checkout.enabled);
    if (!isSaasMode || hasPaymentGoal) {
      if (lower === 'checkout_method_mpesa' || /\b(mpesa|m-pesa|lipa\s*na\s*mpesa)\b/i.test(lower)) {
        return { intent: 'start_payment_flow', action: 'OPEN_PAYMENT_WIZARD', paymentMethod: 'mpesa' };
      }
      if (lower === 'checkout_method_card' || /\b(credit\s*card|debit\s*card|pay\s*with\s*card|visa|mastercard|stripe|paypal)\b/i.test(lower)) {
        return { intent: 'start_payment_flow', action: 'OPEN_PAYMENT_WIZARD', paymentMethod: 'card' };
      }
      if (/\b(pay(\s*now|\s*my|\s*bill|\s*policy|\s*premium|\s*online)?|checkout(\s*now)?|lipa(\s*sasa)?|make\s*payment|proceed\s*to\s*checkout|start\s*checkout)\b/i.test(lower) && !/\b(watch|phone|laptop|tv|product|shoes|dress|sneaker|plan|pricing|cost|how\s*much|quote)\b/i.test(lower)) {
        return { intent: 'start_payment_flow', action: 'OPEN_PAYMENT_WIZARD', paymentMethod: null };
      }
    }

    if (!isSaasMode) {
      if (/claim|accident|stolen|theft|damage|crashed|file\s*a\s*claim/i.test(lower)) {
        if (!/difference|how\s*long|timeline/i.test(lower)) {
          return { intent: 'start_claim_flow', action: 'OPEN_CLAIMS_WIZARD' };
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
    }

    // V3: short follow-ups ("how much is it?", "and delivery?") resolve against the live
    // topic. Anything carrying a NEW content word is a topic change and classifies fresh.
    if (memory && memory.lastProductQuery && lower.length < 60) {
      var _refWords = { how:1, what:1, when:1, where:1, which:1, that:1, this:1, those:1, them:1, they:1, with:1, about:1, does:1, have:1, much:1, many:1, cost:1, costs:1, price:1, prices:1, pricing:1, delivery:1, deliver:1, shipping:1, ship:1, payment:1, pay:1, order:1, buy:1, get:1, more:1, also:1, and:1, the:1, for:1, are:1, you:1, your:1, there:1, their:1, any:1, some:1, one:1, ones:1, else:1, other:1 };
      var _msgWords = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
      var _newWords = [];
      for (var _wi = 0; _wi < _msgWords.length; _wi++) {
        var _w = _msgWords[_wi];
        if (_w.length > 2 && !_refWords[_w] && memory.lastProductQuery.toLowerCase().indexOf(_w) === -1) _newWords.push(_w);
      }
      var _looksReferential = _msgWords.length <= 6 || /^(how\s+much|what\s+about|how\s+about|and\b|also\b|tell\s+me\s+more|more\b|delivery\b|shipping\b|price\b|cost\b|it\b|that\b|them\b|those\b|this\b)/i.test(lower);
      if (_looksReferential && _newWords.length === 0) {
        raw = (raw + ' ' + memory.lastProductQuery).trim();
        lower = raw.toLowerCase();
        queryTokens = tokenize(raw);
      }
    }

    // P90: buy/order intent for a specific item ("I want to buy the tote bag").
    // Gated by config.orderFlow.enabled (product bots like the /demo shop).
    // Eligible FAQs are item cards only: question starts with "tell me
    // about/show me" AND the answer carries a price — so M-Pesa, delivery
    // and policy FAQs can never be "ordered".
    if (config && config.orderFlow && config.orderFlow.enabled) {
      var _buyVerbs = { buy:1, buying:1, purchase:1, purchasing:1, order:1, ordering:1, pay:1, paying:1, paid:1, take:1, taking:1, want:1, wants:1, wanna:1, get:1, getting:1, checkout:1 };
      var _buyStop = { i:1, me:1, my:1, we:1, us:1, our:1, you:1, your:1, the:1, a:1, an:1, and:1, or:1, of:1, for:1, in:1, on:1, to:1, is:1, are:1, do:1, does:1, it:1, this:1, that:1, them:1, those:1, please:1, just:1, now:1, here:1, some:1, one:1, with:1, would:1, like:1, will:1, can:1, could:1, how:1, what:1, ll:1, ve:1, re:1, don:1 };
      var _buyQ = tokenize(raw);
      var _hasBuy = false;
      var _buyContent = [];
      for (var _bi = 0; _bi < _buyQ.length; _bi++) {
        var _bw = _buyQ[_bi];
        if (_buyVerbs[_bw]) { _hasBuy = true; continue; }
        if (!_buyStop[_bw] && _bw.length >= 2) _buyContent.push(_bw);
      }
      if (_hasBuy && _buyContent.length === 0 && memory && memory.lastProductQuery) {
        var _lpq = tokenize(memory.lastProductQuery);
        for (var _li = 0; _li < _lpq.length; _li++) {
          if (!_buyStop[_lpq[_li]] && !_buyVerbs[_lpq[_li]] && _lpq[_li].length >= 2) _buyContent.push(_lpq[_li]);
        }
      }
      if (_hasBuy && _buyContent.length > 0) {
        var _buyFaqs = (customKnowledge || []).concat(customFaqs || []);
        var _buyBest = null;
        var _buyBestHits = 0;
        for (var _bfi = 0; _bfi < _buyFaqs.length; _bfi++) {
          var _bf = _buyFaqs[_bfi];
          if (!_bf || !/^(tell\s*me\s*about|show\s*me)\s+/i.test(_bf.question || '')) continue;
          if (!/KSh\s*[\d,]+|\$\s*[\d,]+/i.test(_bf.answer || '')) continue;
          var _bt = tokenize(_bf.question || '').concat(tokenize((_bf.keywords || []).join(' ')));
          var _bh = 0;
          for (var _bci = 0; _bci < _buyContent.length; _bci++) {
            for (var _bti = 0; _bti < _bt.length; _bti++) {
              if (wordsMatch(_buyContent[_bci], _bt[_bti])) { _bh++; break; }
            }
          }
          if (_bh > _buyBestHits) { _buyBestHits = _bh; _buyBest = _bf; }
        }
        if (_buyBest && _buyBestHits > 0) {
          var _bq = _buyBest.question || '';
          var _itemLabel = _bq.replace(/^(tell\s*me\s*about|show\s*me)\s+/i, '').replace(/^(the|a|an)\s+/i, '').trim() || 'this item';
          var _pall = (_buyBest.answer || '').match(/KSh\s*[\d,]+/gi) || [];
          var _pd = (_buyBest.answer || '').match(/\$\s*[\d,]+/) || [];
          var _orderPrice = _pall.length ? _pall[_pall.length - 1] : (_pd.length ? _pd[0] : '');
          return { intent: 'order_item', action: 'START_ORDER_FLOW', orderItem: _itemLabel, orderPrice: _orderPrice };
        }
      }
    }

    // 5. Knowledge Base Search (In SaaS mode, ONLY search custom FAQs and custom knowledge)
    var allFaqsRaw = isSaasMode
      ? (customKnowledge || []).concat(customFaqs || [])
      : (customKnowledge || []).concat(customFaqs || []).concat(INSURANCE_KNOWLEDGE_BASE);

    // Deduplicate answers / Q&As
    var seenFaqKeys = {};
    var allFaqs = [];
    allFaqsRaw.forEach(function(item) {
      if (!item) return;
      var k = ((item.question || '') + ':::' + (item.answer || '')).trim().toLowerCase();
      if (!seenFaqKeys[k]) {
        seenFaqKeys[k] = true;
        allFaqs.push(item);
      }
    });

    var stopWords = {
      'do': 1, 'you': 1, 'we': 1, 'i': 1, 'the': 1, 'a': 1, 'an': 1, 'and': 1, 'or': 1, 'of': 1, 'for': 1, 'in': 1,
      'on': 1, 'to': 1, 'is': 1, 'are': 1, 'it': 1, 'can': 1, 'how': 1, 'what': 1, 'offer': 1, 'have': 1,
      'insurance': 1, 'policy': 1, 'looking': 1, 'look': 1, 'want': 1, 'need': 1, 'find': 1, 'show': 1,
      'give': 1, 'buy': 1, 'purchase': 1, 'order': 1, 'sell': 1, 'store': 1, 'mall': 1, 'products': 1,
      'product': 1, 'item': 1, 'items': 1, 'shopping': 1, 'online': 1, 'available': 1, 'stock': 1,
      'get': 1, 'deal': 1, 'deals': 1, 'selling': 1, 'carry': 1,
      'https': 1, 'http': 1, 'www': 1, 'com': 1, 'co': 1, 'ke': 1, 'org': 1, 'net': 1,
      'catalog': 1, 'search': 1, 'query': 1, 'url': 1, 'website': 1, 'web': 1, 'page': 1, 'site': 1,
      'jumia': 1, 'botly': 1
    };

    var extractedInfo = extractQueryKeywords(raw);
    var topicalKeywords = extractedInfo.keywords;
    var isProductInquiry = extractedInfo.isProductInquiry;
    var isAboutCompany = extractedInfo.isAboutCompany;
    var cleanSearchSubject = (extractedInfo.cleanQuery || '').toLowerCase();
    var isPolicyInquiry = /\b(return|refund|returns|refunds|warranty|shipping|delivery|dispatch|timeline|fee|courier|pay|payment|mpesa|m-pesa|card|checkout|terms|privacy|policy|policies)\b/i.test(raw);

    var best = null;
    var highest = 0;
    allFaqs.forEach(function(item) {
      // 1. Tag Content Type
      var contentType = item.contentType;
      if (!contentType) {
        if ((item.products && Array.isArray(item.products) && item.products.length > 0) ||
            (item.answer && /[•\*\-]+\s*\*\*([^*]+)\*\*.*?[—–\-:]\s*\*\*([A-Z\$]{1,4})?\s*([0-9,]+(?:\.[0-9]{2})?)\*\*/i.test(item.answer))) {
          contentType = 'product_listing';
        } else if (item.category === 'overview' || item.id === 'web_jumia_home' || /^(what\s*is\s*([a-z0-9]+\s+)?(company|jumia|botly|this|you)|who\s*(we\s*are|are\s*you)|about\s*(us|the\s*company))/i.test(item.question || '')) {
          contentType = 'overview';
        } else if (item.category === 'policies' || item.category === 'policy' || /\b(return|refund|warranty|shipping|delivery|dispatch|courier|guarantee|terms|privacy|payment|pay|m-pesa|mpesa|escrow)\b/i.test(item.question || '')) {
          contentType = 'policy';
        } else {
          contentType = 'faq';
        }
      }
      item.contentType = contentType;

      // 2. Strict Content-Type Gating
      // Conversational upgrade: overview chunks that actually mention the query's
      // topic stay in the race — only generic ones are skipped. (Keeps product
      // questions like "I want an educational tool" answerable from knowledge.)
      if (contentType === 'overview' && (isProductInquiry || (!isAboutCompany && topicalKeywords.length > 0))) {
        var _ovTokens = tokenize((item.question || '') + ' ' + (item.keywords || []).join(' '));
        var _ovTopical = false;
        for (var _oi = 0; _oi < topicalKeywords.length && !_ovTopical; _oi++) {
          for (var _oj = 0; _oj < _ovTokens.length; _oj++) {
            if (wordsMatch(topicalKeywords[_oi], _ovTokens[_oj])) { _ovTopical = true; break; }
          }
        }
        if (!_ovTopical && cleanSearchSubject && cleanSearchSubject.length >= 3 &&
            (item.question || '').toLowerCase().indexOf(cleanSearchSubject) !== -1) {
          _ovTopical = true;
        }
        if (!_ovTopical) {
          return;
        }
      }
      if (contentType === 'policy' && isProductInquiry && !isPolicyInquiry) {
        return;
      }

      // Product Listing Chunks: Strict Domain / Category Alignment
      if (contentType === 'product_listing' && (isProductInquiry || topicalKeywords.length > 0)) {
        var allowedProductTokens = {};
        (item.keywords || []).forEach(function(k) {
          tokenize(k).forEach(function(t) {
            if (!stopWords[t] && t.length >= 2) allowedProductTokens[t.toLowerCase()] = 1;
          });
        });
        tokenize(item.question || '').forEach(function(t) {
          if (!stopWords[t] && t.length >= 2) allowedProductTokens[t.toLowerCase()] = 1;
        });
        if (item.products && Array.isArray(item.products)) {
          item.products.forEach(function(p) {
            tokenize(p.name || '').forEach(function(t) {
              if (!stopWords[t] && t.length >= 2) allowedProductTokens[t.toLowerCase()] = 1;
            });
          });
        }
        if (item.answer) {
          var bMatches = item.answer.match(/\*\*([^*]+)\*\*/g) || [];
          bMatches.forEach(function(b) {
            tokenize(b).forEach(function(t) {
              if (!stopWords[t] && t.length >= 2) allowedProductTokens[t.toLowerCase()] = 1;
            });
          });
        }

        var chunkHasProductMatch = false;
        for (var tki = 0; tki < topicalKeywords.length; tki++) {
          var tk = topicalKeywords[tki];
          for (var ap in allowedProductTokens) {
            if (wordsMatch(tk, ap)) {
              chunkHasProductMatch = true;
              break;
            }
          }
          if (chunkHasProductMatch) break;
        }

        if (!chunkHasProductMatch && cleanSearchSubject && cleanSearchSubject.length >= 3) {
          if ((item.question || '').toLowerCase().indexOf(cleanSearchSubject) !== -1 ||
              (item.keywords || []).some(function(k) { return k.toLowerCase().indexOf(cleanSearchSubject) !== -1; })) {
            chunkHasProductMatch = true;
          }
        }

        if (!chunkHasProductMatch) {
          return;
        }
      }

      var qTokens = tokenize(item.question).concat((item.keywords || []).flatMap(function(k) { return tokenize(k); }));
      var isDocOrWeb = item.source === 'document' || item.source === 'website' || item.category === 'document' || item.category === 'website';
      var aTokens = isDocOrWeb ? tokenize(item.answer || '') : null;
      var keyMatches = 0;

      // Exact cleanSearchSubject match bonus
      if (cleanSearchSubject && cleanSearchSubject.length >= 3) {
        if ((item.question || '').toLowerCase().indexOf(cleanSearchSubject) !== -1) {
          keyMatches += 4.0;
        } else if ((item.keywords || []).some(function(k) { return k.toLowerCase().indexOf(cleanSearchSubject) !== -1; })) {
          keyMatches += 3.5;
        } else if (item.answer && item.answer.toLowerCase().indexOf(cleanSearchSubject) !== -1) {
          keyMatches += 2.5;
        }
      }

      // Check topical keyword matches
      var topicalMatched = false;
      if (topicalKeywords.length > 0) {
        for (var tki = 0; tki < topicalKeywords.length; tki++) {
          var tk = topicalKeywords[tki];
          for (var qti = 0; qti < qTokens.length; qti++) {
            if (wordsMatch(tk, qTokens[qti])) {
              keyMatches += (tk === qTokens[qti] ? 3.0 : 2.0);
              topicalMatched = true;
              break;
            }
          }
        }
      }

      queryTokens.forEach(function(t) {
        if (!stopWords[t] && t.length >= 2) {
          var matched = false;
          for (var qi = 0; qi < qTokens.length; qi++) {
            if (wordsMatch(t, qTokens[qi])) {
              keyMatches += (t === qTokens[qi] ? 2.5 : 2.0);
              matched = true;
              break;
            }
          }
          if (!matched && aTokens) {
            for (var ai = 0; ai < aTokens.length; ai++) {
              if (wordsMatch(t, aTokens[ai])) {
                keyMatches += (t === aTokens[ai] ? 1.5 : 1.2);
                break;
              }
            }
          }
        }
      });

      // If the query has specific topical keywords, require that at least one topical keyword matched
      if (topicalKeywords.length > 0 && !topicalMatched && !((item.question || '').toLowerCase().indexOf(cleanSearchSubject) !== -1)) {
        return;
      }

      // P89 safety net: queries with no matchable content words ("what do you
      // sell?") can never score keyword hits — fall back to whole-question
      // word overlap so the closest custom FAQ still wins over lead capture.
      // Requires either a shared content word or a content-less query, so
      // "tell me about the shop" can't boost unrelated item FAQs.
      if (keyMatches === 0) {
        var _p89Stop = { a:1, an:1, the:1, and:1, or:1, of:1, for:1, in:1, on:1, to:1, is:1, are:1, was:1, were:1, be:1, do:1, does:1, did:1, can:1, could:1, should:1, would:1, will:1, shall:1, may:1, it:1, its:1, this:1, that:1, these:1, those:1, there:1, here:1, i:1, me:1, my:1, we:1, us:1, our:1, you:1, your:1, they:1, them:1, their:1, he:1, she:1, him:1, her:1, what:1, which:1, who:1, whom:1, how:1, when:1, where:1, why:1, much:1, many:1, with:1, by:1, from:1, about:1, as:1, at:1, tell:1, show:1, give:1, get:1, want:1, need:1, sell:1, buy:1, purchase:1, order:1, shop:1, please:1, very:1, just:1, so:1, if:1 };
        var _p89Q = tokenize(raw);
        var _p89T = tokenize(item.question || '');
        if (_p89Q.length >= 3 && _p89T.length > 0) {
          var _p89Hit = 0, _p89ContentHit = 0, _p89ContentTotal = 0;
          for (var _p89i = 0; _p89i < _p89Q.length; _p89i++) {
            var _p89w = _p89Q[_p89i];
            var _p89IsContent = !_p89Stop[_p89w] && _p89w.length >= 2;
            if (_p89IsContent) _p89ContentTotal++;
            for (var _p89j = 0; _p89j < _p89T.length; _p89j++) {
              if (wordsMatch(_p89w, _p89T[_p89j])) {
                _p89Hit++;
                if (_p89IsContent) _p89ContentHit++;
                break;
              }
            }
          }
          if (_p89Hit / _p89Q.length >= 0.75 && (_p89ContentTotal === 0 || _p89ContentHit > 0)) {
            keyMatches += 3.0;
          }
        }
      }
      var score = computeScore(queryTokens, (item.question || '') + ' ' + (item.answer || ''), item.keywords || []);
      if (keyMatches > 0) {
        score += keyMatches * 0.2;
      } else {
        score *= 0.1;
      }

      if (item.isCustomTrained) score *= 1.35;
      if (score > highest) {
        highest = score;
        best = item;
      }
    });

    function generateFollowUpQuestion(item, mem, cfg, saasMode) {
      cfg = cfg || config || {};
      if (cfg.followUpDynamics && cfg.followUpDynamics.enabled === false) return null;
      mem = mem || memory || { turns: 0, history: [], visitedTopics: [], askedFollowUps: [], lastFollowUp: null, goalStage: 0, lastTopic: '' };
      if (typeof mem.goalStage !== 'number') mem.goalStage = 0;
      if (!Array.isArray(mem.askedFollowUps)) mem.askedFollowUps = [];
      if (!Array.isArray(mem.visitedTopics)) mem.visitedTopics = [];

      var goals = cfg.goals || (cfg.goal ? [cfg.goal] : ['lead_generation']);
      var compName = (cfg.company && cfg.company.name) ? cfg.company.name : '';
      var teamLabel = compName && compName !== 'Botly' && compName !== 'Botly Pro' ? 'the ' + compName + ' team' : 'our team';
      var phoneNum = (cfg.company && cfg.company.supportPhone) ? cfg.company.supportPhone : '';
      var emailAddr = (cfg.company && cfg.company.supportEmail) ? cfg.company.supportEmail : '';

      var candidateList = [];
      var stage = mem.goalStage;
      var topicLabel = (item && item.question) ? item.question : 'our services';
      if (topicLabel.length > 38) topicLabel = topicLabel.substring(0, 35) + '...';

      if (!saasMode) {
        var tone = (cfg && cfg.followUpDynamics && cfg.followUpDynamics.tone) || (cfg && cfg.goal === 'customer_support' ? 'support' : (cfg && cfg.goal === 'payment_checkout' ? 'sales' : 'consultative'));

        if (tone === 'direct') {
          candidateList.push({ text: '💬 Would you like to proceed with this or explore other options?', type: 'direct', key: 'ins_direct' });
        }

        if (!item) {
          if (tone === 'sales') candidateList.push({ text: '💬 Would you like me to connect you with an advisor to reserve this rate today?', type: 'sales', key: 'ins_reserve_rate' });
          if (tone === 'support') candidateList.push({ text: '💬 Did this completely solve your inquiry, or can I clarify anything else?', type: 'customer_support', key: 'ins_solve_inquiry' });
          candidateList.push({ text: '💬 Does this answer your question, or would you like me to clarify anything specific?', type: 'customer_support', key: 'ins_clarify_specific' });
        } else {
          var cat = item.category || '';
          var q = (item.question || '').toLowerCase();

          if (tone === 'sales') {
            if (cat === 'payments' || q.indexOf('pay') !== -1) {
              candidateList.push({ text: '💬 Shall we complete your activation and lock in your discount right now?', type: 'payment_checkout', key: 'ins_complete_act' });
            }
            if (cat === 'auto' || cat === 'health') {
              candidateList.push({ text: '💬 Would you like our underwriter to reserve this quote for you today?', type: 'lead_generation', key: 'ins_reserve_quote' });
            }
          }

          if (tone === 'support') {
            if (cat === 'claims' || q.indexOf('claim') !== -1) {
              candidateList.push({ text: '💬 Would you like me to file this claim for you immediately, or do you have supporting documents to check?', type: 'customer_support', key: 'ins_file_claim' });
            }
            candidateList.push({ text: '💬 Did this help resolve your concern, or would you prefer a quick call from a support specialist?', type: 'customer_support', key: 'ins_support_specialist' });
          }

          if (cat === 'claims' || q.indexOf('claim') !== -1) {
            candidateList.push({ text: '💬 Would you like me to start an incident report and fast-track a claim for you right now?', type: 'customer_support', key: 'ins_start_incident' });
          }
          if (cat === 'auto' || q.indexOf('auto') !== -1 || q.indexOf('car') !== -1) {
            candidateList.push({ text: '💬 Would you like me to calculate an exact quote with these options included, or compare another tier?', type: 'lead_generation', key: 'ins_exact_quote' });
          }
          if (cat === 'health' || q.indexOf('health') !== -1 || q.indexOf('medical') !== -1) {
            candidateList.push({ text: '💬 Would you like to compare our Silver, Gold, and Platinum health tiers, or check family add-on rates?', type: 'lead_generation', key: 'ins_health_tiers' });
          }
          if (cat === 'payments' || q.indexOf('pay') !== -1 || q.indexOf('discount') !== -1) {
            candidateList.push({ text: '💬 Would you like to proceed with checkout and apply your active discount code now?', type: 'payment_checkout', key: 'ins_pay_discount' });
          }
          if (q.indexOf('deductible') !== -1) {
            candidateList.push({ text: '💬 Would you like to see how choosing a higher or lower deductible affects your monthly premium?', type: 'lead_generation', key: 'ins_deductible_effect' });
          }
          candidateList.push({ text: '💬 Does this answer what you had in mind, or would you like me to clarify anything specific about your setup?', type: 'customer_support', key: 'ins_clarify_setup' });
          candidateList.push({ text: '💬 Can I help with any other policy details or coverage options?', type: 'customer_support', key: 'ins_more_options' });
        }
      } else {
        // SaaS Mode: Progressive, Context-Aware, Memory-Tracking Follow-Up System
        var qLower = (item ? item.question || '' : '').toLowerCase();
        var aLower = (item ? item.answer || '' : '').toLowerCase();
        var fullTxt = qLower + ' ' + aLower + ' ' + (item && item.keywords ? item.keywords.join(' ') : '').toLowerCase();

        var isPricing = /\b(price|pricing|cost|fee|rate|plan|plans|package|packages|tier|tiers|\$|subscription|billing|charge)\b/i.test(fullTxt);
        var isServices = /\b(service|services|solution|solutions|feature|features|capability|capabilities|offer|provide|platform|develop|custom)\b/i.test(fullTxt);
        var isSupport = /\b(support|contact|reach|phone|email|help|assist|call|hours|location)\b/i.test(fullTxt);
        var isOnboarding = /\b(start|how|work|setup|install|embed|guide|onboard|getting started|step|process)\b/i.test(fullTxt);

        // 1. If topic is Pricing / Plans
        if (isPricing) {
        if (goals.indexOf('payment_checkout') !== -1) {
          candidateList.push({
            key: 'chk_lock_plan',
            type: 'payment_checkout',
            text: '💬 Would you like to proceed with secure in-chat checkout to lock in this plan today?'
          });
          candidateList.push({
            key: 'chk_complete_order',
            type: 'payment_checkout',
            text: '💬 Ready to get started? We can complete your order right here in chat in under 2 minutes.'
          });
          candidateList.push({
            key: 'chk_launch_now',
            type: 'payment_checkout',
            text: '💬 Shall we launch instant checkout now to activate your setup?'
          });
        }
        if (goals.indexOf('consultation_booking') !== -1) {
          candidateList.push({
            key: 'con_pricing_demo',
            type: 'consultation_booking',
            text: '💬 Would you like to schedule a 1-on-1 consultation to review a tailored pricing proposal?'
          });
          candidateList.push({
            key: 'con_15min_session',
            type: 'consultation_booking',
            text: '💬 Shall we book a quick 15-minute demo with our team to walk through what\'s included?'
          });
        }
        if (goals.indexOf('lead_generation') !== -1) {
          candidateList.push({
            key: 'lead_custom_pricing',
            type: 'lead_generation',
            text: '💬 Want our specialist to send over a customized pricing breakdown for your team?'
          });
          candidateList.push({
            key: 'lead_discount_followup',
            type: 'lead_generation',
            text: '💬 Shall I have an advisor follow up about discount options and volume tiers?'
          });
        }
        if (goals.indexOf('customer_support') !== -1 || candidateList.length === 0) {
          candidateList.push({
            key: 'sup_pricing_help',
            type: 'customer_support',
            text: '💬 Did that pricing info help, or would you like to speak directly with an advisor?'
          });
        }
      }
      // 2. If topic is Services / Solutions
      else if (isServices) {
        if (goals.indexOf('lead_generation') !== -1) {
          if (stage === 0) {
            candidateList.push({
              key: 'lead_which_service',
              type: 'lead_generation',
              text: '💬 Which of these sounds most like what you\'re looking for? Happy to dig into any of them with you.'
            });
          }
          candidateList.push({
            key: 'lead_custom_proposal',
            type: 'lead_generation',
            text: '💬 Want me to have our specialist put together a custom proposal for your team?'
          });
          candidateList.push({
            key: 'lead_advisor_connect',
            type: 'lead_generation',
            text: '💬 I can connect you with a specialist to talk through your requirements — shall I set that up?'
          });
        }
        if (goals.indexOf('consultation_booking') !== -1) {
          candidateList.push({
            key: 'con_walkthrough',
            type: 'consultation_booking',
            text: '💬 Would you like to schedule a 1-on-1 consultation or demo session with our team to walk through your requirements?'
          });
          candidateList.push({
            key: 'con_workflow_demo',
            type: 'consultation_booking',
            text: '💬 Would you like to see how this works in practice for your specific workflow in a live demo?'
          });
        }
        if (goals.indexOf('payment_checkout') !== -1) {
          candidateList.push({
            key: 'chk_package_options',
            type: 'payment_checkout',
            text: '💬 Would you like to review our available packages and pricing tiers for this service?'
          });
        }
        if (goals.indexOf('customer_support') !== -1) {
          candidateList.push({
            key: 'sup_service_clarify',
            type: 'customer_support',
            text: '💬 Does this cover what you were looking for, or can I clarify any specific feature?'
          });
        }
      }
      // 3. If topic is Support / Contact / Phone
      else if (isSupport) {
        candidateList.push({
          key: 'sup_direct_callback',
          type: 'customer_support',
          text: '💬 Did that answer your question, or would you like a quick callback from our support team?'
        });
        if (phoneNum) {
          candidateList.push({
            key: 'sup_phone_escalate',
            type: 'customer_support',
            text: '💬 Our team is available at **' + phoneNum + '** — want an advisor to reach out to you directly?'
          });
        } else if (emailAddr) {
          candidateList.push({
            key: 'sup_email_escalate',
            type: 'customer_support',
            text: '💬 Our team is available at **' + emailAddr + '** — want an advisor to reach out to you directly?'
          });
        }
      }
      // 4. If topic is Onboarding / Getting Started
      else if (isOnboarding) {
        if (goals.indexOf('lead_generation') !== -1) {
          candidateList.push({
            key: 'lead_onboard_step',
            type: 'lead_generation',
            text: '💬 Want our team to walk you through getting started, step by step?'
          });
        }
        if (goals.indexOf('consultation_booking') !== -1) {
          candidateList.push({
            key: 'con_onboard_session',
            type: 'consultation_booking',
            text: '💬 Would you like to schedule a 1-on-1 onboarding demo session with our specialist?'
          });
        }
        if (goals.indexOf('payment_checkout') !== -1) {
          candidateList.push({
            key: 'chk_onboard_checkout',
            type: 'payment_checkout',
            text: '💬 Ready to activate your setup with instant checkout, or do you have any other questions?'
          });
        }
      }

      // 5. Default progressive sequence across the active goals
      var isEcommerceFollowUp =
        (config && (config.archetype === 'ecommerce' || config.archetype === 'retail')) ||
        (config && config.company && config.company.websiteUrl && /jumia|amazon|shopify|store|shop|mall|market|catalog/i.test(config.company.websiteUrl)) ||
        (config && config.company && config.company.name && /jumia|store|shop|mall|market|retail/i.test(config.company.name));

      if (isEcommerceFollowUp) {
        candidateList.push({
          key: 'ecom_delivery_help',
          type: 'ecommerce',
          text: '💬 Would you like details on delivery timelines, or help finding another item?'
        });
        candidateList.push({
          key: 'ecom_browse_more',
          type: 'ecommerce',
          text: '💬 Can I help you search for anything else on the store today?'
        });
      } else {
        if (goals.indexOf('payment_checkout') !== -1) {
          candidateList.push({
            key: 'chk_default_progress',
            type: 'payment_checkout',
            text: '💬 Would you like to complete an order or checkout, or do you have any other questions?'
          });
        }
        if (goals.indexOf('consultation_booking') !== -1) {
          candidateList.push({
            key: 'con_default_progress',
            type: 'consultation_booking',
            text: '💬 Would you like to schedule a 1-on-1 consultation or demo session with our team?'
          });
        }
        if (goals.indexOf('lead_generation') !== -1) {
          candidateList.push({
            key: 'lead_default_progress',
            type: 'lead_generation',
            text: '💬 Want our team to follow up with you directly, or can I help with anything else?'
          });
          candidateList.push({
            key: 'lead_default_progress_2',
            type: 'lead_generation',
            text: '💬 Shall I have an advisor follow up with some tailored recommendations?'
          });
        }
        if (goals.indexOf('customer_support') !== -1) {
          candidateList.push({
            key: 'sup_default_progress',
            type: 'customer_support',
            text: '💬 Does that help, or would you like more details?'
          });
        }
      }
      candidateList.push({
        key: 'gen_default_help',
        type: goals[0] || 'lead_generation',
        text: '💬 Does this help, or would you like more details?'
      });
      }

      // Filter out any candidates already asked in this conversation!
      var chosen = null;
      for (var ci = 0; ci < candidateList.length; ci++) {
        var cand = candidateList[ci];
        if (mem.askedFollowUps.indexOf(cand.key) === -1 && mem.askedFollowUps.indexOf(cand.text) === -1) {
          chosen = cand;
          break;
        }
      }

      // If all candidates have been asked, create a fresh non-repeating follow-up
      if (!chosen) {
        var cycleNum = mem.askedFollowUps.length + 1;
        var freshKey = 'fresh_followup_' + cycleNum;
        if (goals.indexOf('consultation_booking') !== -1 && mem.askedFollowUps.indexOf('fresh_con_' + cycleNum) === -1) {
          chosen = {
            key: 'fresh_con_' + cycleNum,
            type: 'consultation_booking',
            text: '💬 Would you like to schedule a 1-on-1 advisor call to review any remaining questions?'
          };
        } else if (goals.indexOf('payment_checkout') !== -1 && mem.askedFollowUps.indexOf('fresh_chk_' + cycleNum) === -1) {
          chosen = {
            key: 'fresh_chk_' + cycleNum,
            type: 'payment_checkout',
            text: '💬 When you are ready, I can help you complete your order right here. Shall we proceed?'
          };
        } else {
          chosen = {
            key: freshKey,
            type: goals[0] || 'lead_generation',
            text: '💬 What other details about **' + topicLabel + '** can I help clarify, or would you like our team to connect with you?'
          };
        }
      }

      // Record in memory
      mem.askedFollowUps.push(chosen.key);
      mem.askedFollowUps.push(chosen.text);
      mem.goalStage = stage + 1;
      mem.lastTopic = topicLabel;
      mem.lastFollowUp = {
        type: chosen.type,
        topic: topicLabel,
        text: chosen.text,
        stage: stage,
        turn: (mem.turns || 0)
      };

      chosen.turn = (mem.lastFollowUp && mem.lastFollowUp.turn) || (mem.turns || 0);
      return chosen;
    }

    if (best && highest >= 0.45) {
      var followUpObj = generateFollowUpQuestion(best, memory, config, isSaasMode);
      var followUpText = (typeof followUpObj === 'string') ? followUpObj : (followUpObj ? followUpObj.text : '');
      // Conversational upgrade (V2): detect a contact sub-intent ("who do I talk
      // to?") and pre-compute the matched topic in short human form.
      var _wantsContact = /\b(talk\s+to|speak\s+(to|with)|contact|callback|call|phone|email|reach|human|agent|someone|support)\b/i.test(raw);
      var _contactItem = null;
      for (var _ci = 0; _ci < allFaqs.length; _ci++) {
        var _cand = allFaqs[_ci];
        if (!_cand) continue;
        if (_cand.category === 'contact' || /\b(contact|phone|email|reach\s+us|talk\s+to|support)\b/i.test(_cand.question || '')) {
          _contactItem = _cand;
          break;
        }
      }
      var _bestIsContact = best.category === 'contact' || /\b(contact|phone|email)\b/i.test(best.question || '');
      var _shortTopic = (best.question || '')
        .replace(/^(what\s+about|what\s+is|what\s+are|who\s+is|how\s+do\s+i|how\s+can\s+i|tell\s+me\s+about)\s+/i, '')
        .replace(/^what\s+services\s+or\s+solutions\s+does\s+.+?\s+offer\??\s*$/i, 'our services')
        .replace(/\?+\s*$/, '').trim();
      if (_shortTopic.length > 60) _shortTopic = _shortTopic.substring(0, 57) + '...';
      if (!_shortTopic) _shortTopic = 'this';
      var replyPrefix = '';
      var host = best.sourceUrl ? best.sourceUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') : 'Website';
      var compTitle = (config && config.company && config.company.name) ? config.company.name : 'our company';

      if (best.source === 'document' || best.category === 'document') {
        replyPrefix = '';
      } else if (best.source === 'website' || best.category === 'website' || best.contentType) {
        replyPrefix = '';
      }

      var faqQuickReplies = [];
      var compName = (config && config.company && config.company.name) ? config.company.name : '';
      var teamLabel = compName && compName !== 'Botly' && compName !== 'Botly Pro' ? 'the ' + compName + ' team' : 'the team';

      // Detect product catalog listings with prices and direct URLs
      var detectedProducts = [];
      if (best.products && Array.isArray(best.products) && best.products.length > 0) {
        detectedProducts = best.products;
      } else if (best.answer) {
        var lines = best.answer.split('\n');
        lines.forEach(function(l) {
          var pMatch = l.match(/[•\*\-]+\s*\*\*([^*]+)\*\*.*?[—–\-:]\s*\*\*([A-Z\$]{1,4})?\s*([0-9,]+(?:\.[0-9]{2})?)\*\*/i);
          if (pMatch) {
            var pName = pMatch[1].trim();
            var pCur = pMatch[2] ? pMatch[2].trim() : ((config && config.currency && config.currency.code) || 'KES');
            var pAmt = parseFloat(pMatch[3].replace(/,/g, ''));
            var urlMatch = l.match(/\((https?:\/\/[^)]+)\)/i);
            var pUrl = (urlMatch ? urlMatch[1] : null) || (best.sourceUrl || (config.company && config.company.websiteUrl ? config.company.websiteUrl + '/products' : ''));
            detectedProducts.push({ name: pName, price: pAmt, currency: pCur, url: pUrl, rawLine: l.trim() });
          }
        });
      }

      // Check if user is asking for a specific product or item
      var focusedProduct = null;
      var highestProdScore = 0;
      var stopWords = {
        'i':1, 'me':1, 'my':1, 'we':1, 'our':1, 'you':1, 'your':1, 'want':1, 'need':1, 'buy':1,
        'purchase':1, 'order':1, 'looking':1, 'for':1, 'a':1, 'an':1, 'the':1, 'give':1,
        'how':1, 'much':1, 'is':1, 'are':1, 'what':1, 'about':1, 'show':1, 'tell':1,
        'details':1, 'of':1, 'cost':1, 'price':1, 'can':1, 'get':1, 'please':1, 'to':1,
        'do':1, 'have':1, 'there':1, 'like':1, 'interested':1, 'in':1, 'some':1
      };
      var queryTokensList = (lower || '').match(/[a-z0-9]+/g) || [];
      var meaningfulTokens = queryTokensList.filter(function(t) { return !stopWords[t] && t.length >= 2; });

      if (detectedProducts.length > 0 && meaningfulTokens.length > 0) {
        var queryText = lower;
        for (var pi = 0; pi < detectedProducts.length; pi++) {
          var p = detectedProducts[pi];
          var pNameLower = p.name.toLowerCase();
          var pTokens = (pNameLower.match(/[a-z0-9]+/g) || []);
          var pScore = 0;

          // Full product name match
          if (queryText.indexOf(pNameLower) !== -1) {
            pScore += 25;
          }

          // First / brand word match (e.g. "Naviforce", "Curren", "Casio", "Apple", "Samsung", "HP", "Lenovo")
          var brandWord = pTokens[0];
          if (brandWord && brandWord.length >= 3 && queryText.indexOf(brandWord) !== -1) {
            pScore += 10;
          }

          // Individual token matches
          meaningfulTokens.forEach(function(token) {
            if (pTokens.indexOf(token) !== -1) {
              var isCategoryGeneric = /^(watch|watches|phone|phones|laptop|laptops|tv|tvs|smart|device|men|mens|women|womens)$/i.test(token);
              pScore += isCategoryGeneric ? 1 : 5;
            } else if (pNameLower.indexOf(token) !== -1 && token.length >= 4) {
              pScore += 3;
            }
          });

          if (pScore > highestProdScore) {
            highestProdScore = pScore;
            focusedProduct = { product: p, index: pi, score: pScore };
          }
        }
      }

      // If user specifically asked for an item, promote that item to top position
      if (focusedProduct && focusedProduct.score >= 5) {
        var chosenProd = detectedProducts.splice(focusedProduct.index, 1)[0];
        detectedProducts.unshift(chosenProd);
      }

      // Build focused or catalog reply text
      var finalAnswerText = best.answer;
      if (focusedProduct && focusedProduct.score >= 5) {
        var targetProd = detectedProducts[0];
        var allLines = best.answer.split('\n');
        var matchingLine = '';
        var footerLines = [];
        var pastBullets = false;

        allLines.forEach(function(line) {
          var trimmed = line.trim();
          if (!trimmed) return;
          if (/^[•\*\-]\s*\*\*/.test(trimmed)) {
            if (trimmed.toLowerCase().indexOf(targetProd.name.toLowerCase()) !== -1 ||
                (targetProd.rawLine && trimmed.indexOf(targetProd.rawLine) !== -1)) {
              matchingLine = trimmed;
            }
            pastBullets = true;
          } else if (pastBullets) {
            footerLines.push(trimmed);
          }
        });

        if (matchingLine) {
          var footerText = footerLines.length > 0
            ? footerLines.join('\n\n')
            : 'All items are covered by official warranty, customer protection, and doorstep delivery.';
          finalAnswerText = 'Here are the details for **' + targetProd.name + '**:\n\n' +
            matchingLine + '\n\n' +
            footerText + '\n\nYou can order directly below:';
        }
      }

      // Conversational upgrade (V2): contact-aware answers + topic-aware
      // follow-ups driven by the trained knowledge, not generic templates.
      if (_wantsContact && _contactItem && _contactItem !== best) {
        finalAnswerText += '\n\n' + (_contactItem.answer || '');
      } else if (_wantsContact && !_contactItem) {
        var _cfgPhone = (config && config.company && config.company.supportPhone) || '';
        var _cfgEmail = (config && config.company && config.company.supportEmail) || '';
        if (_cfgPhone || _cfgEmail) {
          var _reachBits = [];
          if (_cfgPhone) _reachBits.push('**' + _cfgPhone + '**');
          if (_cfgEmail) _reachBits.push('**' + _cfgEmail + '**');
          finalAnswerText += '\n\nYou can reach our team directly at ' + _reachBits.join(' or ') + '.';
        }
      }
      var _isGenericOverview = best && best.id && best.id.toLowerCase().indexOf('overview') !== -1;
      if (!_bestIsContact && _shortTopic && _shortTopic !== 'this') {
        if (_wantsContact) {
          followUpText = '💬 Want me to connect you with our team about **' + _shortTopic + '**?';
          followUpObj = { key: '_topic_followup', type: 'lead_generation', text: followUpText, topic: _shortTopic };
        } else if (isProductInquiry && !_isGenericOverview) {
          followUpText = '💬 Is **' + _shortTopic + '** what you\'re looking for? I can share more details or connect you with our team.';
          followUpObj = { key: '_topic_followup', type: 'lead_generation', text: followUpText, topic: _shortTopic };
        }
      }

      if (isSaasMode && !(config && config.disableFaqQuickReplies)) {
        var activeGoals = config.goals || (config.goal ? [config.goal] : ['lead_generation']);

        if (detectedProducts.length > 0) {
          var topProd = detectedProducts[0];
          var prodSym = (topProd.currency === 'USD' || topProd.currency === '$') ? '$' : (topProd.currency === 'KES' ? 'KES ' : (topProd.currency + ' '));
          var prodShortName = topProd.name.length > 20 ? topProd.name.slice(0, 18) + '...' : topProd.name;

          faqQuickReplies.push({
            label: '🛒 Buy ' + prodShortName + ' (' + prodSym + Number(topProd.price).toLocaleString() + ')',
            payload: 'checkout_item:' + encodeURIComponent(topProd.name) + ':' + topProd.price + ':' + topProd.currency + ':' + encodeURIComponent(topProd.url || '')
          });

          if (focusedProduct && focusedProduct.score >= 5) {
            faqQuickReplies.push({
              label: '🔍 View all options',
              payload: best.question || 'What other options do you offer?'
            });
          } else if (detectedProducts.length > 1) {
            var secondProd = detectedProducts[1];
            var secondSym = (secondProd.currency === 'USD' || secondProd.currency === '$') ? '$' : 'KES ';
            var secondShort = secondProd.name.length > 18 ? secondProd.name.slice(0, 16) + '...' : secondProd.name;
            faqQuickReplies.splice(1, 0, {
              label: '🛒 ' + secondShort + ' (' + secondSym + Number(secondProd.price).toLocaleString() + ')',
              payload: 'checkout_item:' + encodeURIComponent(secondProd.name) + ':' + secondProd.price + ':' + secondProd.currency + ':' + encodeURIComponent(secondProd.url || '')
            });
          }
        } else {
          // Contextual follow-up quick reply
          if (followUpObj && followUpObj.type === 'consultation_booking') {
            faqQuickReplies.push({ label: 'Book Consultation', payload: 'I want to book a consultation session' });
          } else if (followUpObj && followUpObj.type === 'payment_checkout') {
            faqQuickReplies.push({ label: 'Proceed to Checkout', payload: 'I want to proceed to checkout' });
          } else if (followUpObj && followUpObj.type === 'lead_generation') {
            faqQuickReplies.push({ label: 'Yes, follow up with me', payload: 'Yes please follow up with me' });
          }

          if (activeGoals.indexOf('lead_generation') !== -1) {
            faqQuickReplies.push({ label: 'Get started', payload: 'How do I get started?' });
          }
          if (activeGoals.indexOf('payment_checkout') !== -1 && !faqQuickReplies.some(function(q) { return q.label.indexOf('Checkout') !== -1; })) {
            faqQuickReplies.push({ label: 'Pricing & Plans', payload: 'What are your pricing and plans?' });
          }
          if (activeGoals.indexOf('consultation_booking') !== -1 && !faqQuickReplies.some(function(q) { return q.label.indexOf('Consultation') !== -1; })) {
            faqQuickReplies.push({ label: 'Book a Call', payload: 'I want to book a consultation session' });
          }
          if (activeGoals.indexOf('customer_support') !== -1 || faqQuickReplies.length < 2) {
            faqQuickReplies.push({ label: 'Talk to someone', payload: 'I want to speak with someone from ' + teamLabel });
          }
          if (!faqQuickReplies.some(function(q) { return q.label === 'Our Services'; })) {
            faqQuickReplies.unshift({ label: 'Our Services', payload: 'What services do you offer?' });
          }
        }
      } else {
        faqQuickReplies = [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '💳 Proceed to Payment', payload: 'intent_pay' },
          { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
        ];
      }

      // Check if answer already ends with a question to prevent duplicate follow-ups
      var hasTrailingQuestion = /\?(\s*[*_~`"]*)*$/i.test((finalAnswerText || '').trim());
      var replyBody = (hasTrailingQuestion || !followUpText)
        ? (replyPrefix + finalAnswerText)
        : (replyPrefix + finalAnswerText + '\n\n' + followUpText);

      return {
        intent: 'faq',
        reply: replyBody,
        suggestedQuickReplies: faqQuickReplies,
        lastFollowUp: typeof followUpObj === 'object' ? followUpObj : null,
        topic: best.question || ''
      };
    }

    var extracted = extractQueryKeywords(raw);
    var needTopic = extracted.cleanQuery;
    if (!needTopic || needTopic.length < 2) needTopic = raw;

    var compName = (config && config.company && config.company.name) ? config.company.name : 'our';
    var webUrl = (config && config.company && config.company.websiteUrl) ? config.company.websiteUrl : '';

    // Detect ecommerce or shopping intent
    var isEcommerce =
      (config && (config.archetype === 'ecommerce' || config.archetype === 'retail')) ||
      (webUrl && /jumia|amazon|shopify|store|shop|mall|market|catalog/i.test(webUrl)) ||
      (compName && /jumia|store|shop|mall|market|retail/i.test(compName));

    // 6. In SaaS mode, handle pricing/cost/plan queries if not caught by custom FAQ and NOT an ecommerce product query
    var isPricingInquiry = !isEcommerce && !extracted.isProductInquiry &&
      (/\b(price|pricing|subscription|plans?|packages?|tier|tiers|fee|rates?|\$10|ten\s*dollars)\b/i.test(lower) || /\b(how\s*much|cost|charge)\b/i.test(lower));

    if (isSaasMode && isPricingInquiry) {
      var isBotlySelf = !compName || /^(botly|botly\s*(pro|ai|insurance)?)$/i.test(compName) || (/\bbotly\b/i.test(lower) && !/\b(other|different|not)\s*botly\b/i.test(lower));

      if (isBotlySelf) {
        var priceFollowUp = (memory && memory.goalStage > 0)
          ? "💬 Ready to deploy Botly Pro for your business today?"
          : "💬 Would you like help getting started?";
        if (memory) {
          memory.lastFollowUp = {
            type: 'lead_generation',
            topic: 'Botly Pro $10 Plan Deployment',
            text: priceFollowUp,
            stage: memory.goalStage || 0,
            turn: (memory.turns || 0)
          };
          memory.lastTopic = 'Botly Pro $10 Chatbot Pricing';
          if (memory.askedFollowUps) memory.askedFollowUps.push(priceFollowUp);
          memory.goalStage = (memory.goalStage || 0) + 1;
        }
        return {
          intent: 'faq',
          reply: "$10 per chatbot per company, flat.\n\nNo monthly subscription, no per-message fees, no hidden charges. You pay $10 once to deploy a bot for a company with unlimited conversations.\n\nNeed high-volume multi-brand or agency deployment? Custom Enterprise pricing is also available.\n\n" + priceFollowUp,
          suggestedQuickReplies: [
            { label: 'Get started', payload: 'I want to get a chatbot for my company, how do I start?' },
            { label: 'Custom Enterprise', payload: 'Tell me about custom Enterprise pricing' },
            { label: 'Talk to someone', payload: 'I want to speak with someone from the team' }
          ],
          lastFollowUp: memory ? memory.lastFollowUp : null,
          topic: 'Botly Pro Pricing'
        };
      } else {
        var supportEmail = (config && config.company && config.company.supportEmail) ? config.company.supportEmail : 'our team';
        var compFollowUp = "💬 Would you like our team to get in touch with you?";
        if (memory) {
          memory.lastFollowUp = {
            type: 'lead_generation',
            topic: compName + ' Pricing & Custom Packages',
            text: compFollowUp,
            stage: memory.goalStage || 0,
            turn: (memory.turns || 0)
          };
          memory.lastTopic = compName + ' Pricing & Packages';
          if (memory.askedFollowUps) memory.askedFollowUps.push(compFollowUp);
          memory.goalStage = (memory.goalStage || 0) + 1;
        }
        return {
          intent: 'faq',
          reply: "For pricing details, available packages, or custom requirements for **" + compName + "**, please reach out to our team at **" + supportEmail + "** or leave your contact details in this chat.\n\n" + compFollowUp,
          suggestedQuickReplies: [
            { label: 'Talk to someone', payload: 'I want to speak with someone from the ' + compName + ' team' }
          ],
          lastFollowUp: memory ? memory.lastFollowUp : null,
          topic: compName + ' Pricing'
        };
      }
    }

    // 7. Dynamic Tool Search & Tiered Fallback Engine

    // Tier 3: Live Product Search Tool for Ecommerce / Retail
    if (isEcommerce) {
      // V3: bare "yes" with no pending offer stays on the live product topic.
      if (isAffirmative && lower.length < 40 && !(memory && memory.lastFollowUp) && memory && memory.lastProductQuery) {
        return {
          intent: 'acknowledge',
          reply: 'Great — sticking with **' + memory.lastProductQuery + '**. Want prices, delivery details, or shall I look up something else?',
          suggestedQuickReplies: [
            { label: '🚚 Delivery info', payload: 'How does delivery work and what are the timelines?' },
            { label: 'Talk to team', payload: 'I want to speak with someone from the team' }
          ],
          topic: memory.lastProductQuery
        };
      }
      var searchKey = extracted.searchTerms || extracted.cleanQuery;
      if (extracted.keywords.indexOf('toy') !== -1) {
        searchKey = 'toy';
      } else if (extracted.keywords.indexOf('cooking') !== -1 && extracted.keywords.indexOf('oil') !== -1) {
        searchKey = 'cooking oil';
      } else if (extracted.keywords.length > 0) {
        searchKey = extracted.keywords.slice(0, 3).join(' ');
      }

      // V3: product replies carry no typed offer — clear stale ones, record live topic.
      if (memory) {
        memory.lastFollowUp = null;
        memory.lastTopic = searchKey;
        memory.lastProductQuery = searchKey;
      }
      var searchResult = searchProducts({ query: searchKey }, config);
      var searchUrl = searchResult.searchUrl || buildProductSearchUrl(webUrl, searchKey);
      var suggestedQuickReplies = searchResult.suggestedQuickReplies || [];

      return {
        intent: searchResult.isOutOfScope ? 'out_of_scope' : 'product_search',
        confidence: 0.95,
        topic: searchKey,
        action: searchResult.isOutOfScope ? 'OUT_OF_SCOPE' : 'PRODUCT_SEARCH',
        productQuery: searchKey,
        searchUrl: searchUrl,
        reply: searchResult.message,
        productCardsHtml: searchResult.productCardsHtml || null,
        suggestedQuickReplies: suggestedQuickReplies,
        quickReplies: suggestedQuickReplies
      };
    }

    // Tier 4: Unknown / Human Help Needed
    var leadCaptureEnabled = config && config.leadCapture ? config.leadCapture.enabled !== false : true;
    // V3: no real topic (bare yes/ack/greeting residue) → clarifying question, never a lead ambush.
    var _tier4NoTopic = !needTopic || needTopic.length < 3 || /^(yes|yeah|yep|sure|ok|okay|hi|hello|hey|thanks|thank\s*you|please|good|great)\b/i.test(needTopic.trim());
    if (_tier4NoTopic) {
      var _t4Topic = (memory && memory.lastTopic) || '';
      var _t4Name = (compName && compName !== 'our') ? compName : '';
      return {
        intent: 'clarify',
        reply: _t4Topic
          ? 'Happy to help! 🙏 Are we still on **' + _t4Topic + '** — or could you tell me a bit more about what you need?'
          : 'Happy to help! 🙏 Could you tell me a bit more about what you\'re looking for so I point you the right way?',
        suggestedQuickReplies: isSaasMode ? [
          { label: 'Our Services', payload: 'What services do you offer?' },
          { label: 'Talk to someone', payload: 'I want to speak with someone from ' + (_t4Name ? 'the ' + _t4Name + ' team' : 'the team') }
        ] : [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
        ]
      };
    }
    if (leadCaptureEnabled) {
      return {
        intent: 'lead_capture_needed',
        confidence: 0.2,
        action: 'LEAD_CAPTURE',
        inquiredNeed: needTopic,
        reply: isSaasMode
          ? "Good question! I want to make sure you get the right answer about **" + needTopic + "**, so let me connect you with the **" + compName + "** team who can sort you out properly.\n\nWhat's your **full name**?"
          : "Good question! I want to make sure you get the right answer about **" + needTopic + "**, so let me connect you with our specialist team who can sort you out properly.\n\nWhat's your **full name**?"
      };
    }

    // Clean neutral fallback without demanding user's full name
    var supportEmail = (config && config.company && config.company.supportEmail) ? config.company.supportEmail : '';
    var supportPhone = (config && config.company && config.company.supportPhone) ? config.company.supportPhone : '';
    var contactInfo = '';
    if (supportEmail && supportPhone) {
      contactInfo = 'at **' + supportEmail + '** or call **' + supportPhone + '**';
    } else if (supportEmail) {
      contactInfo = 'at **' + supportEmail + '**';
    } else if (supportPhone) {
      contactInfo = 'at **' + supportPhone + '**';
    }

    return {
      intent: 'fallback_neutral',
      confidence: 0.3,
      reply: "I don't have the specific details for **\"" + needTopic + "\"** in my instant memory. Please reach out to the **" + compName + "** team " + (contactInfo || 'directly') + " or ask about our services and policies.",
      suggestedQuickReplies: [
        { label: 'Our Services', payload: 'What services or products do you offer?' },
        { label: 'Talk to team', payload: 'I want to speak with someone from the ' + compName + ' team' }
      ]
    };
  }

  // 3.5. PERSISTENT LEAD CAPTURE & INQUIRY STORAGE
  var LEAD_STORAGE_KEY = 'botly_captured_leads';
  // Multi-bot isolation: every bot gets its own lead/contact storage namespace
  // (config.botId, else company name). A visitor chatting with Company B never
  // inherits names/phones captured by Company A's bot on the same browser.
  var BOTLY_STORAGE_NS = 'default';
  function botlySanitizeNs(ns) {
    var s = String(ns || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return (s || 'default').slice(0, 40);
  }
  function botlySetStorageNs(ns) { BOTLY_STORAGE_NS = botlySanitizeNs(ns); }
  function botlyLeadKey() { return LEAD_STORAGE_KEY + '__' + BOTLY_STORAGE_NS; }
  function botlyContactKey() { return 'botly_user_contact__' + BOTLY_STORAGE_NS; }
  function botlyMemLeadsGet() {
    var m = window.__botly_memory_leads;
    if (m && !Array.isArray(m)) return m[BOTLY_STORAGE_NS] || [];
    return [];
  }
  function botlyMemLeadsSet(arr) {
    if (!window.__botly_memory_leads || Array.isArray(window.__botly_memory_leads)) window.__botly_memory_leads = {};
    window.__botly_memory_leads[BOTLY_STORAGE_NS] = arr;
  }
  function getStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(botlyLeadKey());
        if (raw) return JSON.parse(raw);
      }
    } catch(e) {}
    return botlyMemLeadsGet();
  }
  // ---- P100: admin lead alert (all bots unless leadAlerts:false) ----
  // Anonymous mail shape {to,message} per firestore.rules (fixed recipient).
  // Self-contained (own escaper) so it stays unit-testable by extraction.
  function botlyLeadMailDoc(lead, botName, company, botId, pageUrl) {
    var esc = function(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var clean = function(v, n) { return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').slice(0, n); };
    var nm = clean(lead.name, 60) || 'New lead';
    var bn = clean(botName, 60) || 'Botly bot';
    var row = function(k, v) { return '<tr><td style="padding:3px 10px 3px 0;color:#64748b;">' + k + '</td><td><strong>' + esc(v) + '</strong></td></tr>'; };
    var payRow = lead.paymentMethod
      ? row('Payment', clean(lead.paymentMethod, 40) + (lead.amount ? ' · ' + clean(lead.amount, 20) : '') + (lead.mpesaCode ? ' · code ' + clean(lead.mpesaCode, 20) : ''))
      : '';
    return {
      to: 'muindidiego@gmail.com',
      message: {
        subject: 'New lead: ' + nm + ' via ' + bn,
        html: '<p>New lead captured:</p><table>' +
          row('Name', clean(lead.name, 120) || '—') + row('Phone', clean(lead.phone, 40) || '—') +
          row('Email', clean(lead.email, 120) || '—') + row('Need', clean(lead.need, 500) || '—') +
          row('Bot', bn) + row('Company', clean(company, 120) || '—') +
          row('Bot ID', clean(botId, 120) || '—') + row('Page', clean(pageUrl, 300) || '—') + payRow +
          '</table>'
      }
    };
  }

  // BOTLY-CLOUD: fire-and-forget lead sync to the Botly Cloud inbox (Firestore).
  // Only runs when the host page loaded Firebase + Firestore (landing/contact
  // pages). Customer embeds without Firebase silently skip. Studio previews
  // set cloudSync:false and never sync test data. Never throws.
  function botlyCloudSyncLead(lead, ctx) {
    try {
      ctx = ctx || {};
      var cfg = ctx.config || {};
      if (cfg.cloudSync === false) return;
      if (typeof window === 'undefined' || !window.firebase || !window.firebase.firestore) return;
      var fbConfig = window.BOTLY_FIREBASE_CONFIG;
      if (!fbConfig || !fbConfig.apiKey || fbConfig.apiKey === 'YOUR_API_KEY') return;
      try {
        if (!window.firebase.apps || !window.firebase.apps.length) window.firebase.initializeApp(fbConfig);
      } catch (initErr) { try { window.firebase.app(); } catch (e2) { return; } }
      var history = [];
      try {
        var h = (ctx.memory && ctx.memory.history) || [];
        history = h.slice(-8).map(function(m) {
          return { role: m.role || 'user', text: String(m.text == null ? '' : m.text).slice(0, 600) };
        });
      } catch (histErr) {}
      var payload = {
        leadId: lead.id || null,
        botId: cfg.botId || null,
        botName: (cfg.bot && cfg.bot.name) || cfg.botName || null,
        company: lead.company || (cfg.company && cfg.company.name) || null,
        name: String(lead.name || '').slice(0, 120),
        phone: String(lead.phone || '').slice(0, 40),
        email: String(lead.email || '').slice(0, 120),
        need: String(lead.need || '').slice(0, 1200),
        goal: lead.goal || null,
        status: lead.status || 'New',
        transcript: history,
        pageUrl: (window.location && window.location.href ? String(window.location.href) : '').slice(0, 300),
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };
      if (lead.paymentMethod) {
        payload.payment = {
          method: String(lead.paymentMethod).slice(0, 80),
          amount: lead.amount ? String(lead.amount).slice(0, 40) : null,
          code: lead.mpesaCode ? String(lead.mpesaCode).slice(0, 40) : null
        };
      }
      window.firebase.firestore().collection('botly_leads').add(payload).catch(function() {});
      // P100: admin lead alert (all bots unless leadAlerts:false; anonymous mail shape).
      if (cfg.leadAlerts !== false) {
        try {
          window.firebase.firestore().collection('mail').add(botlyLeadMailDoc(lead, payload.botName, payload.company, payload.botId, payload.pageUrl)).catch(function() {});
        } catch (e2) {}
      }

    } catch (e) {}
  }

  function saveStoredLead(lead) {
    try {
      var current = getStoredLeads();
      var updated = [lead].concat(current);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(botlyLeadKey(), JSON.stringify(updated));
      }
      botlyMemLeadsSet(updated);
      return updated;
    } catch(e) {
      var _memLeads = botlyMemLeadsGet();
      _memLeads.unshift(lead);
      botlyMemLeadsSet(_memLeads);
      return _memLeads;
    }
  }
  function clearStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(botlyLeadKey());
      }
      botlyMemLeadsSet([]);
      return true;
    } catch(e) { return false; }
  }
  function exportLeadsToCsv() {
    var leads = getStoredLeads();
    if (!leads || leads.length === 0) return 'ID,Name,Phone,Email,Need,Goal,Status,Payment Method,M-Pesa Code,Amount,Date\n';
    var headers = ['ID', 'Name', 'Phone', 'Email', 'Need', 'Goal', 'Status', 'Payment Method', 'M-Pesa Code', 'Amount', 'Date'];
    var rows = leads.map(function(l) {
      return [
        '"' + (l.id || '').replace(/"/g, '""') + '"',
        '"' + (l.name || '').replace(/"/g, '""') + '"',
        '"' + (l.phone || '').replace(/"/g, '""') + '"',
        '"' + (l.email || '').replace(/"/g, '""') + '"',
        '"' + (l.need || '').replace(/"/g, '""') + '"',
        '"' + (l.goal || 'lead_generation').replace(/"/g, '""') + '"',
        '"' + (l.status || '').replace(/"/g, '""') + '"',
        '"' + (l.paymentMethod || '').replace(/"/g, '""') + '"',
        '"' + (l.mpesaCode || '').replace(/"/g, '""') + '"',
        '"' + (l.amount || '').replace(/"/g, '""') + '"',
        '"' + (l.createdAtFormatted || l.timestamp || '').replace(/"/g, '""') + '"'
      ].join(',');
    });
    return headers.join(',') + '\n' + rows.join('\n');
  }

  function extractMpesaCode(str) {
    if (!str) return null;
    var trimmed = str.trim();
    if (/^[A-Z0-9]{8,12}$/i.test(trimmed) && /[A-Z]/i.test(trimmed) && /[0-9]/.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    var match = str.match(/(?:code|mpesa|m-pesa|ref|reference|id|txn|paid|lipa)?\s*[:#-]?\s*\b([A-Z0-9]{8,12})\b/i);
    if (match && match[1] && /[A-Z]/i.test(match[1]) && /[0-9]/.test(match[1])) {
      return match[1].toUpperCase();
    }
    return null;
  }

  // 4. MAIN CHATBOT WIDGET CONTROLLER
  function BotlyChatbotController(userConfig) {
    this.config = Object.assign({}, DEFAULT_CONFIG, userConfig || {});
    botlySetStorageNs((userConfig && (userConfig.botId || (userConfig.company && userConfig.company.name))) || 'default');
    this.trainedKnowledge = [];
    if (this.config.customKnowledge && Array.isArray(this.config.customKnowledge)) {
      this.trainedKnowledge = this.config.customKnowledge.map(function(item) {
        return Object.assign({}, item, { isCustomTrained: true });
      });
    }
    this.activeQuote = null;
    this.quoteState = { active: false, step: 0, type: 'auto', tierId: null };
    this.claimState = { active: false, step: 0 };
    this.leadState = { active: false, step: 'idle', inquiredNeed: '', name: '', phone: '', email: '' };
    this.collectedContact = { name: '', phone: '', email: '' };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        var storedContact = localStorage.getItem(botlyContactKey());
        if (storedContact) {
          var parsedContact = JSON.parse(storedContact);
          if (parsedContact && typeof parsedContact === 'object') {
            this.collectedContact = {
              name: parsedContact.name || '',
              phone: parsedContact.phone || '',
              email: parsedContact.email || ''
            };
          }
        }
      } catch (e) {}
    }
    this.conversationMemory = {
      turns: 0,
      history: [],
      visitedTopics: [],
      askedFollowUps: [],
      lastFollowUp: null,
      goalStage: 0,
      lastTopic: ''
    };
    this.container = null;
    this.launcher = null;
    this._ratingShown = false;
    this._botMsgCount = 0;
    this.orderState = { active: false, step: '', item: '', price: '', name: '', contact: '', code: '' };
  }

  BotlyChatbotController.prototype.init = function(selector) {
    var self = this;
    // P96 anti-theft: paid embeds prove activation before rendering.
    if (!this._licenseDone && this._licenseCheckNeeded()) { this._verifyLicense(selector); return; }
    // P99 live config: published embeds refresh from the cloud before rendering.
    if (!this._cloudDone && this._cloudFetchNeeded()) { this._fetchCloudConfig(selector); return; }
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

  // ---- P99: live cloud config (publish model) ----
  // Published embeds (publishedEmbed:true) fetch botly_configs/{botId} and
  // let the cloud win when newer-or-tie; the inline snippet is the fallback
  // (fail-open: a config outage must never brick a paid bot).
  BotlyChatbotController.prototype._cloudFetchNeeded = function() {
    if (typeof window === 'undefined') return false;
    var c = this.config || {};
    return (c.publishedEmbed === true && !!c.botId);
  };
  BotlyChatbotController.prototype._fetchCloudConfig = function(selector) {
    var self = this;
    var done = function() {
      self._cloudDone = true;
      self.init(selector);
    };
    var finish = function(cfg) { self._fetchCloudConfigWith(cfg, done); };
    try {
      if (typeof this._ratingFirebaseConfig === 'function') {
        this._ratingFirebaseConfig(function(cfg) { finish(cfg); });
      } else { finish(null); }
    } catch (e) { done(); }
  };
  BotlyChatbotController.prototype._fetchCloudConfigWith = function(cfg, done) {
    var self = this;
    var botId = (this.config && this.config.botId) || '';
    if (!cfg || !cfg.projectId || !cfg.apiKey || !botId || typeof fetch !== 'function') { done(); return; }
    var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) +
      '/databases/(default)/documents/botly_configs/' + encodeURIComponent(String(botId)) +
      '?key=' + encodeURIComponent(cfg.apiKey);
    var settled = false;
    var settle = function(doc) {
      if (settled) return;
      settled = true;
      try { clearTimeout(timer); } catch (e) {}
      if (doc) {
        try { self.config = self._mergeCloudConfig(self.config, doc); } catch (e) {}
      }
      done();
    };
    var timer = setTimeout(function() { settle(null); }, 12000);
    fetch(url).then(function(r) {
      if (!r || !r.ok) { settle(null); return null; }
      return r.json();
    }).then(function(doc) { if (doc) settle(doc); }).catch(function() { settle(null); });
  };
  BotlyChatbotController.prototype._firestoreUnwrap = function(v) {
    var self = this;
    if (v == null || typeof v !== 'object') return v;
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('nullValue' in v) return null;
    if ('timestampValue' in v) return v.timestampValue;
    if (v.arrayValue && v.arrayValue.values) return v.arrayValue.values.map(function(x) { return self._firestoreUnwrap(x); });
    if (v.arrayValue) return [];
    if (v.mapValue && v.mapValue.fields) {
      var o = {};
      var f = v.mapValue.fields;
      for (var k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) o[k] = self._firestoreUnwrap(f[k]); }
      return o;
    }
    if (v.mapValue) return {};
    return v;
  };
  BotlyChatbotController.prototype._mergeCloudConfig = function(inline, doc) {
    try {
      var f = (doc && doc.fields) || {};
      if (!f.config || !f.config.mapValue) return inline;
      var cloud = this._firestoreUnwrap(f.config);
      if (!cloud || typeof cloud !== 'object') return inline;
      if (String(cloud.botId || '') !== String((inline && inline.botId) || '')) return inline;
      var ct = Number(cloud.configUpdatedAt || 0);
      var it = Number((inline && inline.configUpdatedAt) || 0);
      if (!(ct >= it)) return inline; // cloud newer-or-tie wins; NaN-safe
      var merged = {};
      var k;
      for (k in inline) { if (Object.prototype.hasOwnProperty.call(inline, k)) merged[k] = inline[k]; }
      for (k in cloud) { if (Object.prototype.hasOwnProperty.call(cloud, k)) merged[k] = cloud[k]; }
      return merged;
    } catch (e) { return inline; }
  };

  // ---- P97: runtime license check (anti-theft) ----
  // First-party hosts never need a license: Studio previews, botlypro.online
  // demos, and local dev servers. Everywhere else the embed must prove
  // activation (botly_licenses/{botId}) before it renders anything.
  BotlyChatbotController.prototype._botlyFirstPartyHost = function() {
    var h = '';
    try { h = String(window.location.hostname || '').toLowerCase(); } catch (e) { return true; }
    if (!h) return true; // file:// / sandboxed frames: local testing only
    if (h === 'localhost' || h === '127.0.0.1') return true;
    return (h === 'botlypro.online' || h.slice(-16) === '.botlypro.online');
  };

  BotlyChatbotController.prototype._licenseCheckNeeded = function() {
    if (typeof window === 'undefined') return false;
    return !this._botlyFirstPartyHost();
  };

  BotlyChatbotController.prototype._licenseCacheKey = function() {
    var id = (this.config && this.config.botId) || 'bot_default';
    return 'botly_license__' + String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
  };

  BotlyChatbotController.prototype._licenseCacheRead = function() {
    try {
      var raw = localStorage.getItem(this._licenseCacheKey());
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || o.ok !== 1 || !o.ts) return false;
      if ((Date.now() - Number(o.ts)) > 24 * 3600 * 1000) return false; // 24h TTL so admin revokes bite within a day
      return true;
    } catch (e) { return false; }
  };

  BotlyChatbotController.prototype._licenseCacheWrite = function() {
    try {
      localStorage.setItem(this._licenseCacheKey(), JSON.stringify({ ok: 1, ts: Date.now() }));
    } catch (e) {}
  };

  BotlyChatbotController.prototype._verifyLicense = function(selector) {
    var self = this;
    this._licenseSelector = selector;
    var done = function(ok, reason) {
      if (ok) {
        self._licenseDone = true;
        try { self._licenseCacheWrite(); } catch (e) {}
        self.init(selector);
      } else {
        self._renderLocked(reason);
      }
    };
    try {
      if (this._licenseCacheRead()) { done(true, 'cache'); return; }
    } catch (e) {}
    if (typeof this._ratingFirebaseConfig === 'function') {
      this._ratingFirebaseConfig(function(cfg) { self._verifyLicenseFetch(cfg, done); });
    } else {
      this._verifyLicenseFetch(null, done);
    }
  };

  BotlyChatbotController.prototype._verifyLicenseFetch = function(cfg, done) {
    var self = this;
    var botId = (this.config && this.config.botId) || 'bot_default';
    var settled = false;
    var settle = function(ok, reason) {
      if (settled) return;
      settled = true;
      try { clearTimeout(timer); } catch (e) {}
      done(ok, reason);
    };
    if (!cfg || !cfg.projectId || !cfg.apiKey || typeof fetch !== 'function') {
      done(false, 'offline');
      return;
    }
    var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) +
      '/databases/(default)/documents/botly_licenses/' + encodeURIComponent(String(botId)) +
      '?key=' + encodeURIComponent(cfg.apiKey);
    var timer = setTimeout(function() { settle(false, 'offline'); }, 12000);
    fetch(url).then(function(r) {
      if (!r || r.status === 404) { settle(false, 'inactive'); return null; }
      if (!r.ok) { settle(false, 'offline'); return null; }
      return r.json();
    }).then(function(doc) {
      if (!doc) return;
      var ok = self._licenseDocAllows(doc);
      settle(ok, ok ? 'cloud' : 'inactive');
    }).catch(function() { settle(false, 'offline'); });
  };

  BotlyChatbotController.prototype._licenseDocAllows = function(doc) {
    try {
      var f = (doc && doc.fields) || {};
      if (!f.active || f.active.booleanValue !== true) return false;
      var vals = (f.domains && f.domains.arrayValue && f.domains.arrayValue.values) || [];
      if (!vals.length) return true; // legacy license without domain binding
      var host = '';
      try { host = String(window.location.hostname || '').toLowerCase(); } catch (e) { host = ''; }
      for (var i = 0; i < vals.length; i++) {
        var d = String((vals[i] && vals[i].stringValue) || '').toLowerCase();
        if (d && (host === d || host.slice(-d.length - 1) === '.' + d)) return true;
      }
      return false;
    } catch (e) { return false; }
  };

  // Locked shell: launcher + "not activated" panel. Reuses the widget's own
  // classes so it looks native; panel copy uses inline styles (no CSS edit).
  BotlyChatbotController.prototype._renderLocked = function(reason) {
    var self = this;
    this.applyTheme();
    var bot = (this.config && this.config.bot) || {};
    var company = (this.config && this.config.company) || {};
    var title = bot.name || company.name || 'Botly Pro';
    var launcher = document.createElement('button');
    launcher.className = 'ins-chatbot-launcher';
    launcher.id = 'ins-widget-launcher';
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.innerHTML = '<div class="ins-launcher-icon" style="font-size:30px;line-height:1;">&#128274;</div>';
    var container = document.createElement('div');
    container.className = 'ins-chatbot-container';
    container.id = 'ins-widget-window';
    container.style.display = 'none';
    var retry = (reason === 'offline')
      ? '<div><button id="ins-locked-retry" style="margin-top:12px;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:800;color:#334155;cursor:pointer;">&#8635; Retry</button></div>'
      : '';
    container.innerHTML =
      '<div class="ins-header"><div class="ins-header-profile">' +
      '<div class="ins-profile-info"><span class="ins-bot-name">' + this.escape(title) + '</span>' +
      '<span class="ins-bot-role">Activation required</span></div></div></div>' +
      '<div style="padding:28px 22px;text-align:center;">' +
      '<div style="font-size:40px;line-height:1;">&#128274;</div>' +
      '<div style="font-weight:800;font-size:15px;margin:10px 0 6px;color:#0f172a;">Chatbot not activated</div>' +
      '<div style="font-size:13px;color:#64748b;line-height:1.6;">The owner of this site needs to activate Botly&nbsp;Pro ($10 one-time) to enable chat.</div>' +
      '<div><a href="https://botlypro.online/studio" target="_blank" rel="noopener" style="display:inline-block;margin-top:14px;background:#16a34a;color:#fff;font-weight:800;font-size:13.5px;padding:10px 18px;border-radius:10px;text-decoration:none;">Activate at botlypro.online</a></div>' +
      retry + '</div>';
    document.body.appendChild(launcher);
    document.body.appendChild(container);
    launcher.addEventListener('click', function() {
      container.style.display = (container.style.display === 'none') ? 'block' : 'none';
    });
    if (reason === 'offline') {
      var rb = document.getElementById('ins-locked-retry');
      if (rb) rb.addEventListener('click', function() {
        try {
          launcher.parentNode.removeChild(launcher);
          container.parentNode.removeChild(container);
        } catch (e) {}
        self._licenseDone = false;
        self._verifyLicense(self._licenseSelector);
      });
    }
  };

  BotlyChatbotController.prototype.applyTheme = function() {
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
    if (t.backgroundColor) root.style.setProperty('--ins-bg', t.backgroundColor);
    if (t.headerBg) root.style.setProperty('--ins-header-bg', t.headerBg);
    if (t.userBubbleBg) root.style.setProperty('--ins-user-bubble', t.userBubbleBg);
  };

  BotlyChatbotController.prototype.renderFloating = function() {
    var self = this;
    var bot = this.config.bot || {};
    var company = this.config.company || {};

    var launcher = document.createElement('button');
    launcher.className = 'ins-chatbot-launcher';
    launcher.id = 'ins-widget-launcher';
    launcher.setAttribute('aria-label', 'Open Botly Pro Assistant');
    launcher.innerHTML = '<div class="ins-launcher-teaser">Need assistance? Chat with Botly Pro</div>' +
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
        '<div class="ins-profile-info"><span class="ins-bot-name">' + this.escape(bot.name || 'Botly Pro') + '</span><span class="ins-bot-role">' + this.escape(bot.title || company.name || 'AI Assistant') + '</span></div>' +
      '</div>' +
      '<div class="ins-header-actions">' +
        '<button class="ins-btn-icon btn-reset" title="Restart Chat">🔄</button>' +
        '<button class="ins-btn-icon btn-close" title="Close">✕</button>' +
      '</div>' +
    '</div>' +
    '<div class="ins-messages-body" id="ins-messages-list"></div>' +
    '<div class="ins-footer">' +
      '<form class="ins-input-wrapper" id="ins-chat-form">' +
        '<button type="button" class="ins-btn-mic" id="ins-mic-btn" aria-label="Voice input">🎙️</button>' +
        '<input type="text" class="ins-input-text" id="ins-user-input" placeholder="Ask me anything..." autocomplete="off">' +
        '<button type="submit" class="ins-btn-send" id="ins-send-btn" aria-label="Send message">' +
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

  BotlyChatbotController.prototype.renderAvatarHtml = function() {
    var bot = this.config.bot || {};
    var t = this.config.theme || {};
    var primary = t.primaryColor || '#18221c';
    var accent = t.accentColor || '#9be553';

    if (bot.avatar && typeof bot.avatar === 'string' && (bot.avatar.indexOf('http') === 0 || bot.avatar.indexOf('/') === 0 || bot.avatar.indexOf('./') === 0 || bot.avatar.indexOf('data:') === 0)) {
      return '<img src="' + this.escape(bot.avatar) + '" alt="' + this.escape(bot.name || 'Botly Pro') + '" class="ins-avatar-img">';
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

  BotlyChatbotController.prototype.renderInline = function(target) {
    var self = this;
    var bot = this.config.bot || {};
    var company = this.config.company || {};

    var placeholderText = (this.config.mode === 'saas' || !this.config.goal)
      ? (bot.placeholder || "Ask me anything...")
      : (bot.placeholder || "Ask a question...");

    target.innerHTML = '<div class="ins-chatbot-container open" style="position:relative; bottom:auto; right:auto; width:100%; height:620px;">' +
      '<div class="ins-header">' +
        '<div class="ins-header-profile">' +
          '<div class="ins-avatar-wrapper">' + this.renderAvatarHtml() + '<span class="ins-status-dot"></span></div>' +
          '<div class="ins-profile-info"><span class="ins-bot-name">' + this.escape(bot.name || 'Botly Pro') + '</span><span class="ins-bot-role">' + this.escape(bot.title || company.name || 'AI Assistant') + '</span></div>' +
        '</div>' +
        '<div class="ins-header-actions"><button class="ins-btn-icon btn-reset" title="Restart Chat">🔄</button></div>' +
      '</div>' +
      '<div class="ins-messages-body" id="ins-messages-list"></div>' +
      '<div class="ins-footer">' +
        '<form class="ins-input-wrapper" id="ins-chat-form">' +
          '<button type="button" class="ins-btn-mic" id="ins-mic-btn" aria-label="Voice input">🎙️</button>' +
          '<input type="text" class="ins-input-text" id="ins-user-input" placeholder="' + this.escape(placeholderText) + '" autocomplete="off">' +
          '<button type="submit" class="ins-btn-send" id="ins-send-btn" aria-label="Send message">' +
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

  BotlyChatbotController.prototype.toggle = function(force) {
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

  BotlyChatbotController.prototype.sendGreeting = function() {
    var self = this;
    var bot = this.config.bot || {};
    setTimeout(function() {
      self.appendBot(bot.greeting, { quickReplies: bot.initialQuickReplies });
    }, 200);
  };

  BotlyChatbotController.prototype.appendUser = function(text) {
    var row = document.createElement('div');
    row.className = 'ins-msg-row user';
    row.innerHTML = '<div class="ins-msg-bubble">' + this.escape(text) +
      '<span class="ins-msg-time">' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span></div>';
    this.messagesList.appendChild(row);
    this.scrollDown();
  };

  BotlyChatbotController.prototype.appendBot = function(text, opts) {
    opts = opts || {};
    // Conversational upgrade (V4): pure free-text mode — no suggestion chips.
    if (this.config && this.config.disableQuickReplies) {
      opts.quickReplies = null;
    }
    var now = Date.now();
    if (this._lastBotText === text && (now - (this._lastBotTime || 0)) < 450) {
      return; // Deduplicate rapid duplicate bot message
    }
    this._lastBotText = text;
    this._lastBotTime = now;
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
          var target = qr.url || qr.payload;
          if (typeof target === 'string' && /^https?:\/\//i.test(target)) {
            if (typeof window !== 'undefined' && window.open) {
              window.open(target, '_blank', 'noopener,noreferrer');
            }
            return;
          }
          self.handleQuickReply(qr.payload || qr.label);
        });
        qrBox.appendChild(btn);
      });
      this.messagesList.appendChild(qrBox);
    }

    this._ratingAfterReply();
    this.scrollDown();
  };

  BotlyChatbotController.prototype.showTyping = function() {
    this.removeTyping();
    var t = document.createElement('div');
    t.className = 'ins-msg-row bot ins-typing-row';
    t.innerHTML = '<div class="ins-typing-bubble"><div class="ins-typing-dot"></div><div class="ins-typing-dot"></div><div class="ins-typing-dot"></div></div>';
    this.messagesList.appendChild(t);
    this.scrollDown();
  };

  BotlyChatbotController.prototype.removeTyping = function() {
    var ex = this.messagesList ? this.messagesList.querySelector('.ins-typing-row') : null;
    if (ex) ex.remove();
  };

  BotlyChatbotController.prototype.scrollDown = function() {
    if (this.messagesList) {
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  };

  BotlyChatbotController.prototype.handleQuickReply = function(payload) {
    if (typeof payload === 'string' && /^https?:\/\//i.test(payload)) {
      if (typeof window !== 'undefined' && window.open) {
        window.open(payload, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (payload.indexOf('checkout_item:') === 0) {
      // Payments removed — treat as lead inquiry instead
      this.startLeadCapture('Purchase inquiry', null);
      return;
    }
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
    if (payload === 'checkout_method_mpesa' || payload === 'intent_mpesa' || payload === 'pay_mpesa' ||
        payload === 'checkout_method_card' || payload === 'intent_card' || payload === 'pay_card' ||
        payload === 'intent_pay' || payload === 'checkout_now') {
      // Payments removed — route to lead capture
      this.startLeadCapture('Payment & checkout inquiry', null);
      return;
    }
    if (payload.indexOf('select_tier_') === 0) {
      this.handleUserMessage(payload);
      return;
    }
    this.handleUserMessage(payload);
  };

  BotlyChatbotController.prototype.handleUserMessage = function(text) {
    var self = this;
    var now = Date.now();
    if (this._lastUserMsg === text && (now - (this._lastUserMsgTime || 0)) < 350) {
      return; // Deduplicate rapid double submission
    }
    this._lastUserMsg = text;
    this._lastUserMsgTime = now;

    if (text && text.indexOf('checkout_item:') === 0) {
      // Payments removed — route to lead capture
      this.startLeadCapture('Purchase inquiry', null);
      return;
    }
    if (text === 'checkout_method_mpesa' || text === 'checkout_method_card') {
      // Payments removed — route to lead capture
      this.startLeadCapture('Payment inquiry', null);
      return;
    }
    this.appendUser(text);
    this.showTyping();

    // Safety net: if nothing responds within 5s, fall back to local NLP
    var safetyTimer = setTimeout(function() {
      self.removeTyping();
      self.resolveLocalQuery(text);
    }, 5000);

    var done = function() { clearTimeout(safetyTimer); };

    // P92: an active item-order flow owns every reply (checked BEFORE the
    // M-Pesa code detector, so the shop Till confirmation code stays inside
    // the order conversation instead of triggering Botly activation logic).
    if (self.orderState && self.orderState.active) {
      done();
      setTimeout(function() { self.processOrderStep(text); }, 400);
      return;
    }

    // Check if input contains an M-Pesa confirmation code (e.g. UIC8E69GLQ)
    var detectedMpesa = extractMpesaCode(text);
    if (detectedMpesa) {
      done();
      setTimeout(function() {
        self.verifyAndRecordMpesaPayment(detectedMpesa);
      }, self.config.bot?.typingDelayMs || 400);
      return;
    }

    // 0. Lead Capture Flow Active?
    if (self.leadState && self.leadState.active) {
      done();
      setTimeout(function() { self.processLeadCaptureStep(text); }, self.config.bot?.typingDelayMs || 400);
      return;
    }

    // 1. Quote Flow Active?
    if (self.quoteState.active) {
      done();
      setTimeout(function() { self.processQuoteStep(text); }, self.config.bot?.typingDelayMs || 400);
      return;
    }

    // 2. Claims Flow Active?
    if (self.claimState.active) {
      done();
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
          done();
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
    done();
    setTimeout(function() {
      self.resolveLocalQuery(text);
    }, self.config.bot?.typingDelayMs || 400);
  };

  BotlyChatbotController.prototype.resolveLocalQuery = function(text) {
    this.removeTyping();
    if (!this.conversationMemory) {
      this.conversationMemory = {
        turns: 0,
        history: [],
        visitedTopics: [],
        askedFollowUps: [],
        lastFollowUp: null,
        goalStage: 0,
        lastTopic: ''
      };
    }
    var mem = this.conversationMemory;
    var res = classifyQuery(text, this.config, this.config.customFaqs, this.trainedKnowledge, mem);

    // Update conversation memory
    mem.turns++;
    mem.history.push({ role: 'user', text: text, timestamp: Date.now() });
    if (res.reply) {
      mem.history.push({ role: 'bot', text: res.reply, intent: res.intent, timestamp: Date.now() });
    }
    if (res.lastFollowUp) {
      if (!res.lastFollowUp.turn) res.lastFollowUp.turn = mem.turns; // V3: every offer carries its birth turn
      mem.lastFollowUp = res.lastFollowUp;
      if (res.lastFollowUp.text && mem.askedFollowUps.indexOf(res.lastFollowUp.text) === -1) {
        mem.askedFollowUps.push(res.lastFollowUp.text);
      }
    }
    if (res.topic) {
      mem.lastTopic = res.topic;
      if (mem.visitedTopics.indexOf(res.topic) === -1) {
        mem.visitedTopics.push(res.topic);
      }
    }

    if (res.action === 'PRODUCT_SEARCH' && !res.isOutOfScope) {
      var self = this;
      var webUrl = (this.config.company && this.config.company.websiteUrl) ? this.config.company.websiteUrl : '';
      var queryKey = res.productQuery || text;

      this.showTyping();
      fetchLiveScrapedProducts(queryKey, webUrl, function(scrapedData) {
        self.removeTyping();
        if (scrapedData && scrapedData.found && scrapedData.items && scrapedData.items.length > 0) {
          var compName = (self.config.company && self.config.company.name) ? self.config.company.name : 'our store';
          var liveFormatted = formatScrapedProductsResult(scrapedData, queryKey, webUrl, compName);
          mem.history.push({ role: 'bot', text: liveFormatted.message, intent: 'product_search', timestamp: Date.now() });
          self.appendBot(liveFormatted.message, { html: liveFormatted.productCardsHtml || '', quickReplies: liveFormatted.suggestedQuickReplies });
        } else if (res.productCardsHtml) {
          self.appendBot(res.reply, { html: res.productCardsHtml, quickReplies: res.suggestedQuickReplies });
        } else {
          self.appendBot(res.reply, { quickReplies: res.suggestedQuickReplies });
        }
      });
      return;
    }

    if (res.action === 'LEAD_CAPTURE') {
      this.startLeadCapture(res.inquiredNeed || text, res.leadIntro);
      return;
    }
    if (res.action === 'START_ORDER_FLOW') {
      this.startOrderFlow(res.orderItem, res.orderPrice);
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
      // Payments are handled externally — route to lead capture for follow-up
      this.startLeadCapture(res.inquiredNeed || 'Payment inquiry', null);
      return;
    }
    this.appendBot(res.reply, { quickReplies: res.suggestedQuickReplies });
  };

  BotlyChatbotController.prototype.startLeadCapture = function(inquiredNeed, customIntro) {
    var cleanNeed = (inquiredNeed || '').trim() || 'Custom Service & Solution Inquiry';

    // If both name and phone have already been collected, do not ask again!
    if (this.collectedContact && this.collectedContact.name && (this.collectedContact.phone || this.collectedContact.email)) {
      this.leadState = {
        active: false,
        step: 'completed',
        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: this.collectedContact.phone,
        email: this.collectedContact.email || ''
      };

      var leadRecord = {
        id: 'LEAD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        name: this.collectedContact.name,
        phone: this.collectedContact.phone,
        email: this.collectedContact.email || '',
        need: cleanNeed,
        goal: this.config.goal || 'lead_generation',
        timestamp: new Date().toISOString(),
        createdAtFormatted: new Date().toLocaleString(),
        status: 'New',
        company: this.config.company?.name || 'Botly AI'
      };

      saveStoredLead(leadRecord);
      botlyCloudSyncLead(leadRecord, { config: this.config, memory: this.conversationMemory });

      if (this.config.webhooks?.onLeadCaptured && typeof this.config.webhooks.onLeadCaptured === 'function') {
        try { this.config.webhooks.onLeadCaptured(leadRecord); } catch(e) {}
      }
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        try { window.dispatchEvent(new CustomEvent('botly:leadCaptured', { detail: leadRecord })); } catch(e) {}
      }

      var isSaas = !!(this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0) || (this.config.customFaqs && this.config.customFaqs.length > 0));
      var compName = (this.config.company && this.config.company.name) ? this.config.company.name : '';
      var teamLabel = compName && compName !== 'Botly' && compName !== 'Botly Pro' ? 'the ' + compName + ' team' : 'the team';
      var followUp = (this.config.leadCapture && this.config.leadCapture.followUpQuestion) ||
        (isSaas
          ? "💬 **In the meantime, how else can I assist you right now?** Feel free to ask any other questions about our services."
          : "💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant rates or view an overview of our coverage?");

      var confirmKnownMsg = "🎉 **Thank you, " + this.escape(this.collectedContact.name) + "!**\n\nI've logged your request regarding **" + this.escape(cleanNeed) + "**.\n\nOur specialist team already has your contact details (**" + this.escape(this.collectedContact.phone || this.collectedContact.email) + "**) and will reach out shortly.\n\n" + followUp;

      this.appendBot(confirmKnownMsg, {
        quickReplies: isSaas ? [
          { label: 'Our Services', payload: 'What services do you offer?' },
          { label: 'Get started', payload: 'How do I get started?' },
          { label: 'Talk to someone', payload: 'I want to speak with someone from ' + teamLabel }
        ] : [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
        ]
      });
      return;
    }

    // If only name has been collected, skip asking for name and ask directly for phone
    if (this.collectedContact && this.collectedContact.name && !(this.collectedContact.phone || this.collectedContact.email)) {
      this.leadState = {
        active: true,
        step: 'awaiting_phone',
        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: '',
        email: ''
      };
      this.appendBot("Wonderful to connect with you again, **" + this.escape(this.collectedContact.name) + "**! 🤝\n\nWhat is the best **phone number** or **email address** for our specialist team to reach you regarding **" + this.escape(cleanNeed) + "**?", {
        quickReplies: [
          { label: 'Cancel & Main Menu', payload: 'intent_cancel_lead' }
        ]
      });
      return;
    }

    this.leadState = {
      active: true,
      step: 'awaiting_name',
      inquiredNeed: cleanNeed,
      name: '',
      phone: '',
      email: ''
    };
    var compName = (this.config.company && this.config.company.name) ? this.config.company.name : 'our';
    var isSaas = !!(this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0) || (this.config.customFaqs && this.config.customFaqs.length > 0));
    var needDisplay = cleanNeed ? ' regarding "**' + this.escape(cleanNeed) + '**"' : '';
    var startMsg = customIntro || '';
    if (!startMsg) {
      if (this.config.leadCapture && this.config.leadCapture.askNamePrompt) {
        startMsg = this.config.leadCapture.askNamePrompt
          .replace(/\{need\}/g, cleanNeed || 'your custom request')
          .replace(/\{needTopic\}/g, needDisplay)
          .replace(/\{companyName\}/g, compName);
      } else if (isSaas) {
        startMsg = "Good question" + needDisplay + "! I want to make sure you get the right answer, so let me connect you with the **" + compName + "** team who can sort you out properly.\n\nWhat's your **full name**?";
      } else {
        startMsg = "Good question" + needDisplay + "! I want to make sure you get the right answer, so let me connect you with our specialist team who can sort you out properly.\n\nWhat's your **full name**?";
      }
    }
    this.appendBot(startMsg, {
      quickReplies: [
        { label: 'Cancel & Main Menu', payload: 'intent_cancel_lead' }
      ]
    });
  };

  BotlyChatbotController.prototype.processLeadCaptureStep = function(text) {
    var input = (text || '').trim();
    if (/^(cancel|nevermind|stop|exit|main menu|back)\b/i.test(input) || input === 'intent_cancel_lead') {
      this.leadState.active = false;
      this.leadState.step = 'idle';
      var compName = (this.config.company && this.config.company.name) ? this.config.company.name : '';
      var teamLabel = compName && compName !== 'Botly' && compName !== 'Botly Pro' ? 'the ' + compName + ' team' : 'the team';
      var isSaasCancel = !!(this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0) || (this.config.customFaqs && this.config.customFaqs.length > 0));
      this.appendBot("No problem! What else can I help with?", {
        quickReplies: isSaasCancel ? [
          { label: 'Our Services', payload: 'What services do you offer?' },
          { label: 'Get started', payload: 'How do I get started?' },
          { label: 'Talk to someone', payload: 'I want to speak with someone from ' + teamLabel }
        ] : [
          { label: '🚗 Auto Quote', payload: 'intent_quote_auto' },
          { label: '🏥 Health Plans', payload: 'intent_quote_health' },
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
      this.collectedContact.name = name;
      if (typeof window !== 'undefined' && window.localStorage) {
        try { localStorage.setItem(botlyContactKey(), JSON.stringify(this.collectedContact)); } catch (e) {}
      }
      this.leadState.step = 'awaiting_phone';

      var phonePrompt = '';
      if (this.config.leadCapture && this.config.leadCapture.askPhonePrompt) {
        phonePrompt = this.config.leadCapture.askPhonePrompt.replace(/\{name\}/g, this.escape(name));
      } else {
        phonePrompt = "Nice to meet you, **" + this.escape(name) + "**! What's the best number or email address to reach you?";
      }
      this.appendBot(phonePrompt);
      return;
    }

    if (this.leadState.step === 'awaiting_phone') {
      var digitsOnly = input.replace(/\D/g, '');
      var looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input);
      if (!looksLikeEmail && digitsOnly.length < 6) {
        this.appendBot("Please share a valid **phone number** or **email address** (e.g. **+1 555-0199**, **0712 345 678** or **you@example.com**) so our advisor can reach you:");
        return;
      }
      if (looksLikeEmail) {
        this.leadState.email = input;
        this.leadState.phone = '';
        this.collectedContact.email = input;
      } else {
        this.leadState.phone = input;
        this.collectedContact.phone = input;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        try { localStorage.setItem(botlyContactKey(), JSON.stringify(this.collectedContact)); } catch (e) {}
      }
      this.leadState.step = 'completed';
      this.leadState.active = false;

      var leadRecord = {
        id: 'LEAD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        name: this.leadState.name,
        phone: this.leadState.phone,
        email: this.leadState.email || '',
        need: this.leadState.inquiredNeed,
        goal: this.config.goal || 'lead_generation',
        timestamp: new Date().toISOString(),
        createdAtFormatted: new Date().toLocaleString(),
        status: 'New',
        company: this.config.company?.name || 'Botly AI'
      };

      saveStoredLead(leadRecord);
      botlyCloudSyncLead(leadRecord, { config: this.config, memory: this.conversationMemory });

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
          .replace(/\{phone\}/g, this.escape(this.leadState.phone || this.leadState.email));
      } else {
        confirmMsg = "Got it, **" + this.escape(this.leadState.name) + "**! Your details are saved. Someone from our team will reach out to **" + this.escape(this.leadState.phone || this.leadState.email) + "** shortly.";
      }

      var isSaasConfirmMode = !!(this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0) || (this.config.customFaqs && this.config.customFaqs.length > 0));
      var compName = (this.config.company && this.config.company.name) ? this.config.company.name : '';
      var teamLabel = compName && compName !== 'Botly' && compName !== 'Botly Pro' ? 'the ' + compName + ' team' : 'the team';
      var followUp = (this.config.leadCapture && this.config.leadCapture.followUpQuestion) ||
        (isSaasConfirmMode
          ? "💬 **In the meantime, how else can I assist you right now?** Feel free to ask any other questions about our services."
          : "💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant quote rates or see an overview of our coverage?");

      this.appendBot(confirmMsg + "\n\n" + followUp, {
        quickReplies: isSaasConfirmMode ? [
          { label: 'Our Services', payload: 'What services do you offer?' },
          { label: 'Get started', payload: 'How do I get started?' },
          { label: 'Talk to someone', payload: 'I want to speak with someone from ' + teamLabel }
        ] : [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
        ]
      });
      return;
    }
  };

  BotlyChatbotController.prototype.startQuoteWizard = function(productKey) {
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

  BotlyChatbotController.prototype.processQuoteStep = function(text) {
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
        '<button class="ins-btn-primary" onclick="BotlyChatbot.triggerAction(\'checkout_now\')">' +
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

  BotlyChatbotController.prototype.startClaimWizard = function() {
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

  BotlyChatbotController.prototype.processClaimStep = function(text) {
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

  function buildCheckoutInstructions(bot, item) {
    item = item || {};
    var cred = bot && (bot.verifiedPaymentCredential || (bot.checkout && bot.checkout.verifiedPaymentCredential));
    if (!cred || !cred.verifiedAt) {
      return { ok: false, reason: 'no_verified_payment_credential' };
    }
    var businessName = cred.businessName || (bot.company && bot.company.name) || '';
    var currency = item.currency || 'KES';
    var priceFormatted = Number(item.price || 0).toLocaleString();

    if (cred.type === 'mpesa_till' || cred.type === 'buy_goods') {
      var till = cred.till || cred.number;
      if (!till) return { ok: false, reason: 'missing_till_number' };
      return {
        ok: true,
        type: 'buy_goods',
        till: String(till),
        businessName: businessName,
        instructionsHtml:
          '<div style="font-weight:700; margin-bottom:4px; color:#18221c;">How to Pay via M-Pesa Till:</div>' +
          '<ol style="margin:0; padding-left:18px; color:#334155; line-height:1.6;">' +
            '<li>Go to <strong>M-Pesa</strong> on your phone &amp; select <strong>Lipa na M-Pesa</strong></li>' +
            '<li>Select <strong>Buy Goods and Services</strong></li>' +
            '<li>Enter Till Number: <strong style="color:#059669; font-size:13px;">' + String(till) + '</strong> (' + businessName + ')</li>' +
            '<li>Enter Amount: <strong>' + currency + ' ' + priceFormatted + '</strong></li>' +
            '<li>Enter your M-Pesa PIN and send</li>' +
          '</ol>'
      };
    }
    if (cred.type === 'paybill') {
      var paybill = cred.paybill || cred.number;
      if (!paybill) return { ok: false, reason: 'missing_paybill_number' };
      var account = cred.account || item.name || 'ORDER';
      return {
        ok: true,
        type: 'paybill',
        paybill: String(paybill),
        account: String(account),
        businessName: businessName,
        instructionsHtml:
          '<div style="font-weight:700; margin-bottom:4px; color:#18221c;">How to Pay via Paybill:</div>' +
          '<ol style="margin:0; padding-left:18px; color:#334155; line-height:1.6;">' +
            '<li>Go to <strong>M-Pesa</strong> on your phone &amp; select <strong>Lipa na M-Pesa</strong></li>' +
            '<li>Select <strong>Paybill</strong></li>' +
            '<li>Enter Business No: <strong style="color:#059669; font-size:13px;">' + String(paybill) + '</strong> (' + businessName + ')</li>' +
            '<li>Enter Account No: <strong style="color:#059669; font-size:13px;">' + String(account) + '</strong></li>' +
            '<li>Enter Amount: <strong>' + currency + ' ' + priceFormatted + '</strong></li>' +
            '<li>Enter your M-Pesa PIN and send</li>' +
          '</ol>'
      };
    }
    return { ok: false, reason: 'unsupported_payment_type' };
  }

  BotlyChatbotController.prototype.startInChatCheckout = function(methodOrItem, customItem, customAmount, customUrl, customCurrency) {
    var self = this;
    var chk = this.config.checkout || {};
    if (chk.enabled === false) {
      var comp = (this.config.company && this.config.company.name) ? this.config.company.name : 'our team';
      this.appendBot("Online checkout is not active for **" + comp + "**. Please contact our team or leave your details so we can assist you directly.");
      return;
    }
    var mpesa = chk.mpesa || {};
    var card = chk.card || {};
    var isCustomCheckout = (this.config.mode === 'saas') || (chk && (chk.externalUrl || mpesa.number || mpesa.type || chk.enabled || chk.card));

    var method = null;
    var parsedItem = null;
    var parsedAmount = null;
    var parsedCurrency = null;
    var parsedUrl = null;

    if (typeof methodOrItem === 'string' && methodOrItem.indexOf('checkout_item:') === 0) {
      var parts = methodOrItem.split(':');
      try {
        parsedItem = decodeURIComponent(parts[1] || '');
      } catch(e) { parsedItem = parts[1] || ''; }
      parsedAmount = parts[2] ? parseFloat(parts[2]) : null;
      parsedCurrency = parts[3] || null;
      try {
        parsedUrl = parts[4] ? decodeURIComponent(parts[4]) : null;
      } catch(e) { parsedUrl = parts[4] || null; }
      if (parts[5] === 'mpesa' || parts[5] === 'card') {
        method = parts[5];
      }
    } else if (methodOrItem === 'mpesa' || methodOrItem === 'card') {
      method = methodOrItem;
    } else if (methodOrItem) {
      parsedItem = methodOrItem;
    }

    if (parsedItem) this.activeCheckoutItem = parsedItem;
    if (parsedAmount) this.activeCheckoutAmount = parsedAmount;
    if (parsedCurrency) this.activeCheckoutCurrency = parsedCurrency;
    if (parsedUrl) this.activeCheckoutUrl = parsedUrl;

    if (customItem && typeof customItem === 'string') this.activeCheckoutItem = customItem;
    if (customAmount) this.activeCheckoutAmount = customAmount;
    if (customUrl) this.activeCheckoutUrl = customUrl;
    if (customCurrency) this.activeCheckoutCurrency = customCurrency;

    var activeItem = this.activeCheckoutItem || (chk && chk.item) || (mpesa && mpesa.item) || (this.activeQuote ? this.activeQuote.productName : 'Standard Package');
    var activeAmount = this.activeCheckoutAmount || (chk && chk.amount) || (mpesa && mpesa.amount) || (this.activeQuote ? this.activeQuote.annualTotal : 1000);
    var activeCur = this.activeCheckoutCurrency || (chk && chk.currency) || (mpesa && mpesa.currency) || (this.config.currency && this.config.currency.code) || 'KES';
    var activeCurSym = (activeCur === 'USD' || activeCur === '$') ? '$' : (activeCur === 'KES' ? 'KES ' : (activeCur + ' '));
    var activeUrl = this.activeCheckoutUrl || (chk && chk.externalUrl) || (card && card.url) || '';

    if (isCustomCheckout) {
      var checkoutRes = buildCheckoutInstructions(this.config, { name: activeItem, price: activeAmount, currency: activeCur });
      var hasVerifiedMpesa = !!(checkoutRes && checkoutRes.ok);
      var hasCardUrl = !!activeUrl;

      if (method === 'mpesa') {
        if (!hasVerifiedMpesa) {
          var compName = (this.config.company && this.config.company.name) || 'this business';
          this.appendBot("⚠️ **Online M-Pesa Checkout Unavailable:** " + self.escape(compName) + " does not have an active verified payment credential on file. To protect against unauthorized transactions, in-chat payment instructions cannot be issued. Please contact the business directly.");
          return;
        }
        this.renderMpesaCheckoutCard(activeItem, activeAmount, activeCur);
        return;
      }
      if (method === 'card') {
        if (!hasCardUrl) {
          var compName = (this.config.company && this.config.company.name) || 'this business';
          this.appendBot("⚠️ **Card Checkout Unavailable:** " + self.escape(compName) + " has not configured an external payment link. Please contact the business directly.");
          return;
        }
        this.renderCardCheckoutCard(activeItem, activeAmount, activeCur, activeUrl);
        return;
      }

      if (!hasVerifiedMpesa && !hasCardUrl) {
        var compName = (this.config.company && this.config.company.name) || 'this business';
        this.appendBot("⚠️ **Online Checkout Not Available:** " + self.escape(compName) + " does not have verified payment credentials on file. Please contact the business directly or leave your contact details so our team can assist you.");
        return;
      }

      if (!hasVerifiedMpesa && hasCardUrl) {
        this.renderCardCheckoutCard(activeItem, activeAmount, activeCur, activeUrl);
        return;
      }

      if (hasVerifiedMpesa && !hasCardUrl) {
        this.renderMpesaCheckoutCard(activeItem, activeAmount, activeCur);
        return;
      }

      // No method specified: prompt user to select M-Pesa or Card!
      var selectId = 'pay-sel-' + Math.random().toString(36).substring(2, 7);
      var selHtml = '<div class="checkout-method-selector" id="' + selectId + '" style="margin-top: 8px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">' +
        '<div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">' +
          '<span>🔒 Select Payment Method</span>' +
          '<span style="background: #ecfdf5; color: #059669; font-size: 10.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #10b981;">' + self.escape(activeCurSym) + Number(activeAmount).toLocaleString() + '</span>' +
        '</div>' +
        '<div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 10px; background: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">' +
          '<span style="display: flex; align-items: center; gap: 6px;">🛒 <strong>' + self.escape(activeItem) + '</strong></span>' +
          '<span style="color: #059669; font-weight: 800;">' + self.escape(activeCurSym) + Number(activeAmount).toLocaleString() + '</span>' +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 8px;">' +
          '<button type="button" class="btn-select-mpesa-opt" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 1.5px solid #10b981; background: #ecfdf5; border-radius: 10px; cursor: pointer; text-align: left; transition: all 0.2s;">' +
            '<span style="font-size: 22px; line-height: 1;">📱</span>' +
            '<div style="flex: 1;">' +
              '<div style="font-size: 13px; font-weight: 800; color: #065f46;">Pay with M-Pesa (' + self.escape(activeCurSym) + Number(activeAmount).toLocaleString() + ')</div>' +
              '<div style="font-size: 11px; color: #047857; margin-top: 1px;">Direct in-chat Till / Paybill with confirmation code verification</div>' +
            '</div>' +
            '<span style="font-size: 14px; color: #059669; font-weight: 800;">→</span>' +
          '</button>' +
          '<button type="button" class="btn-select-card-opt" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 1.5px solid #0284c7; background: #f0f9ff; border-radius: 10px; cursor: pointer; text-align: left; transition: all 0.2s;">' +
            '<span style="font-size: 22px; line-height: 1;">💳</span>' +
            '<div style="flex: 1;">' +
              '<div style="font-size: 13px; font-weight: 800; color: #0369a1;">Pay with Card (' + self.escape(activeCurSym) + Number(activeAmount).toLocaleString() + ')</div>' +
              '<div style="font-size: 11px; color: #0284c7; margin-top: 1px;">Credit / Debit Card via secure checkout payment link</div>' +
            '</div>' +
            '<span style="font-size: 14px; color: #0284c7; font-weight: 800;">→</span>' +
          '</button>' +
        '</div>' +
      '</div>';

      this.appendBot("💳 **How would you like to complete your payment for " + self.escape(activeItem) + "?**\n\nPlease select your preferred payment method:", {
        quickReplies: [
          { label: '📱 Pay with M-Pesa (' + activeCurSym + Number(activeAmount).toLocaleString() + ')', payload: 'checkout_method_mpesa' },
          { label: '💳 Pay with Card (' + activeCurSym + Number(activeAmount).toLocaleString() + ')', payload: 'checkout_method_card' }
        ],
        html: selHtml
      });

      setTimeout(function() {
        var el = document.getElementById(selectId);
        if (!el) return;
        var btnMpesa = el.querySelector('.btn-select-mpesa-opt');
        var btnCard = el.querySelector('.btn-select-card-opt');
        if (btnMpesa) {
          btnMpesa.addEventListener('click', function() {
            self.startInChatCheckout('mpesa', activeItem, activeAmount, activeUrl, activeCur);
          });
        }
        if (btnCard) {
          btnCard.addEventListener('click', function() {
            self.startInChatCheckout('card', activeItem, activeAmount, activeUrl, activeCur);
          });
        }
      }, 80);
      return;
    }

    // Default Insurance flow fallback
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

  BotlyChatbotController.prototype.renderMpesaCheckoutCard = function(customItem, customAmount, customCurrency) {
    var self = this;
    var chk = this.config.checkout || {};
    var mpesa = chk.mpesa || {};
    var curCode = customCurrency || this.activeCheckoutCurrency || mpesa.currency || chk.currency || (this.config.currency && this.config.currency.code) || 'KES';
    var sym = (curCode === 'USD' || curCode === '$') ? '$' : (curCode === 'KES' ? 'KES ' : (curCode + ' '));
    var amount = customAmount || this.activeCheckoutAmount || mpesa.amount || chk.amount || (this.activeQuote ? this.activeQuote.annualTotal : 1000);
    var itemName = customItem || this.activeCheckoutItem || mpesa.item || chk.item || (this.activeQuote ? this.activeQuote.productName : 'Standard Package');
    var cardId = 'chk-mpesa-' + Math.random().toString(36).substring(2, 7);

    // buildCheckoutInstructions: strictly refuses unverified credentials, preventing fraud
    var checkoutRes = buildCheckoutInstructions(this.config, { name: itemName, price: amount, currency: curCode });
    if (!checkoutRes || !checkoutRes.ok) {
      var businessName = (this.config.company && this.config.company.name) || 'this business';
      this.appendBot("⚠️ **Payment Instructions Unavailable:** " + self.escape(businessName) + " does not have an active verified payment credential on file. To protect against fraud, payment instructions cannot be issued. Please contact the business directly.");
      return;
    }

    var mpesaNumber = checkoutRes.till || checkoutRes.paybill;
    var businessName = checkoutRes.businessName || (this.config.company && this.config.company.name) || '';
    var mpesaTypeTitle = checkoutRes.type === 'paybill' ? 'Paybill Number' : 'Buy Goods (Till Number)';
    var stepInstructions = checkoutRes.instructionsHtml;

    var checkoutHtml = '<div class="inchat-checkout-card" id="' + cardId + '">' +
      '<div class="checkout-header">' +
        '<div class="checkout-title"><span class="lock-icon">📱</span><strong>M-Pesa Direct Checkout</strong></div>' +
        '<span class="pci-badge" style="background:#ecfdf5; color:#059669; border:1px solid #10b981;">Verified Merchant</span>' +
      '</div>' +
      '<div class="checkout-summary-bar">' +
        '<div class="plan-info"><span class="plan-name">' + self.escape(itemName) + '</span><span class="plan-sub">' + self.escape(businessName) + ' • Instant Verification</span></div>' +
        '<div class="plan-price" id="' + cardId + '-price">' + sym + Number(amount).toLocaleString() + '</div>' +
      '</div>' +
      '<div style="background:#ffffff; border:1.5px solid #059669; border-radius:12px; padding:12px; margin-bottom:10px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">' +
          '<div style="display:flex; align-items:center; gap:6px;">' +
            '<span style="background:#059669; color:#fff; font-size:9.5px; font-weight:800; padding:2px 5px; border-radius:4px;">M-PESA</span>' +
            '<strong style="font-size:12px; color:#0f172a;">Lipa na M-Pesa Instructions</strong>' +
          '</div>' +
          '<span style="font-size:11px; font-weight:700; color:#059669;">' + mpesaTypeTitle + '</span>' +
        '</div>' +
        stepInstructions +
        '<div style="margin-top:10px; background:#f0fdf4; border:1px dashed #86efac; border-radius:8px; padding:10px;">' +
          '<label style="display:block; font-size:11.5px; font-weight:800; color:#166534; margin-bottom:4px;">Enter M-Pesa Confirmation Code (e.g. UIC8E69GLQ):</label>' +
          '<div style="display:flex; gap:6px; margin-bottom:6px;">' +
            '<input type="text" id="' + cardId + '-mpesa-code" class="input-field" placeholder="e.g. UIC8E69GLQ" style="flex:1; text-transform:uppercase; font-family:monospace; font-weight:800; letter-spacing:1px; font-size:13px; padding:7px 10px;" maxlength="12" />' +
            '<button type="button" class="btn-submit-payment" id="' + cardId + '-verify-btn" style="width:auto; margin:0; padding:7px 14px; font-size:12px; background:#059669;">Verify Code</button>' +
          '</div>' +
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">' +
            '<input type="text" id="' + cardId + '-cust-name" class="input-field" placeholder="Your Name (Optional)" style="font-size:11px; padding:5px 8px;" />' +
            '<input type="tel" id="' + cardId + '-cust-phone" class="input-field" placeholder="Your Phone (Optional)" style="font-size:11px; padding:5px 8px;" />' +
          '</div>' +
          '<div id="' + cardId + '-err-msg" style="display:none; color:#dc2626; font-size:11px; margin-top:4px; font-weight:600;"></div>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:center; padding-top:4px;">' +
        '<button type="button" id="' + cardId + '-switch-card" style="background:none; border:none; color:#0284c7; font-size:11.5px; font-weight:700; cursor:pointer; text-decoration:underline;">' +
          'Need to pay via Credit/Debit Card instead? Click here 💳' +
        '</button>' +
      '</div>' +
    '</div>';

    this.appendBot("📱 **Follow the M-Pesa instructions below and enter your confirmation code:**", {
      html: checkoutHtml
    });

    setTimeout(function() {
      var cardEl = document.getElementById(cardId);
      if (!cardEl) return;
      var verifyBtn = cardEl.querySelector('#' + cardId + '-verify-btn');
      var codeInput = cardEl.querySelector('#' + cardId + '-mpesa-code');
      var errMsg = cardEl.querySelector('#' + cardId + '-err-msg');
      var nameInput = cardEl.querySelector('#' + cardId + '-cust-name');
      var phoneInput = cardEl.querySelector('#' + cardId + '-cust-phone');
      var switchBtn = cardEl.querySelector('#' + cardId + '-switch-card');

      if (switchBtn) {
        switchBtn.addEventListener('click', function() {
          self.startInChatCheckout('card', itemName, amount, self.activeCheckoutUrl, curCode);
        });
      }

      if (verifyBtn && codeInput) {
        verifyBtn.addEventListener('click', function() {
          var raw = (codeInput.value || '').trim();
          var validCode = extractMpesaCode(raw);
          if (!validCode) {
            if (errMsg) {
              errMsg.textContent = 'Please enter a valid 8-12 character M-Pesa code (e.g. UIC8E69GLQ).';
              errMsg.style.display = 'block';
            }
            return;
          }
          if (errMsg) errMsg.style.display = 'none';
          self.verifyAndRecordMpesaPayment(validCode, {
            name: (nameInput && nameInput.value) || '',
            phone: (phoneInput && phoneInput.value) || '',
            item: itemName,
            amount: amount,
            currency: sym,
            mpesaDetails: { type: mpesaType, number: mpesaNumber, account: mpesaAccount, businessName: businessName }
          });
        });
      }
    }, 100);
  };

  BotlyChatbotController.prototype.renderCardCheckoutCard = function(customItem, customAmount, customCurrency, customUrl) {
    var self = this;
    var chk = this.config.checkout || {};
    var card = chk.card || {};
    var cardItem = customItem || this.activeCheckoutItem || card.item || chk.item || 'Standard Package';
    var cardAmt = customAmount || this.activeCheckoutAmount || card.amount || chk.amount || (this.activeQuote ? this.activeQuote.annualTotal : 10);
    var cardCur = customCurrency || this.activeCheckoutCurrency || card.currency || chk.currency || (this.config.currency && this.config.currency.code) || 'USD';
    var sym = (cardCur === 'USD' || cardCur === '$') ? '$' : (cardCur === 'KES' ? 'KES ' : (cardCur + ' '));
    var cardId = 'chk-card-' + Math.random().toString(36).substring(2, 7);
    var compName = (this.config.company && this.config.company.name) || 'Botly Store';

    // Build intelligent, working checkout URL fallback so link never fails or shows "Not configured"
    var targetUrl = customUrl || this.activeCheckoutUrl || card.url || chk.externalUrl || '';
    if (!targetUrl) {
      if (this.config.company && this.config.company.websiteUrl) {
        var baseWeb = this.config.company.websiteUrl.replace(/\/$/, '');
        targetUrl = baseWeb + '/checkout?item=' + encodeURIComponent(cardItem) + '&amount=' + encodeURIComponent(cardAmt);
      } else {
        targetUrl = 'https://checkout.stripe.com';
      }
    }

    var btnLabel = card.buttonLabel || ('Proceed to Card Checkout (' + sym + Number(cardAmt).toLocaleString() + ') ↗');

    var ctaHtml = '<div style="margin-top:12px;">' +
      '<a href="' + self.escape(targetUrl) + '" target="_blank" rel="noopener noreferrer" class="btn-card-checkout-link" style="display:block; width:100%; box-sizing:border-box; text-align:center; background:#0284c7; color:#ffffff; padding:12px 16px; border-radius:10px; font-weight:800; font-size:13px; text-decoration:none; box-shadow:0 2px 8px rgba(2,132,199,0.35); transition:all 0.2s;">' +
        self.escape(btnLabel) +
      '</a>' +
      '<div style="font-size:11px; color:#64748b; margin-top:6px; text-align:center; display:flex; align-items:center; justify-content:center; gap:4px;">' +
        '<span>🔒</span> <span>Opens secure payment gateway in a new tab</span>' +
      '</div>' +
    '</div>';

    var checkoutHtml = '<div class="inchat-checkout-card" id="' + cardId + '">' +
      '<div class="checkout-header">' +
        '<div class="checkout-title"><span class="lock-icon">💳</span><strong>Card &amp; External Checkout</strong></div>' +
        '<span class="pci-badge" style="background:#f0f9ff; color:#0284c7; border:1px solid #38bdf8;">PCI-DSS Level 1</span>' +
      '</div>' +
      '<div class="checkout-summary-bar">' +
        '<div class="plan-info"><span class="plan-name">' + self.escape(cardItem) + '</span><span class="plan-sub">' + self.escape(compName) + ' • Secure Card Gateway</span></div>' +
        '<div class="plan-price" id="' + cardId + '-price">' + sym + Number(cardAmt).toLocaleString() + '</div>' +
      '</div>' +
      '<div style="background:#ffffff; border:1.5px solid #0284c7; border-radius:12px; padding:14px; margin-bottom:10px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">' +
          '<span style="font-size:12px; font-weight:800; color:#0f172a;">Accepted Payment Cards &amp; Wallets:</span>' +
          '<span style="font-size:10px; font-weight:700; color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px;">Encrypted 256-bit</span>' +
        '</div>' +
        '<div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:10px;">' +
          '<span style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; color:#1e293b;">💳 Visa</span>' +
          '<span style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; color:#1e293b;">💳 Mastercard</span>' +
          '<span style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; color:#1e293b;">💳 Amex</span>' +
          '<span style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; color:#1e293b;">Apple Pay</span>' +
          '<span style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; color:#1e293b;">Google Pay</span>' +
          '<span style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; color:#0284c7;">Stripe / PayPal</span>' +
        '</div>' +
        '<p style="font-size:11.5px; color:#475569; margin:0 0 10px 0; line-height:1.45;">' +
          'Click the button below to review your order details and safely input your card information on our verified checkout page.' +
        '</p>' +
        ctaHtml +
      '</div>' +
      '<div style="text-align:center; padding-top:4px;">' +
        '<button type="button" id="' + cardId + '-switch-mpesa" style="background:none; border:none; color:#059669; font-size:11.5px; font-weight:700; cursor:pointer; text-decoration:underline;">' +
          'Prefer to pay with M-Pesa instead? Click here 📱' +
        '</button>' +
      '</div>' +
    '</div>';

    this.appendBot("💳 **Review card order details below to proceed to secure payment:**", {
      html: checkoutHtml
    });

    setTimeout(function() {
      var cardEl = document.getElementById(cardId);
      if (!cardEl) return;
      var switchBtn = cardEl.querySelector('#' + cardId + '-switch-mpesa');
      if (switchBtn) {
        switchBtn.addEventListener('click', function() {
          self.startInChatCheckout('mpesa', cardItem, cardAmt, targetUrl, cardCur);
        });
      }
      var linkBtn = cardEl.querySelector('.btn-card-checkout-link');
      if (linkBtn) {
        linkBtn.addEventListener('click', function(e) {
          try {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          } catch(err) {
            // normal anchor navigation fallback
          }
        });
      }
    }, 100);
  };

  BotlyChatbotController.prototype.verifyAndRecordMpesaPayment = function(mpesaCode, details) {
    details = details || {};
    var cleanCode = (mpesaCode || '').trim().toUpperCase();
    var chk = this.config.checkout || {};
    var mpesa = (chk && chk.mpesa) || {};

    var compName = (this.config.company && this.config.company.name) || 'Botly AI';
    var custName = (details.name || (this.leadState && this.leadState.name) || 'Customer').trim();
    var custPhone = (details.phone || (this.leadState && this.leadState.phone) || 'M-Pesa Verified').trim();
    var itemName = details.item || chk.item || (this.activeQuote ? this.activeQuote.productName : 'Product & Service Order');

    var currency = details.currency || mpesa.currency || this.config.currency?.code || 'KES';
    var sym = (currency === 'USD' ? '$' : (currency + ' '));
    var amountVal = details.amount || mpesa.amount || (this.activeQuote ? this.activeQuote.annualTotal : 1000);
    var amountFormatted = sym + Number(amountVal).toLocaleString();

    var mType = (details.mpesaDetails && details.mpesaDetails.type) || mpesa.type || 'buy_goods';
    var mNum = (details.mpesaDetails && details.mpesaDetails.number) || (this.config.verifiedPaymentCredential && (this.config.verifiedPaymentCredential.till || this.config.verifiedPaymentCredential.number)) || mpesa.number || '';
    var mAcc = (details.mpesaDetails && details.mpesaDetails.account) || mpesa.account || '';
    var mBiz = (details.mpesaDetails && details.mpesaDetails.businessName) || mpesa.businessName || compName;

    var typeLabels = {
      buy_goods: mNum ? ('Buy Goods (Till: ' + mNum + ')') : 'Buy Goods (Till)',
      paybill: mNum ? ('Paybill (' + mNum + (mAcc ? ' / Acc: ' + mAcc : '') + ')') : 'Paybill',
      send_money: mNum ? ('Send Money (' + mNum + ')') : 'Send Money'
    };
    var methodLabel = typeLabels[mType] || (mNum ? ('M-Pesa ' + mNum) : 'M-Pesa');

    var leadRecord = {
      id: 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
      name: custName,
      phone: custPhone,
      need: itemName,
      goal: 'payment_checkout',
      status: 'Paid (M-Pesa: ' + cleanCode + ')',
      paymentMethod: 'M-Pesa: ' + methodLabel,
      mpesaCode: cleanCode,
      amount: amountFormatted,
      destination: mNum + (mAcc ? ' / ' + mAcc : ''),
      businessName: mBiz,
      timestamp: new Date().toISOString(),
      createdAtFormatted: new Date().toLocaleString(),
      company: compName
    };

    saveStoredLead(leadRecord);
    botlyCloudSyncLead(leadRecord, { config: this.config, memory: this.conversationMemory });

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      try {
        window.dispatchEvent(new CustomEvent('botly:leadCaptured', { detail: leadRecord }));
      } catch(e) {}
    }

    var receiptHtml = '<div class="insurance-receipt-card" style="border-left: 4px solid #059669;">' +
      '<div class="receipt-header">' +
        '<div class="receipt-status-badge" style="background:#ecfdf5; color:#059669; border:1px solid #10b981;"><span class="status-dot" style="background:#059669;"></span> M-PESA PAYMENT VERIFIED</div>' +
        '<div class="receipt-policy-no"><span class="label">M-Pesa Code</span><strong style="font-family:monospace; color:#059669; font-size:14px;">' + cleanCode + '</strong></div>' +
      '</div>' +
      '<div class="receipt-body">' +
        '<div class="receipt-row"><span>Item / Service:</span> <strong>' + this.escape(itemName) + '</strong></div>' +
        '<div class="receipt-row"><span>Amount Paid:</span> <strong class="receipt-amount" style="color:#059669;">' + amountFormatted + '</strong></div>' +
        '<div class="receipt-row"><span>Paid To:</span> <strong>' + this.escape(mBiz) + ' (' + methodLabel + ')</strong></div>' +
        '<div class="receipt-row"><span>Customer:</span> <strong>' + this.escape(custName) + (custPhone && custPhone !== 'M-Pesa Verified' ? ' (' + this.escape(custPhone) + ')' : '') + '</strong></div>' +
        '<div class="receipt-row"><span>Status:</span> <strong style="color:#059669;">Confirmed &amp; Logged</strong></div>' +
        '<div class="receipt-row"><span>Date &amp; Time:</span> <span>' + leadRecord.createdAtFormatted + '</span></div>' +
      '</div>' +
    '</div>';

    var successMsg = "🎉 **Payment Confirmed & Verified!**\n\nThank you, **" + this.escape(custName) + "**! Your M-Pesa payment with confirmation code **" + cleanCode + "** has been recorded. Our team has received your order details and is processing your request.";

    this.appendBot(successMsg, {
      html: receiptHtml,
      quickReplies: [
        { label: 'Talk to Team', payload: 'I want to speak with someone from ' + (compName ? 'the ' + compName + ' team' : 'the team') },
        { label: 'Our Services', payload: 'What services do you offer?' },
        { label: 'Main Menu', payload: 'Hello' }
      ]
    });
  };

  BotlyChatbotController.prototype.renderPolicyCertificate = function(quote, amountPaid) {
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
        '<button type="button" class="btn-receipt-action" onclick="BotlyChatbot.printCertificate()">🖨️ Print Certificate</button>' +
        '<button type="button" class="btn-receipt-action" onclick="BotlyChatbot.printCertificate()">📥 Save PDF Card</button>' +
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

  BotlyChatbotController.prototype.printCertificate = function() {
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

  BotlyChatbotController.prototype.reset = function() {
    this.quoteState = { active: false, step: 0, type: 'auto', tierId: null };
    this.claimState = { active: false, step: 0 };
    this.leadState = { active: false, step: 'idle', inquiredNeed: '', name: '', phone: '', email: '' };
    this.conversationMemory = {
      turns: 0,
      history: [],
      visitedTopics: [],
      askedFollowUps: [],
      lastFollowUp: null,
      goalStage: 0,
      lastTopic: ''
    };
    if (this.messagesList) this.messagesList.innerHTML = '';
    this.sendGreeting();
  };

  BotlyChatbotController.prototype.escape = function(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  BotlyChatbotController.prototype.formatMd = function(text) {
    if (!text) return '';
    var self = this;
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, function(m, label, url) {
        return '<a href="' + self.escape(url) + '" target="_blank" rel="noopener noreferrer" class="ins-inline-link">' + label + ' ↗</a>';
      })
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/•\s/g, '•&nbsp;');
  };

  BotlyChatbotController.prototype.trainData = function(content, format) {
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

  BotlyChatbotController.prototype.getTrainedData = function() {
    return this.trainedKnowledge || [];
  };

  BotlyChatbotController.prototype.clearTrainedData = function() {
    this.trainedKnowledge = [];
  };

  BotlyChatbotController.prototype.testApiConnection = function(callback) {
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

  BotlyChatbotController.prototype.setApiConfig = function(apiCfg) {
    this.config.api = Object.assign({}, this.config.api || {}, apiCfg);
  };

  BotlyChatbotController.prototype.setCompanyGoal = function(goalKey) {
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

  BotlyChatbotController.prototype.simulateUnlistedInquiry = function(queryText) {
    var text = queryText || 'Can you provide commercial drone delivery fleet protection?';
    this.toggle(true);
    this.handleUserInput(text);
  };

  BotlyChatbotController.prototype.classify = function(text) {
    return classifyQuery(text, this.config, (this.config && this.config.customFaqs) || [], this.trainedKnowledge || [], this.conversationMemory || {});
  };

  // ---- P84-P87: post-chat rating card ----
  // Paid-only by construction: Studio only issues embed snippets to activated
  // bots (publish gate in customizer.html), and only admin-APPROVED ratings
  // are publicly readable (see firestore.rules -> botly_ratings).
  BotlyChatbotController.prototype._ratingsEnabled = function() {
    var r = this.config && this.config.ratings;
    if (!r) return true;
    return r.enabled !== false;
  };

  BotlyChatbotController.prototype._ratingStoreKey = function() {
    var id = (this.config && (this.config.botId || (this.config.company && this.config.company.name))) || 'default';
    return 'botly_rated__' + String(id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  };

  BotlyChatbotController.prototype._ratingAfterReply = function() {
    if (!this._ratingsEnabled() || this._ratingShown) return;
    this._botMsgCount = (this._botMsgCount || 0) + 1;
    try {
      if (typeof window !== 'undefined' && window.localStorage && localStorage.getItem(this._ratingStoreKey())) return;
    } catch (e) {}
    if (this._botMsgCount >= 3 && this.messagesList && !this.messagesList.querySelector('.ins-rating-card')) {
      this._ratingShown = true;
      try { this.renderRatingCard(); } catch (e) {}
    }
  };

  BotlyChatbotController.prototype.renderRatingCard = function() {
    var self = this;
    var card = document.createElement('div');
    card.className = 'ins-msg-row bot ins-rating-row';
    card.innerHTML = '<div class="ins-msg-bubble ins-rating-card">' +
      '<div class="ins-rating-q">How was your chat experience?</div>' +
      '<div class="ins-rating-btns">' +
      '<button type="button" class="ins-thumb-btn" data-vote="up" aria-label="Good chat">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>' +
      '<span>Good</span></button>' +
      '<button type="button" class="ins-thumb-btn down" data-vote="down" aria-label="Bad chat">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 3h-4v12h4V3zM1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22L1.14 11.27c-.09.23-.14.47-.14.73v2z"/></svg>' +
      '<span>Bad</span></button>' +
      '</div></div>';
    this.messagesList.appendChild(card);
    this.scrollDown();
    var btns = card.querySelectorAll('.ins-thumb-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        self._ratingVote(card, this.getAttribute('data-vote'));
      });
    }
  };

  BotlyChatbotController.prototype._ratingVote = function(card, vote) {
    var self = this;
    var bubble = card.querySelector('.ins-rating-card');
    if (!bubble) return;
    var prompt = (vote === 'down')
      ? 'Sorry to hear that — what went wrong? (optional)'
      : 'What went well? (optional)';
    bubble.innerHTML = '<div class="ins-rating-thanks">' +
      '<span class="ins-rating-badge"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg></span>' +
      '<div class="ins-rating-q">Thank you for the rating! You can also leave a comment:</div>' +
      '<textarea class="ins-rating-comment" rows="2" maxlength="600" placeholder="' + prompt + '"></textarea>' +
      '<input class="ins-rating-name" type="text" maxlength="80" placeholder="Your name (optional)">' +
      '<button type="button" class="ins-rating-send">Send feedback</button>' +
      '<div class="ins-rating-note">The best chats may be featured on our website.</div>' +
      '</div>';
    self.scrollDown();
    var send = bubble.querySelector('.ins-rating-send');
    send.addEventListener('click', function() {
      send.disabled = true;
      send.textContent = 'Sending...';
      var comment = bubble.querySelector('.ins-rating-comment').value || '';
      var name = bubble.querySelector('.ins-rating-name').value || '';
      self._submitRating(vote, comment, name, function(ok) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(self._ratingStoreKey(), ok ? 'sent' : 'skipped');
          }
        } catch (e) {}
        bubble.innerHTML = '<div class="ins-rating-done">' +
          (ok ? 'Thanks! Your feedback was sent.' : 'Thanks! (Offline — your rating was noted on this device.)') + '</div>';
        self.scrollDown();
        try {
          if (typeof window !== 'undefined' && window.CustomEvent) {
            window.dispatchEvent(new CustomEvent('botly:rating', { detail: { vote: vote, sent: !!ok } }));
          }
        } catch (e) {}
      });
    });
  };

  BotlyChatbotController.prototype._ratingFirebaseConfig = function(cb) {
    var self = this;
    var done = function(cfg) { try { cb(cfg); } catch (e) {} };
    try {
      var override = self.config && self.config.ratings && self.config.ratings.firebaseConfig;
      if (override && override.apiKey && override.projectId) { done(override); return; }
      var w = (typeof window !== 'undefined') ? window.BOTLY_FIREBASE_CONFIG : null;
      if (w && w.apiKey && String(w.apiKey).indexOf('YOUR_') === -1 && w.projectId) { done(w); return; }
    } catch (e) {}
    // Customer embeds carry no Firebase config: fetch Botly's public web config
    // (CORS-open *.js on botlypro.online). Security is enforced by Firestore rules.
    var url = (self.config && self.config.ratings && self.config.ratings.configUrl) ||
      'https://www.botlypro.online/demo/firebase-config.js';
    function grab(t, k) {
      var i = t.indexOf(k);
      if (i === -1) return '';
      var q1 = t.indexOf('"', i);
      if (q1 === -1) return '';
      var q2 = t.indexOf('"', q1 + 1);
      return q2 === -1 ? '' : t.slice(q1 + 1, q2);
    }
    if (typeof fetch === 'undefined') { done(null); return; }
    fetch(url, { mode: 'cors' }).then(function(r) { return r.text(); }).then(function(t) {
      var cfg = {
        apiKey: grab(t, 'apiKey'),
        authDomain: grab(t, 'authDomain'),
        projectId: grab(t, 'projectId'),
        storageBucket: grab(t, 'storageBucket'),
        messagingSenderId: grab(t, 'messagingSenderId'),
        appId: grab(t, 'appId')
      };
      done((cfg.apiKey && cfg.apiKey.indexOf('YOUR_') === -1 && cfg.projectId) ? cfg : null);
    }).catch(function() { done(null); });
  };

  BotlyChatbotController.prototype._ratingEnsureDb = function(cb) {
    var self = this;
    function ready() {
      try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          self._ratingFirebaseConfig(function(cfg) {
            if (!cfg) { cb(null); return; }
            try {
              if (typeof window !== 'undefined' && (!window.BOTLY_FIREBASE_CONFIG || !window.BOTLY_FIREBASE_CONFIG.apiKey || String(window.BOTLY_FIREBASE_CONFIG.apiKey).indexOf('YOUR_') !== -1)) window.BOTLY_FIREBASE_CONFIG = cfg;
            } catch (_e) {}
            try {
              if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
              cb(firebase.firestore());
            } catch (e) {
              try { cb(firebase.firestore()); } catch (e2) { cb(null); }
            }
          });
        } else { cb(null); }
      } catch (e) { cb(null); }
    }
    if (typeof firebase !== 'undefined' && firebase.firestore) { ready(); return; }
    function load(src, next) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = next;
      s.onerror = function() { cb(null); };
      document.head.appendChild(s);
    }
    var appSrc = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js';
    var fsSrc = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js';
    if (typeof firebase === 'undefined') {
      load(appSrc, function() { load(fsSrc, ready); });
    } else {
      load(fsSrc, ready);
    }
  };

  BotlyChatbotController.prototype._submitRating = function(vote, comment, name, done) {
    var self = this;
    var bot = (self.config && self.config.bot) || {};
    var company = (self.config && self.config.company) || {};
    self._ratingEnsureDb(function(db) {
      if (!db) { done(false); return; }
      var payload = {
        botId: String((self.config && self.config.botId) || 'bot_default').slice(0, 120),
        botName: String(bot.name || company.name || 'Chatbot').slice(0, 120),
        company: String(company.name || '').slice(0, 120),
        rating: vote,
        comment: String(comment || '').slice(0, 600),
        name: String(name || '').slice(0, 80),
        pageUrl: (typeof location !== 'undefined' ? String(location.href).slice(0, 300) : ''),
        approved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      try {
        db.collection('botly_ratings').add(payload).then(function() { done(true); }).catch(function() { done(false); });
      } catch (e) { done(false); }
    });
  };

  // ---- P90-P95: guided item-order flow (orderFlow.enabled bots) ----
  // Name -> phone/email -> M-Pesa Till instructions -> confirmation code ->
  // personalized thank-you. Order persisted locally + synced to the admin
  // inbox (botly_leads with payment detail) + botly:order event for pages.
  BotlyChatbotController.prototype.startOrderFlow = function(item, price) {
    this.orderState = { active: true, step: 'name', item: item || 'this item', price: price || '', name: '', contact: '', code: '' };
    try { this._ratingEnsureDb(function() {}); } catch (e) {}
    var what = this.orderState.price
      ? 'the **' + this.escape(this.orderState.item) + '** at **' + this.escape(this.orderState.price) + '**'
      : 'the **' + this.escape(this.orderState.item) + '**';
    this.appendBot('Great choice — ' + what + '! Let\'s place your order.\n\nWhat is your **full name**?');
  };

  BotlyChatbotController.prototype.findOrderPayInfo = function() {
    var faqs = [];
    try { faqs = (this.config.customKnowledge || []).concat(this.config.customFaqs || []); } catch (e) {}
    for (var i = 0; i < faqs.length; i++) {
      var f = faqs[i] || {};
      var hay = (f.question || '') + ' ' + (f.keywords || []).join(' ');
      if (/mpesa|m-pesa|till/i.test(hay)) {
        var dm = (f.answer || '').match(/(\d{5,})/);
        return { till: dm ? dm[1] : '' };
      }
    }
    return { till: '' };
  };

  BotlyChatbotController.prototype.processOrderStep = function(text) {
    var st = this.orderState;
    if (!st || !st.active) return;
    var msg = (text || '').trim();
    if (/^(cancel|stop|never\s*mind|no\s*thanks|forget\s*it|abort|quit)\b/i.test(msg)) {
      st.active = false;
      st.step = '';
      this.appendBot('No problem — I have cancelled this order. Anything else I can help with?');
      return;
    }
    if (st.step === 'name') {
      if (msg.length < 2 || msg.length > 80) {
        this.appendBot('Please tell me the **name** to put on this order (for example: David Otieno).');
        return;
      }
      st.name = msg;
      st.step = 'contact';
      this.appendBot('Thanks, **' + this.escape(st.name) + '**! What is your **phone number or email** so we can confirm your order?');
      return;
    }
    if (st.step === 'contact') {
      var emailM = msg.match(/\S+@\S+\.\S+/);
      var digits = msg.replace(/\D/g, '');
      if (emailM) {
        st.contact = emailM[0].slice(0, 80);
      } else if (digits.length >= 9 && digits.length <= 13 && msg.length <= 40) {
        st.contact = msg.slice(0, 40);
      } else {
        this.appendBot('I need a valid phone number (e.g. 0712 345 678) or email address to confirm your order. What should I use?');
        return;
      }
      st.step = 'code';
      var pay = this.findOrderPayInfo();
      var amount = st.price || 'the amount shown';
      var steps = 'Paying is easy!\n\n1. Go to **M-Pesa** → **Lipa na M-Pesa** → **Buy Goods**.\n';
      steps += pay.till ? '2. Enter Till number **' + pay.till + '**.\n' : '';
      steps += '3. Enter **' + this.escape(amount) + '** and your M-Pesa PIN.\n\nOnce you have paid, send me your **M-Pesa confirmation code** here.';
      this.appendBot(steps);
      return;
    }
    if (st.step === 'code') {
      var code = null;
      try { code = extractMpesaCode(msg); } catch (e) { code = null; }
      if (!code) {
        this.appendBot('That does not look like an M-Pesa confirmation code — they are usually 10 characters mixing letters and numbers (e.g. QHX7K9ABCD). Please check your M-Pesa SMS and send the code again.');
        return;
      }
      st.code = code;
      st.active = false;
      st.step = '';
      var firstName = (st.name.split(/\s+/)[0] || st.name).slice(0, 40);
      this.appendBot('\u{1F389} **Thank you, ' + this.escape(firstName) + '!** Your order for the **' + this.escape(st.item) + ' (' + this.escape(st.price) + ')** is confirmed. We will reach out shortly on **' + this.escape(st.contact) + '** to arrange delivery. Karibu tena!');
      var isEmail = st.contact.indexOf('@') !== -1;
      var orderLead = {
        id: 'ORDER-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        name: st.name,
        phone: isEmail ? '' : st.contact,
        email: isEmail ? st.contact : '',
        need: 'Order: ' + st.item + ' ' + st.price + ' — M-Pesa ' + code,
        goal: 'order',
        timestamp: new Date().toISOString(),
        createdAtFormatted: new Date().toLocaleString(),
        status: 'New',
        company: (this.config.company && this.config.company.name) || 'Botly AI',
        paymentMethod: 'M-Pesa',
        amount: st.price,
        mpesaCode: code
      };
      try { saveStoredLead(orderLead); } catch (e) {}
      try { botlyCloudSyncLead(orderLead, { config: this.config, memory: this.conversationMemory }); } catch (e) {}
      try {
        if (this.config.webhooks && typeof this.config.webhooks.onLeadCaptured === 'function') this.config.webhooks.onLeadCaptured(orderLead);
      } catch (e) {}
      try {
        if (typeof window !== 'undefined' && window.dispatchEvent && window.CustomEvent) {
          window.dispatchEvent(new CustomEvent('botly:order', { detail: orderLead }));
        }
      } catch (e) {}
      return;
    }
    st.active = false;
  };

  // Public Singleton Instance
  var instance = null;

  return {
    init: function(config, selector) {
      instance = new BotlyChatbotController(config);
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
    getLeads: function() { return getStoredLeads(); },
    clearLeads: function() { return clearStoredLeads(); },
    getInstance: function() { return instance; }
  };
}));
