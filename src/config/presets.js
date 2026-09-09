/**
 * Ready-made Brand Presets for Quick Customization
 * Demonstrates how easily ANY insurance company can brand and adapt this chatbot.
 */

export const BRAND_PRESETS = {
  aegisguard: {
    name: 'AegisGuard Insurance (Default)',
    company: {
      name: 'AegisGuard Insurance',
      tagline: 'Smart, Instant & Compassionate Protection',
      supportEmail: 'care@aegisguard.example.com',
      supportPhone: '+1 (800) 555-0199'
    },
    bot: {
      name: 'Aegis AI',
      title: 'Certified Insurance Advisor'
    },
    theme: {
      primaryColor: '#2563eb',
      primaryGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      primaryHover: '#1e40af',
      accentColor: '#10b981',
      headerBg: '#1e293b',
      userBubbleBg: '#2563eb'
    },
    currency: { code: 'USD', symbol: '$', locale: 'en-US' }
  },

  medicare: {
    name: 'VitalHealth Life & Medical',
    company: {
      name: 'VitalHealth Assurance',
      tagline: 'Your Health & Well-being, Guarded Every Second',
      supportEmail: 'membership@vitalhealth.example.com',
      supportPhone: '+1 (888) 432-8482'
    },
    bot: {
      name: 'Dr. Vital AI',
      title: 'Health Coverage Concierge'
    },
    theme: {
      primaryColor: '#059669', // Emerald medical green
      primaryGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      primaryHover: '#065f46',
      accentColor: '#3b82f6',
      headerBg: '#064e3b',
      userBubbleBg: '#059669'
    },
    currency: { code: 'USD', symbol: '$', locale: 'en-US' }
  },

  autoshield: {
    name: 'TurboDrive Motor Assurance',
    company: {
      name: 'TurboDrive Auto Insurance',
      tagline: 'Instant Quotes, Fast Track Claims & Zero Hassle',
      supportEmail: 'dispatch@turbodrive.example.com',
      supportPhone: '+1 (800) 722-3748'
    },
    bot: {
      name: 'TurboBot',
      title: 'Auto Claims & Underwriter'
    },
    theme: {
      primaryColor: '#dc2626', // Racing Red
      primaryGradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      primaryHover: '#991b1b',
      accentColor: '#f59e0b',
      headerBg: '#18181b',
      userBubbleBg: '#dc2626'
    },
    currency: { code: 'USD', symbol: '$', locale: 'en-US' }
  },

  luxuryestate: {
    name: 'HavenStone Property & Estate',
    company: {
      name: 'HavenStone Wealth & Home Protection',
      tagline: 'Bespoke Underwriting for Distinguished Properties',
      supportEmail: 'concierge@havenstone.example.com',
      supportPhone: '+1 (877) 928-3600'
    },
    bot: {
      name: 'Haven Concierge',
      title: 'Private Estate Risk Advisor'
    },
    theme: {
      primaryColor: '#7c3aed', // Royal Violet
      primaryGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      primaryHover: '#5b21b6',
      accentColor: '#fbbf24',
      headerBg: '#0f172a',
      userBubbleBg: '#7c3aed'
    },
    currency: { code: 'USD', symbol: '$', locale: 'en-US' }
  },

  africashield: {
    name: 'Kilima Bima (East Africa / M-Pesa Ready)',
    company: {
      name: 'Kilima Bima Insurance',
      tagline: 'Bima Rahisi, Pap Hapo kwa Simu Yako',
      supportEmail: 'huduma@kilimabima.example.co.ke',
      supportPhone: '+254 700 000 000'
    },
    bot: {
      name: 'Bima Rafiki AI',
      title: 'Mshauri wa Bima 24/7'
    },
    theme: {
      primaryColor: '#16a34a', // Safari green
      primaryGradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
      primaryHover: '#166534',
      accentColor: '#ea580c',
      headerBg: '#14532d',
      userBubbleBg: '#16a34a'
    },
    currency: { code: 'KES', symbol: 'KSh ', locale: 'en-KE' }
  }
};

export default BRAND_PRESETS;
