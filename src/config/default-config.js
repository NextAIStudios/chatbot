/**
 * Default Configuration for Insurance Chatbot
 * Easily customizable for ANY insurance company (Auto, Health, Home, Life, Travel, Commercial)
 */

export const DEFAULT_CONFIG = {
  // 🏢 Company Branding
  company: {
    name: 'AegisGuard Insurance',
    tagline: 'Smart, Instant & Compassionate Protection',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-2.33v8.02z"/></svg>',
    supportEmail: 'care@aegisguard.example.com',
    supportPhone: '+1 (800) 555-0199',
    websiteUrl: 'https://aegisguard.example.com',
    licenseNumber: 'INS-LIC-2026-882190'
  },

  // 🤖 Bot Persona & Tone
  bot: {
    name: 'Aegis AI',
    title: 'Certified Insurance Advisor',
    avatar: null, // Dynamic vector Insurance Shield Logo with AI Protective Star
    greeting: "Hello! 👋 I'm **Aegis**, your 24/7 licensed digital insurance assistant.\n\nI can calculate instant quotes, guide your claims, answer coverage questions, or process your policy payments securely right here in chat.",
    initialQuickReplies: [
      { label: '🚗 Auto Quote', payload: 'intent_quote_auto' },
      { label: '🏥 Health Plans', payload: 'intent_quote_health' },
      { label: '📑 File a Claim', payload: 'intent_claim' },
      { label: '💳 Pay Premium', payload: 'intent_pay' },
      { label: '❓ What do you cover?', payload: 'intent_coverage_overview' }
    ],
    typingDelayMs: 400
  },

  // 🎨 Visual Theme (Any color scheme can be injected)
  theme: {
    primaryColor: '#2563eb',          // Brand primary (blues, greens, purples, reds, etc.)
    primaryGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    primaryHover: '#1e40af',
    accentColor: '#10b981',           // Success / highlights
    backgroundColor: '#ffffff',
    surfaceColor: '#f8fafc',
    headerBg: '#1e293b',
    headerText: '#ffffff',
    botBubbleBg: '#f1f5f9',
    botBubbleText: '#0f172a',
    userBubbleBg: '#2563eb',
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

  // 📑 Custom FAQs (Allows companies to inject proprietary FAQs)
  customFaqs: []
};

export default DEFAULT_CONFIG;
