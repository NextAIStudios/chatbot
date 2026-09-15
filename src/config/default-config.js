/**
 * Default Configuration for Insurance Chatbot
 * Easily customizable for ANY insurance company (Auto, Health, Home, Life, Travel, Commercial)
 */

// 🎯 Available Company Goals Catalog
export const COMPANY_GOALS = {
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
    askNamePrompt: "That's a fantastic inquiry{needTopic}! While I don't have all those details right here in my instant memory, our team can help you with exactly what you need.\n\nMay I please have your **full name**?",
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

export const DEFAULT_CONFIG = {
  // 🎯 Primary Company Goal
  goal: 'lead_generation', // 'lead_generation' | 'payment_checkout' | 'customer_support' | 'consultation_booking'

  // 🏢 Company Branding
  company: {
    name: 'Botly Insurance',
    tagline: 'Next-Gen Insurance AI Platform',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-2.33v8.02z"/></svg>',
    supportEmail: 'care@botly.ai',
    supportPhone: '+1 (800) 555-0199',
    websiteUrl: 'https://botly.ai',
    licenseNumber: 'INS-LIC-2026-882190'
  },

  // 📋 Lead Capture & Custom Inquiries
  leadCapture: {
    enabled: true,
    triggerOnUnlisted: true,
    askNamePrompt: "That's a fantastic inquiry{needTopic}! While I don't have all the exact specifications for that right here in my instant guide, I'd love to connect you with our specialist team so they can prepare a custom solution and assist you directly.\n\nMay I please have your **full name**?",
    askPhonePrompt: "Wonderful to meet you, **{name}**! 🤝\n\nWhat is the best **phone number** (or direct contact) for our specialist team to reach you?",
    confirmationMessage: "🎉 **Thank you, {name}!**\n\nYour request for **{need}** has been saved and routed directly to our specialist team. An advisor will reach out to you at **{phone}** shortly.",
    followUpQuestion: "💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant quote rates or see an overview of our coverage?",
    storageKey: 'botly_captured_leads',
    requirePhone: true
  },

  // 💳 In-Chat Payment & Checkout
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

  // 💬 Human Follow-up Dynamics
  followUpDynamics: {
    enabled: true,
    tone: 'consultative' // 'consultative' | 'sales' | 'support' | 'direct'
  },

  // 🤖 Bot Persona & Tone
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

  // 🎨 Visual Theme (Any color scheme can be injected)
  theme: {
    primaryColor: '#18221c',          // Botly obsidian
    primaryGradient: 'linear-gradient(135deg, #18221c 0%, #26352c 100%)',
    primaryHover: '#26352c',
    accentColor: '#9be553',           // Botly vibrant lime
    backgroundColor: '#ffffff',
    surfaceColor: '#f8fafc',
    headerBg: '#18221c',
    headerText: '#ffffff',
    botBubbleBg: '#f1f5f9',
    botBubbleText: '#0f172a',
    userBubbleBg: '#18221c',
    userBubbleText: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '16px',
    bubbleRadius: '14px',
    position: 'bottom-right',          // 'bottom-right' | 'bottom-left'
    zIndex: 99999,
    soundEffects: true,
    enableVoiceInput: true
  },

  // 💰 Currency & Rates
  currency: {
    code: 'KES',
    symbol: 'KSh ',
    locale: 'en-KE'
  },

  // 🛡️ Insurance Product Catalog (Customizable for any company)
  products: {
    auto: {
      name: 'Comprehensive Auto Shield',
      icon: '🚗',
      description: 'Total collision, comprehensive, third-party liability, and 24/7 roadside rescue.',
      baseAnnualRate: 48000,
      tiers: [
        { id: 'auto_standard', name: 'Liability Plus', deductible: 15000, rateMultiplier: 0.75, coverageLimit: 1500000 },
        { id: 'auto_comp', name: 'Comprehensive Shield', deductible: 10000, rateMultiplier: 1.0, coverageLimit: 3000000, popular: true },
        { id: 'auto_elite', name: 'Elite Premier Zero-Ded', deductible: 0, rateMultiplier: 1.35, coverageLimit: 6000000 }
      ],
      addons: [
        { id: 'addon_roadside', name: '24/7 Roadside Rescue & Towing', costPerYear: 3500 },
        { id: 'addon_rental', name: 'Courtesy Car Replacement (10 Days)', costPerYear: 4000 },
        { id: 'addon_glass', name: 'Zero-Excess Windshield Replacement', costPerYear: 2500 }
      ]
    },
    health: {
      name: 'CareVital Health & Medical',
      icon: '🏥',
      description: 'Inpatient, outpatient, prescription drug coverage, and telemedicine.',
      baseAnnualRate: 72000,
      tiers: [
        { id: 'health_silver', name: 'Silver Care', deductible: 10000, rateMultiplier: 0.8, coverageLimit: 2000000 },
        { id: 'health_gold', name: 'Gold Advantage', deductible: 5000, rateMultiplier: 1.1, coverageLimit: 5000000, popular: true },
        { id: 'health_platinum', name: 'Platinum Complete', deductible: 0, rateMultiplier: 1.5, coverageLimit: 10000000 }
      ],
      addons: [
        { id: 'addon_dental', name: 'Comprehensive Dental Care', costPerYear: 8500 },
        { id: 'addon_vision', name: 'Vision Care & Designer Frames', costPerYear: 5000 },
        { id: 'addon_maternity', name: 'Maternity Cover & Newborn Care', costPerYear: 12000 }
      ]
    },
    home: {
      name: 'HomeGuard Property & Contents',
      icon: '🏡',
      description: 'Dwelling, personal property, fire, storm, theft, and personal liability protection.',
      baseAnnualRate: 28000,
      tiers: [
        { id: 'home_renters', name: 'Renters Content Shield', deductible: 5000, rateMultiplier: 0.5, coverageLimit: 1500000 },
        { id: 'home_standard', name: 'Homeowners Essential', deductible: 10000, rateMultiplier: 1.0, coverageLimit: 15000000, popular: true },
        { id: 'home_estate', name: 'Estate Luxury Protection', deductible: 15000, rateMultiplier: 1.6, coverageLimit: 40000000 }
      ],
      addons: [
        { id: 'addon_flood', name: 'Flood & Water Backup Endorsement', costPerYear: 4500 },
        { id: 'addon_jewelry', name: 'Scheduled High-Value Jewelry / Electronics', costPerYear: 3500 }
      ]
    },
    life: {
      name: 'EverSure Term Life',
      icon: '🕊️',
      description: 'Guaranteed lump-sum financial security for your loved ones.',
      baseAnnualRate: 36000,
      tiers: [
        { id: 'life_5m', name: '20-Year Term (KSh 5,000,000)', benefit: 5000000, rateMultiplier: 0.8 },
        { id: 'life_10m', name: '20-Year Term (KSh 10,000,000)', benefit: 10000000, rateMultiplier: 1.0, popular: true },
        { id: 'life_25m', name: '30-Year Term (KSh 25,000,000)', benefit: 25000000, rateMultiplier: 1.8 }
      ],
      addons: [
        { id: 'addon_critical', name: 'Accelerated Critical Illness Rider', costPerYear: 6000 },
        { id: 'addon_disability', name: 'Premium Waiver on Disability', costPerYear: 3000 }
      ]
    },
    travel: {
      name: 'GlobeTrek Travel Shield',
      icon: '✈️',
      description: 'Emergency international medical evacuation, trip cancellation, and baggage loss.',
      baseAnnualRate: 15000,
      tiers: [
        { id: 'travel_single', name: 'Single Trip Worldwide', rateMultiplier: 0.6 },
        { id: 'travel_annual', name: 'Multi-Trip Annual Pass', rateMultiplier: 1.0, popular: true },
        { id: 'travel_adventure', name: 'Extreme Sports & Safari Endorsement', rateMultiplier: 1.4 }
      ],
      addons: [
        { id: 'addon_cancel_any', name: 'Cancel For Any Reason (CFAR 75%)', costPerYear: 2500 }
      ]
    }
  },

  // 💳 Payment Gateway & Checkout Configuration
  payment: {
    enabled: true,
    provider: 'mock', // 'mock' | 'stripe'
    stripePublishableKey: '',
    supportedMethods: ['card', 'apple_pay', 'google_pay', 'mpesa', 'bank_transfer'],
    allowPromoCodes: true,
    promoCodes: {
      'SAVE15': 0.15,
      'SAFE20': 0.20,
      'AEGIS10': 0.10,
      'NEWPOLICY': 0.12
    },
    taxRate: 0.045, // 4.5% statutory insurance regulatory tax/levy
    allowInstallments: true, // Pay monthly vs annual
    installmentSurchargePercent: 0.05
  },

  // 🧠 AI / NLP Configuration
  nlp: {
    mode: 'builtin', // 'builtin' | 'llm' | 'hybrid'
    llmProvider: 'gemini', // 'gemini' | 'openai' | 'custom'
    apiKey: '',
    endpointUrl: '',
    confidenceThreshold: 0.65,
    maxContextHistory: 10
  },

  // 🔌 Webhook & Integration Hooks
  webhooks: {
    onLeadCaptured: null,    // url string or callback fn
    onQuoteGenerated: null,
    onPaymentSuccess: null,
    onClaimSubmitted: null
  },

  // 📚 User Uploaded Training Data & Knowledge
  customKnowledge: [],

  // 🔌 Backend API Integration (REST, Webhook, or RAG API)
  api: {
    enabled: false,
    mode: 'hybrid', // 'hybrid' (API first, fallback to trained KB) | 'api_only' | 'local_only'
    endpoint: '',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    authBearer: '',
    payloadTemplate: '{"message": "{{message}}", "sessionId": "{{sessionId}}", "company": "{{companyName}}"}',
    responsePath: 'reply', // dot notation (e.g. 'reply', 'answer', 'choices.0.message.content')
    timeoutMs: 8000,
    mockServer: false
  },

  // 📑 Custom FAQs (Allows companies to inject proprietary FAQs)
  customFaqs: []
};

export default DEFAULT_CONFIG;
