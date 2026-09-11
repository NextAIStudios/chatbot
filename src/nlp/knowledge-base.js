/**
 * Insurance Domain Knowledge Base
 * Covers comprehensive questions across Auto, Health, Home, Life, Travel, Claims, and Payments.
 */

export const INSURANCE_KNOWLEDGE_BASE = [
  // -------------------------------------------------------------
  // AUTO / MOTOR INSURANCE
  // -------------------------------------------------------------
  {
    id: 'auto_comp_vs_third_party',
    category: 'auto',
    tags: ['auto', 'car', 'motor', 'comprehensive', 'third party', 'difference', 'liability'],
    keywords: ['difference between comprehensive and third party', 'third party vs comprehensive', 'what is comprehensive', 'what is third party'],
    question: 'What is the difference between Comprehensive and Third-Party car insurance?',
    answer: `🚗 **Comprehensive vs. Third-Party Coverage:**\n\n• **Third-Party Only (TPO):** The legal minimum. It covers bodily injury and property damage you cause to *other people* and their vehicles. It does **not** pay for repairs to your own car.\n• **Third-Party, Fire & Theft (TPFT):** Covers other people's losses PLUS damage to your car caused by fire, lightning, explosion, or theft.\n• **Comprehensive Shield (Recommended):** The ultimate peace of mind. Covers third-party liabilities PLUS accidental damage, rollover, vandalism, windshield breakage, natural disasters, and repairs to your own car regardless of who was at fault!`
  },
  {
    id: 'auto_accident_steps',
    category: 'auto',
    tags: ['accident', 'crash', 'collision', 'emergency', 'what to do'],
    keywords: ['car accident', 'i had an accident', 'what to do if accident', 'crashed my car'],
    question: 'What should I do immediately if I am involved in a car accident?',
    answer: `🚨 **Immediate Steps After an Accident:**\n\n1. **Ensure Safety:** Turn on hazard lights, check for injuries, and call emergency medical services (911 / 112 / 999) if anyone is injured.\n2. **Do Not Admit Fault:** Be polite and exchange contact/insurance details, but leave liability determination to investigators.\n3. **Document the Scene:** Take clear photos of all vehicles, damage, license plates, road signs, and skid marks.\n4. **Obtain Police Abstract:** Request a police report or incident reference number.\n5. **Notify Us Promptly:** Tap **"📑 File a Claim"** right here in chat to start your claim and request immediate towing assistance!`
  },
  {
    id: 'auto_deductible',
    category: 'auto',
    tags: ['deductible', 'excess', 'auto', 'premium'],
    keywords: ['what is deductible', 'how does deductible work', 'what is excess in car insurance'],
    question: 'What is an insurance deductible (excess)?',
    answer: `💰 **Insurance Deductible Explained:**\n\nThe deductible (also known as "excess") is the out-of-pocket amount you agree to pay toward a repair before your insurance covers the rest.\n\n*Example:* If your repair costs **$2,500** and your deductible is **$500**, you pay $500 and your insurer pays the remaining **$2,000**.\n\n💡 **Tip:** Choosing a higher deductible lowers your monthly premium, while a lower or $0 deductible gives you maximum coverage during claims.`
  },
  {
    id: 'auto_discounts',
    category: 'auto',
    tags: ['discount', 'cheaper', 'lower rate', 'save', 'safe driver'],
    keywords: ['how to get discount', 'car insurance discount', 'save money on insurance', 'promo code'],
    question: 'How can I lower my auto insurance premium?',
    answer: `🏷️ **Discounts Available to You:**\n\n• **Safe Driver Discount:** Up to 20% off for clean driving records.\n• **Multi-Policy Bundle:** Save 15% when you bundle Auto with Home or Health.\n• **Telematics / Low Mileage:** Drive under 7,500 miles/year for exclusive rate reductions.\n• **Anti-Theft Device:** Installing verified dashcams or GPS trackers saves up to 10%.\n• **Chatbot Promo:** Use code **"SAVE15"** at checkout today for an extra 15% discount!`
  },

  // -------------------------------------------------------------
  // HEALTH & MEDICAL INSURANCE
  // -------------------------------------------------------------
  {
    id: 'health_inpatient_vs_outpatient',
    category: 'health',
    tags: ['health', 'medical', 'inpatient', 'outpatient', 'hospital'],
    keywords: ['inpatient vs outpatient', 'what is inpatient', 'what is outpatient', 'hospitalization'],
    question: 'What is the difference between Inpatient and Outpatient coverage?',
    answer: `🏥 **Inpatient vs. Outpatient Care:**\n\n• **Inpatient Care:** Medical treatment that requires formal hospital admission and an overnight stay (e.g., surgeries, ICU, major trauma, oncology).\n• **Outpatient Care:** Consultations, diagnostic tests, lab work, prescriptions, and minor procedures where you visit a clinic and return home the same day.\n\nAll our **CareVital Health Plans** include generous inpatient limits, with optional outpatient, dental, and optical riders!`
  },
  {
    id: 'health_preexisting',
    category: 'health',
    tags: ['pre-existing', 'chronic', 'diabetes', 'hypertension', 'waiting period'],
    keywords: ['pre existing conditions', 'do you cover diabetes', 'waiting period for illness', 'chronic condition'],
    question: 'Are pre-existing medical conditions covered?',
    answer: `🩺 **Pre-Existing Conditions Coverage:**\n\nYes! Pre-existing conditions (e.g., asthma, hypertension, diabetes) are covered under our comprehensive health tiers after a standard **waiting period of 12 to 24 months** of continuous coverage.\n\nImmediate coverage is always active for accidents, acute infections, and emergency stabilization from Day 1.`
  },
  {
    id: 'health_copay_oop',
    category: 'health',
    tags: ['copay', 'coinsurance', 'out of pocket', 'maximum'],
    keywords: ['what is copay', 'what is coinsurance', 'out of pocket max'],
    question: 'What is a copay and out-of-pocket maximum?',
    answer: `💳 **Copay & Out-of-Pocket Maximum:**\n\n• **Copay:** A flat fee you pay at the time of care (e.g., $20 for a doctor visit or $10 for prescription drugs).\n• **Coinsurance:** Your percentage share of costs after meeting your deductible (e.g., you pay 20%, insurance pays 80%).\n• **Out-of-Pocket Maximum:** The financial ceiling. Once your total deductibles, copays, and coinsurance hit this cap in a policy year, **we pay 100%** of all covered medical bills for the rest of the year!`
  },

  // -------------------------------------------------------------
  // HOME & PROPERTY INSURANCE
  // -------------------------------------------------------------
  {
    id: 'home_dwelling_vs_contents',
    category: 'home',
    tags: ['home', 'property', 'dwelling', 'contents', 'renters'],
    keywords: ['dwelling vs personal property', 'what is contents insurance', 'renters vs homeowners'],
    question: 'What is the difference between Dwelling and Contents insurance?',
    answer: `🏡 **Dwelling vs. Contents Insurance:**\n\n• **Dwelling Coverage:** Protects the physical structure of your house (walls, roof, foundation, built-in cabinetry, plumbing) against fire, storm, and structural hazards.\n• **Personal Property (Contents):** Protects everything inside that would fall out if you turned the house upside down! Furniture, electronics, appliances, clothing, and jewelry.\n\n🏢 **Renting?** Our **Renters Content Shield** covers all your personal possessions without charging for the building structure!`
  },
  {
    id: 'home_flood_earthquake',
    category: 'home',
    tags: ['flood', 'water', 'earthquake', 'storm', 'natural disaster'],
    keywords: ['does insurance cover flood', 'is earthquake covered', 'water backup'],
    question: 'Does standard homeowners insurance cover floods or earthquakes?',
    answer: `🌊 **Natural Disasters & Floods:**\n\nStandard home policies cover internal pipe bursts, windstorms, and fire, but typically exclude **rising flood waters and earth movement (earthquakes)**.\n\nHowever, you can add our **Flood & Sewer Backup Endorsement** or **Earthquake Rider** during your quote calculation for comprehensive peace of mind!`
  },

  // -------------------------------------------------------------
  // LIFE INSURANCE
  // -------------------------------------------------------------
  {
    id: 'life_term_vs_whole',
    category: 'life',
    tags: ['life', 'term life', 'whole life', 'death benefit', 'cash value'],
    keywords: ['term vs whole life', 'difference between term and whole life', 'what life insurance should i get'],
    question: 'Should I choose Term Life or Whole Life insurance?',
    answer: `🕊️ **Term Life vs. Whole Life:**\n\n• **Term Life (Most Affordable & Popular):** Protects you for a specific period (e.g., 10, 20, or 30 years). If you pass away during the term, your beneficiaries receive a tax-free cash payout. Perfect for replacing income while paying off mortgages or raising children.\n• **Whole Life (Permanent):** Covers you for your entire lifetime and builds tax-deferred cash surrender value over time.\n\n💡 *Rule of Thumb:* Most financial advisors recommend a Term Life policy equal to **10–12 times your annual income**.`
  },
  {
    id: 'life_medical_exam',
    category: 'life',
    tags: ['life', 'exam', 'medical test', 'blood test'],
    keywords: ['do i need a medical exam for life insurance', 'no exam life insurance', 'instant life insurance'],
    question: 'Do I need a medical exam to get life insurance?',
    answer: `🩺 **No-Exam Accelerated Underwriting:**\n\nFor coverage amounts up to **$500,000** for applicants under 50, our AI underwriter can approve your policy **instantly online** with zero medical exam or blood tests! We simply review digital health questionnaires and motor vehicle records.`
  },

  // -------------------------------------------------------------
  // TRAVEL INSURANCE
  // -------------------------------------------------------------
  {
    id: 'travel_coverage_benefits',
    category: 'travel',
    tags: ['travel', 'trip', 'flight', 'baggage', 'medical evacuation', 'overseas'],
    keywords: ['what does travel insurance cover', 'flight cancellation', 'lost luggage', 'emergency abroad'],
    question: 'What does travel insurance cover?',
    answer: `✈️ **GlobeTrek Travel Shield Covers:**\n\n1. **Emergency Medical Evacuation:** Up to $1,000,000 in overseas hospital bills and repatriation.\n2. **Trip Cancellation & Interruption:** Full reimbursement for non-refundable flights/hotels due to illness, injury, or severe weather.\n3. **Lost or Delayed Baggage:** Up to $2,500 to replace essentials and clothing.\n4. **Flight Delay & Missed Connection:** Meal & hotel vouchers after a 4-hour delay.\n5. **24/7 Worldwide Assistance:** Multilingual hotline available in 150+ countries!`
  },

  // -------------------------------------------------------------
  // CLAIMS FILING & SETTLEMENT
  // -------------------------------------------------------------
  {
    id: 'claims_how_to_file',
    category: 'claims',
    tags: ['claim', 'file claim', 'how to claim', 'submit claim', 'settlement'],
    keywords: ['how do i file a claim', 'start a claim', 'claim process', 'make a claim'],
    question: 'How do I file an insurance claim?',
    answer: `📑 **Filing a Claim is Simple and Fast:**\n\n1. Type **"File a claim"** or tap the button below to start our guided claims wizard right in this chat.\n2. Provide your policy number or registered email/phone.\n3. Describe what happened and upload incident photos or receipts.\n4. Our automated claims triage reviews eligible claims in **under 2 hours**, with direct bank or mobile money payout within 24–48 hours!`
  },
  {
    id: 'claims_timeline',
    category: 'claims',
    tags: ['claim time', 'how long claim takes', 'payout speed'],
    keywords: ['how long does claim take', 'when will i get paid', 'claim settlement time'],
    question: 'How long does it take to settle a claim?',
    answer: `⏱️ **Claim Settlement Speeds:**\n\n• **Fast-Track Auto Glass & Towing:** Instant authorization within 15 minutes.\n• **Minor Property & Outpatient Medical:** 24 to 48 hours.\n• **Complex Collision or Hospitalization:** 3 to 5 business days after full documentation is received.\n\nYou can check your live claim status anytime by asking *"Check claim status"* in this chat.`
  },

  // -------------------------------------------------------------
  // PAYMENTS & BILLING
  // -------------------------------------------------------------
  {
    id: 'payments_methods_accepted',
    category: 'payments',
    tags: ['payment', 'pay', 'checkout', 'credit card', 'mpesa', 'apple pay'],
    keywords: ['how can i pay', 'payment methods', 'do you accept cards', 'can i pay with mpesa', 'apple pay'],
    question: 'What payment methods do you accept?',
    answer: `💳 **Accepted Payment Methods:**\n\n• **Credit / Debit Cards:** Visa, Mastercard, American Express, Discover.\n• **Digital Wallets:** Apple Pay, Google Pay.\n• **Mobile Money:** M-Pesa, Airtel Money (East & Central Africa).\n• **Direct Bank Transfer / ACH:** Instant secure bank debits.\n\nAll transactions are encrypted with bank-level 256-bit TLS and processed directly in this chatbot!`
  },
  {
    id: 'payments_monthly_installments',
    category: 'payments',
    tags: ['installments', 'monthly payment', 'annual vs monthly', 'split payment'],
    keywords: ['can i pay monthly', 'pay in installments', 'do i have to pay full year'],
    question: 'Can I pay in monthly installments instead of annual upfront?',
    answer: `📅 **Flexible Payment Schedules:**\n\nYes! You can choose:\n• **Annual Single Payment:** Best value (saves 5% with no administration surcharges).\n• **Monthly Installments:** Spread payments smoothly across 12 equal monthly debits.\n• **Quarterly / Bi-annual:** Tailored to your financial schedule.`
  },
  {
    id: 'payments_certificate_proof',
    category: 'payments',
    tags: ['proof of insurance', 'certificate', 'card', 'download policy', 'receipt'],
    keywords: ['proof of insurance', 'certificate of insurance', 'download policy card', 'receipt'],
    question: 'How soon do I receive my Proof of Insurance & Policy Certificate?',
    answer: `📄 **Instant Digital Delivery:**\n\nThe moment your payment completes in this chat, your **Certificate of Insurance**, official digital policy card, and tax receipt are generated instantly!\n\nYou can download, print, or add the policy card directly to your Apple Wallet / Google Wallet.`
  },

  // -------------------------------------------------------------
  // GENERAL COMPANY & CONTACT
  // -------------------------------------------------------------
  {
    id: 'company_contact_info',
    category: 'company',
    tags: ['contact', 'phone', 'email', 'hours', 'support', 'human agent'],
    keywords: ['how to contact you', 'phone number', 'customer support email', 'talk to human agent', 'speak to representative'],
    answer: `📞 **Customer Care & Human Handover:**\n\n• **Toll-Free Phone:** +1 (800) 555-0199 (Mon–Fri 8am–8pm)\n• **Email Support:** care@botly.ai\n• **Claims Emergency Hotline:** 24/7/365 toll-free\n\nWould you like me to connect you with a live licensed underwriter right now? Type **"Connect to agent"** and leave your phone or email!`
  }
];

export default INSURANCE_KNOWLEDGE_BASE;
