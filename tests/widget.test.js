/**
 * Automated Verification Test Suite for Insurance Chatbot
 * Tests NLP intent classification, quote calculations, and payment receipt integrity.
 */

import { DEFAULT_CONFIG } from '../src/config/default-config.js';
import { IntentEngine } from '../src/nlp/intent-engine.js';
import { QuoteFlow } from '../src/flows/quote-flow.js';
import { ClaimsFlow } from '../src/flows/claims-flow.js';
import { ReceiptGenerator } from '../src/payments/receipt-generator.js';
import { formatScrapedProductsResult, fetchLiveScrapedProducts, searchProducts } from '../src/tools/tool-registry.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- 🧪 1. Testing NLP Intent Classification & Knowledge Base ---');
const engine = new IntentEngine(DEFAULT_CONFIG);

// Test 1: Greetings
const greetRes = engine.classify('Hello there!');
assert(greetRes.intent === 'greeting', 'Correctly identifies greeting');

// Test 2: Auto Comprehensive vs Third Party
const compRes = engine.classify('What is the difference between comprehensive and third party?');
assert(compRes.intent === 'faq' && compRes.reply.includes('Comprehensive vs. Third-Party'), 'Correctly answers Comprehensive vs Third Party FAQ');

// Test 3: Deductible FAQ
const dedRes = engine.classify('Can you explain what a deductible is?');
assert(dedRes.intent === 'faq' && dedRes.reply.includes('Deductible'), 'Correctly explains insurance deductible');

// Test 4: Pre-existing health conditions
const healthRes = engine.classify('Do you cover pre-existing conditions like diabetes?');
assert(healthRes.intent === 'faq' && healthRes.reply.includes('Pre-Existing'), 'Correctly explains pre-existing health condition rules');

// Test 5: Quote trigger
const quoteRes = engine.classify('I want a quote for my car insurance');
assert(quoteRes.action === 'OPEN_QUOTE_WIZARD' && quoteRes.productType === 'auto', 'Routes car quote prompt to Auto Quote Wizard');

// Test 6: Claims trigger
const claimRes = engine.classify('I was in a car accident and need to report damage');
assert(claimRes.action === 'OPEN_CLAIMS_WIZARD', 'Routes accident incident to Claims Wizard');

// Test 7: Payment trigger
const payRes = engine.classify('I want to pay my policy premium');
assert(payRes.action === 'OPEN_PAYMENT_WIZARD', 'Routes payment prompt to In-Chat Payment Wizard');

// Test 8: Human handover
const agentRes = engine.classify('Can I talk to a real human agent?');
assert(agentRes.intent === 'human_handover', 'Identifies escalation request to human underwriter');

console.log('\n--- 🧮 2. Testing Dynamic Quote Calculator ---');
const quoteFlow = new QuoteFlow(DEFAULT_CONFIG);
const qStart = quoteFlow.start('auto');
assert(qStart.cards.length === 3, 'Auto quote provides 3 protection tiers');

// Select Comprehensive Shield tier
quoteFlow.handleInput('Comprehensive Shield');
// Select no extra add-ons
const finalQuote = quoteFlow.handleInput('none');
assert(finalQuote.quoteCard !== undefined, 'Successfully generates final quote card');
assert(finalQuote.quoteCard.annualTotal > 0, `Calculated annual total: KSh ${finalQuote.quoteCard.annualTotal}`);
assert(finalQuote.quoteCard.deductible === 'KSh 10,000', 'Comp shield deductible is KSh 10,000');

console.log('\n--- 📑 3. Testing Claims Assistant Flow ---');
const claimsFlow = new ClaimsFlow(DEFAULT_CONFIG);
claimsFlow.start();
claimsFlow.handleInput('Auto Collision');
claimsFlow.handleInput('POL-992810');
const claimSubmission = claimsFlow.handleInput('Cracked windshield on highway');
assert(claimSubmission.claimCard.claimId.startsWith('CLM-'), `Successfully generated claim ID: ${claimSubmission.claimCard.claimId}`);
assert(claimSubmission.claimCard.status.includes('Review'), 'Claim assigned for fast-track review');

console.log('\n--- 💳 4. Testing Payment Receipt & Certificate Generator ---');
const mockQuote = finalQuote.quoteCard;
const receiptData = ReceiptGenerator.generateReceiptData({
  quote: mockQuote,
  paymentDetails: {
    totalAmount: 50160,
    paymentMethod: 'mpesa',
    cardholderName: 'Sarah Jenkins',
    phone: '+254 712 345 678'
  },
  company: DEFAULT_CONFIG.company
});

assert(receiptData.policyNumber.startsWith('POL-'), `Valid policy number generated: ${receiptData.policyNumber}`);
assert(receiptData.payment.status === 'PAID & ISSUED', 'Policy status marked PAID & ISSUED');
assert(receiptData.dates.effective !== undefined, 'Effective date populated');

const receiptHtml = ReceiptGenerator.renderReceiptHtml(receiptData);
assert(receiptHtml.includes('ACTIVE POLICY ISSUED'), 'Receipt HTML contains ACTIVE POLICY ISSUED badge');
assert(receiptHtml.includes(receiptData.policyNumber), 'Receipt HTML contains policy number');

console.log('\n--- 📚 5. Testing Custom User Data Training Engine ---');
import { DataTrainingEngine } from '../src/nlp/data-training-engine.js';

const trainer = new DataTrainingEngine();

// CSV Test
const sampleCSV = `Question,Answer,Category\n"What is your grace period?","We offer a 30-day grace period with 100% active coverage.","billing"\n"Do you allow preferred garages?","Yes, you can choose any certified garage nationwide.","claims"`;
const csvRes = trainer.trainFromText(sampleCSV, 'csv');
assert(csvRes.countAdded === 2, 'DataTrainingEngine parses CSV into structured Q&A items');

// JSON Test
const sampleJSON = JSON.stringify([
  { question: 'What is your maternity waiting period?', answer: 'Our maternity waiting period is 10 months from inception.', category: 'health' }
]);
const jsonRes = trainer.trainFromText(sampleJSON, 'json');
assert(jsonRes.countAdded === 1, 'DataTrainingEngine parses JSON array format');

// Text Q: / A: Test
const sampleText = `Q: Are drone collisions covered?\nA: Yes, commercial and recreational drone liability is covered up to KSh 1,000,000.`;
const textRes = trainer.trainFromText(sampleText, 'auto');
assert(textRes.countAdded === 1, 'DataTrainingEngine parses plain text Q: / A: format');
assert(trainer.getItemCount() === 4, `Total custom items ingested: ${trainer.getItemCount()}`);

// Verify priority classification in IntentEngine
engine.addCustomKnowledge(trainer.getItems());
const customRes = engine.classify('What is your grace period for paying?');
assert(customRes.intent === 'faq' && customRes.reply.includes('30-day grace period'), 'IntentEngine matches custom user-trained data with priority');

console.log('\n--- 🔌 6. Testing Backend API Connector ---');
import { BackendConnector } from '../src/api/backend-connector.js';

const connector = new BackendConnector({
  enabled: true,
  endpoint: 'mock://insurance-ai',
  mode: 'hybrid',
  mockServer: true
});

assert(connector.isEnabled() === true, 'BackendConnector is enabled');
const testConn = await connector.testConnection();
assert(testConn.ok === true && testConn.status === 200, 'Backend API mock connection test passed with 200 OK');

const queryRes = await connector.query('What is the deductible on my corporate fleet?');
assert(queryRes.success === true && queryRes.reply.includes('Backend API Response'), 'BackendConnector processes query and returns structured response');

console.log('\n--- 📋 7. Testing Lead Capture & Human Follow-Up Dynamics ---');
import { LeadCaptureFlow } from '../src/flows/lead-capture-flow.js';

// Test 7.1: Unlisted inquiry triggers LEAD_CAPTURE
const unlistedRes = engine.classify('Do you offer cyber liability insurance for SaaS cloud infrastructure?');
assert(unlistedRes.action === 'LEAD_CAPTURE', 'Unlisted inquiry correctly routes to LEAD_CAPTURE action');
assert(unlistedRes.inquiredNeed.toLowerCase().includes('cyber'), 'Extracts core inquired need topic from user query');

// Test 7.2: LeadCaptureFlow starts and asks for name
const leadFlow = new LeadCaptureFlow(DEFAULT_CONFIG);
const leadStart = leadFlow.start(unlistedRes.inquiredNeed);
assert(leadStart.message.includes('full name'), 'Lead capture flow prompts user for full name');

// Test 7.3: Submitting name prompts for phone number
const nameStep = leadFlow.handleInput('David Muindi');
assert(nameStep.message.includes('phone number') && nameStep.message.includes('David Muindi'), 'Captures name and requests contact phone number');

// Test 7.4: Submitting phone number persists lead and generates confirmation with follow-up
const phoneStep = leadFlow.handleInput('+1 (555) 019-2834');
assert(phoneStep.leadCaptured !== undefined, 'Completes lead capture and creates structured lead object');
assert(phoneStep.leadCaptured.phone === '+1 (555) 019-2834', 'Stores phone number correctly');
assert(phoneStep.leadCaptured.name === 'David Muindi', 'Stores customer name correctly');
assert(phoneStep.message.includes('💬 **In the meantime'), 'Includes contextual human follow-up question');

// Test 7.5: Persistent storage & CSV export
const storedLeads = LeadCaptureFlow.getLeads();
assert(storedLeads.length > 0 && storedLeads[0].name === 'David Muindi', 'Persists captured leads in storage');
const csvData = LeadCaptureFlow.exportCSV();
assert(csvData.includes('David Muindi') && csvData.includes('+1 (555) 019-2834'), 'Exports captured leads to valid CSV format');

// Test 7.6: Human follow-up questions present on FAQ answers
const autoFaq = engine.classify('What does third party liability cover?');
assert(autoFaq.reply.includes('💬'), 'FAQ responses include human follow-up question');

console.log('\n--- 🎯 8. Testing Company Goals & Conversion Strategy Customization ---');
import { COMPANY_GOALS } from '../src/config/default-config.js';

// Test 8.1: Verify all 4 company goals catalog presets exist
assert(COMPANY_GOALS.lead_generation !== undefined, 'COMPANY_GOALS has lead_generation preset');
assert(COMPANY_GOALS.payment_checkout !== undefined, 'COMPANY_GOALS has payment_checkout preset');
assert(COMPANY_GOALS.customer_support !== undefined, 'COMPANY_GOALS has customer_support preset');
assert(COMPANY_GOALS.consultation_booking !== undefined, 'COMPANY_GOALS has consultation_booking preset');

// Test 8.2: LeadCaptureFlow initialized with payment_checkout goal
const paymentGoalConfig = {
  ...DEFAULT_CONFIG,
  goal: 'payment_checkout',
  leadCapture: {
    ...DEFAULT_CONFIG.leadCapture,
    askNamePrompt: COMPANY_GOALS.payment_checkout.askNamePrompt,
    askPhonePrompt: COMPANY_GOALS.payment_checkout.askPhonePrompt,
    confirmationMessage: COMPANY_GOALS.payment_checkout.confirmationMessage,
    followUpQuestion: COMPANY_GOALS.payment_checkout.followUpQuestion
  }
};
const paymentFlow = new LeadCaptureFlow(paymentGoalConfig);
const pStart = paymentFlow.start('High-Limit Cargo Insurance');
assert(pStart.message.includes('instant checkout catalog'), 'Uses goal-specific lead capture name prompt');

// Test 8.3: Lead captured under payment_checkout goal records goalKey
paymentFlow.handleInput('Alice Mwangi');
const pDone = paymentFlow.handleInput('+254 700 111 222');
assert(pDone.leadCaptured.goal === 'payment_checkout', 'Stores company goal in lead record');
assert(pDone.message.includes('Payment request initiated'), 'Uses goal-specific confirmation prompt');

// Test 8.4: CSV export includes Company Goal column
const goalCsv = LeadCaptureFlow.exportCSV();
assert(goalCsv.includes('Goal') && goalCsv.includes('payment_checkout'), 'CSV export includes Goal column with goal key');

// Test 8.5: Tone-aware human follow-up engine
const supportEngine = new IntentEngine({
  ...DEFAULT_CONFIG,
  goal: 'customer_support',
  followUpDynamics: { enabled: true, tone: 'support' }
});
const supportFaq = supportEngine.classify('How long does a collision claim take to process?');
assert(supportFaq.reply.includes('support specialist') || supportFaq.reply.includes('file this claim'), 'Follow-up question adapts tone to customer support goal');

console.log('\n--- 🚀 9. Testing SaaS Mode & Universal Language ($10 Pricing) ---');
const saasEngine = new IntentEngine({
  mode: 'saas',
  company: { name: 'Botly', supportPhone: '+1 (800) 555-0199', supportEmail: 'care@botly.ai' },
  bot: { name: 'Botly', title: 'AI Assistant', greeting: "Hey! I'm Botly." }
});

// Test 9.1: SaaS greeting contains no insurance references
const saasGreet = saasEngine.classify('Hello there');
assert(!saasGreet.reply.toLowerCase().includes('insurance') && !saasGreet.reply.toLowerCase().includes('claim'), 'SaaS greeting contains zero insurance references');

// Test 9.2: Pricing query returns $10 flat per bot
const saasPrice = saasEngine.classify('How much does it cost?');
assert(saasPrice.intent === 'faq' && saasPrice.reply.includes('$10 per chatbot'), 'SaaS pricing query returns $10 flat per chatbot');

// Test 9.3: Cost query does not open auto quote wizard
const saasQuoteCheck = saasEngine.classify('Can I get a quote on pricing?');
assert(saasQuoteCheck.action !== 'OPEN_QUOTE_WIZARD', 'SaaS quote inquiry does not trigger auto quote wizard');

// Test 9.4: Human escalation uses team language without underwriter
const saasHuman = saasEngine.classify('I want to speak with a human agent');
assert(!saasHuman.reply.toLowerCase().includes('underwriter') && saasHuman.reply.includes('care@botly.ai'), 'SaaS human escalation uses team language without underwriter');

console.log('\n--- 🧠 10. Testing Multi-Function Goals & Multi-Format Bot Memory ---');
const memoryEngine = new IntentEngine({
  mode: 'saas',
  goals: ['lead_generation', 'customer_support', 'payment_checkout'],
  company: { name: 'Acme Studio' },
  customKnowledge: [
    {
      question: 'Acme Studio Overview',
      answer: 'We provide branding, web development, and 24/7 custom AI support with a 48 hour turnaround.',
      source: 'document',
      keywords: ['branding', 'turnaround', 'services', 'development']
    },
    {
      question: 'Pricing & Packages on Acme.com',
      answer: 'On Acme.com, chatbots are $10 flat with no monthly subscription and unlimited chats.',
      source: 'website',
      sourceUrl: 'https://acme.com/pricing',
      keywords: ['pricing', 'rate', 'cost', 'subscription', 'package']
    }
  ]
});

// Test 10.1: Document memory answers with document citation prefix
const docQuery = memoryEngine.classify('What is your turnaround time for services?');
assert(docQuery.reply.includes('From Company Records') && docQuery.reply.includes('48 hour turnaround'), 'Bot uses document memory with company records citation');

// Test 10.2: Website memory answers with website citation prefix and host
const webQuery = memoryEngine.classify('Tell me about pricing on acme.com');
assert(webQuery.reply.includes('From Website Knowledge') && webQuery.reply.includes('acme.com') && webQuery.reply.includes('$10 flat'), 'Bot uses website memory with website citation and URL host');

// Test 10.3: Multi-goals quick replies include actions for active goals
assert(docQuery.suggestedQuickReplies.some(q => q.payload.includes('start') || q.label.includes('started')), 'Quick replies support lead generation goal');
assert(docQuery.suggestedQuickReplies.some(q => q.label.includes('someone') || q.label.includes('team')), 'Quick replies support customer support goal');

console.log('\n--- 🇰🇪 11. Testing NextGen Kenya Customization & Morphological Stemming ---');
const nextGenEngine = new IntentEngine({
  mode: 'saas',
  company: { name: 'NextGen Kenya', supportEmail: 'info@kenyanextgen.co.ke' },
  bot: { name: 'NextGen Assistant', title: 'AI Placement Advisor' },
  customKnowledge: [
    {
      id: 'nextgen_home',
      question: 'NextGen Kenya - About & Youth Employment Mission',
      answer: 'NextGen.Ke is an initiative accelerating youth employment in Kenya, developed in partnership with UNDP, the Government of Kenya, and KEPSA to connect youth with internships across all 47 counties.',
      source: 'website',
      sourceUrl: 'https://kenyanextgen.co.ke/',
      category: 'website',
      keywords: ['kenyanextgen', 'about', 'undp', 'kepsa', 'employment', 'youth', 'internship', 'counties']
    },
    {
      id: 'nextgen_automation',
      question: 'NextGen Kenya - Workplace Automation, Digital Skills & Training',
      answer: 'Yes! NextGen Kenya provides youth with cutting-edge training in workplace automation, modern digital tools, AI technologies, and software workflows.',
      source: 'website',
      sourceUrl: 'https://kenyanextgen.co.ke/skills',
      category: 'website',
      keywords: ['automation', 'automated', 'skills', 'training', 'digital', 'tech', 'workflows']
    },
    {
      id: 'nextgen_pricing',
      question: 'NextGen Kenya - Application & Program Cost',
      answer: 'Applications to NextGen Kenya are 100% free with zero fees! Any young Kenyan graduate can register online in under 3 minutes.',
      source: 'website',
      sourceUrl: 'https://kenyanextgen.co.ke/apply',
      category: 'website',
      keywords: ['pricing', 'cost', 'fee', 'free', 'price', 'rate', 'apply', 'application']
    }
  ]
});

// Test 11.1: Morphological Stemming matches "do you have automation?" to "automated" / "automation"
const autoQuery = nextGenEngine.classify('do you have automation?');
assert(autoQuery.intent === 'faq', 'Matches automation query to FAQ via stemming');
assert(autoQuery.reply.includes('workplace automation') && autoQuery.reply.includes('From Website Knowledge'), 'Returns NextGen automation training answer from memory');

// Test 11.2: Pricing on NextGen Kenya returns free application from memory, NOT Botly $10
const nextGenPrice = nextGenEngine.classify('How much does it cost?');
assert(nextGenPrice.reply.includes('100% free') && !nextGenPrice.reply.includes('$10 per chatbot'), 'Returns NextGen Kenya free program pricing, not Botly $10 pitch');

// Test 11.3: Unlisted query routes to NextGen Kenya team without "exact quote" language
const unlistedNextGen = nextGenEngine.classify('do you have catering?');
assert(unlistedNextGen.action === 'LEAD_CAPTURE', 'Unlisted topic triggers lead capture');
assert(unlistedNextGen.reply.includes('NextGen Kenya') && !unlistedNextGen.reply.includes('exact quote'), 'Lead capture prompt references NextGen Kenya and avoids quote language');

console.log('\n--- 📱 12. Testing Checkout Page Linking, Direct M-Pesa & Confirmation Code Leads ---');

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

// Test 12.1: M-Pesa Code format detection
assert(extractMpesaCode('UIC8E69GLQ') === 'UIC8E69GLQ', 'Recognizes standard Safaricom M-Pesa code UIC8E69GLQ');
assert(extractMpesaCode('uic8e69glq') === 'UIC8E69GLQ', 'Auto-uppercases lowercase M-Pesa code');
assert(extractMpesaCode('I have paid, mpesa code is UIC8E69GLQ') === 'UIC8E69GLQ', 'Extracts M-Pesa code from conversational user sentence');
assert(extractMpesaCode('hello world') === null, 'Rejects plain text words without digits');
assert(extractMpesaCode('12345678') === null, 'Rejects pure numeric input without letters');

// Test 12.2: Recording M-Pesa transaction lead
const mpesaLead = {
  id: 'PAY-TEST-999',
  name: 'Kevin Otieno',
  phone: '+254 712 999 888',
  need: 'NextGen Digital Career Accelerator',
  goal: 'payment_checkout',
  status: 'Paid (M-Pesa: UIC8E69GLQ)',
  paymentMethod: 'M-Pesa: Buy Goods (Till: 123456)',
  mpesaCode: 'UIC8E69GLQ',
  amount: 'KES 1,000',
  destination: 'Till 123456',
  businessName: 'NextGen Kenya',
  timestamp: new Date().toISOString(),
  createdAtFormatted: new Date().toLocaleString(),
  company: 'NextGen Kenya'
};

LeadCaptureFlow.saveLeadToStorage(mpesaLead);
const storedMpesaLeads = LeadCaptureFlow.getLeads();
const foundLead = storedMpesaLeads.find(l => l.mpesaCode === 'UIC8E69GLQ');
assert(foundLead !== undefined, 'Persists M-Pesa transaction code in lead storage');
assert(foundLead.paymentMethod.includes('Buy Goods'), 'Stores M-Pesa payment method in lead record');
assert(foundLead.amount === 'KES 1,000', 'Stores paid amount in lead record');
assert(foundLead.status.includes('Paid (M-Pesa: UIC8E69GLQ)'), 'Stores status with confirmation code');

// Test 12.3: CSV Export includes Payment Method, M-Pesa Code, and Amount
const mpesaCsv = LeadCaptureFlow.exportCSV();
assert(mpesaCsv.includes('Payment Method') && mpesaCsv.includes('M-Pesa Code') && mpesaCsv.includes('Amount'), 'CSV headers include Payment Method, M-Pesa Code, and Amount');
assert(mpesaCsv.includes('UIC8E69GLQ'), 'CSV export rows contain customer M-Pesa code');
assert(mpesaCsv.includes('Kevin Otieno'), 'CSV export rows contain customer name');

console.log('\n--- 🔄 13. Testing Progressive Non-Repeating Follow-Up Questions & Conversation Memory ---');
const progressiveEngine = new IntentEngine({
  mode: 'saas',
  goals: ['consultation_booking', 'lead_generation'],
  company: { name: 'Acme Cloud', supportPhone: '+1 (800) 555-0199', supportEmail: 'hello@acmecloud.com' },
  customKnowledge: [
    {
      question: 'What services does Acme Cloud provide?',
      answer: 'We provide managed cloud infrastructure, Kubernetes clusters, and AI deployment tools.',
      keywords: ['services', 'cloud', 'infrastructure', 'kubernetes']
    },
    {
      question: 'What are Acme Cloud pricing plans?',
      answer: 'Plans start at $49/month for starter clusters and $199/month for enterprise dedicated nodes.',
      keywords: ['pricing', 'plans', 'cost', 'month', 'rates']
    }
  ]
});

// Test 13.1: First FAQ query returns contextual follow-up
const turn1 = progressiveEngine.classify('What services does Acme Cloud provide?');
assert(turn1.reply.includes('Kubernetes'), 'Answers first FAQ correctly');
const followUp1 = progressiveEngine.memory.lastFollowUp;
assert(followUp1 && followUp1.text, 'Generates initial follow-up question');

// Test 13.2: Second FAQ query returns a DIFFERENT, PROGRESSIVE follow-up question (Anti-repetition)
const turn2 = progressiveEngine.classify('What are Acme Cloud pricing plans?');
assert(turn2.reply.includes('$49/month'), 'Answers second FAQ correctly');
const followUp2 = progressiveEngine.memory.lastFollowUp;
assert(followUp2 && followUp2.text !== followUp1.text, 'Second follow-up question is progressive and does NOT repeat the first');

// Test 13.3: Follow-ups track visited topics in conversation memory
assert(progressiveEngine.memory.askedFollowUps.length >= 2, 'Memory tracks all asked follow-up keys/questions');
assert(progressiveEngine.memory.goalStage >= 2, 'Goal stage progresses with each turn');

console.log('\n--- 💳 14. Testing M-Pesa vs Card Payment Selection & Anti-Repetition Repeat Questions ---');
const checkoutEngine = new IntentEngine({
  mode: 'saas',
  goals: ['payment_checkout', 'lead_generation'],
  checkout: {
    enabled: true,
    externalUrl: 'https://buy.stripe.com/test_123',
    mpesa: { number: '123456', type: 'buy_goods' },
    card: { url: 'https://buy.stripe.com/test_123', amount: '10', currency: 'USD' }
  }
});

// Test 14.1: General checkout asks user to select M-Pesa or Card (paymentMethod: null)
const payGeneral = checkoutEngine.classify('I want to checkout now');
assert(payGeneral.action === 'OPEN_PAYMENT_WIZARD' && payGeneral.paymentMethod === null, 'General checkout routes to OPEN_PAYMENT_WIZARD with null paymentMethod to prompt user to choose');

// Test 14.2: Explicit M-Pesa query identifies mpesa method
const payMpesa = checkoutEngine.classify('pay with mpesa');
assert(payMpesa.action === 'OPEN_PAYMENT_WIZARD' && payMpesa.paymentMethod === 'mpesa', 'Routes explicit M-Pesa query directly to mpesa method');

// Test 14.3: Explicit Card query identifies card method
const payCard = checkoutEngine.classify('pay with credit card');
assert(payCard.action === 'OPEN_PAYMENT_WIZARD' && payCard.paymentMethod === 'card', 'Routes explicit Card query directly to card method');

// Test 14.4: Repeating the question when asked returns previous follow-up text
progressiveEngine.classify('What are Acme Cloud pricing plans?');
const repeatTurn = progressiveEngine.classify('what did you ask?');
assert(repeatTurn.intent === 'repeat_question' && repeatTurn.reply.includes('I was asking:'), 'Recognizes user request to repeat the question and quotes last asked follow-up');

// Test 14.5: Insurance mode also enforces anti-repetition memory tracking
const insEngine = new IntentEngine({ mode: 'insurance' });
const insTurn1 = insEngine.classify('What is a deductible?');
const insTurn2 = insEngine.classify('What is the difference between comprehensive and third party?');
assert(insEngine.memory.askedFollowUps.length >= 2, 'Insurance mode tracks asked follow-up questions in memory');

console.log(`\n--- 🛍️ 15. Testing Intuitive Product Checkout & Multi-Category Knowledge ---`);

const catalogEngine = new IntentEngine({
  mode: 'saas',
  company: {
    name: 'Jumia Kenya',
    websiteUrl: 'https://www.jumia.co.ke'
  },
  customKnowledge: [
    {
      question: 'Do you sell wristwatches, luxury watches, and smartwatches on Jumia?',
      answer: "Yes! Jumia Kenya offers 10,000+ watches and smart accessories across all budgets:\n• **Curren Men's Luxury Chronograph Watch** — **KES 2,499** ([View Watch](https://www.jumia.co.ke/watches-sunglasses/))\n• **Casio Vintage Digital Gold Watch** — **KES 3,850** ([View Watch](https://www.jumia.co.ke/watches-sunglasses/))\n• **Smart Fitness Band 8 Water Resistant** — **KES 1,950** ([View Watch](https://www.jumia.co.ke/watches-sunglasses/))\n• **Apple Watch Series 9 GPS 45mm** — **KES 64,000** ([View Watch](https://www.jumia.co.ke/watches-sunglasses/))\n• **Naviforce Dual Display Military Leather Watch** — **KES 2,999** ([View Watch](https://www.jumia.co.ke/watches-sunglasses/))",
      keywords: ['watch', 'watches', 'smartwatch', 'curren', 'casio', 'apple watch', 'naviforce', 'leather watch', 'wrist watch', 'jewelry'],
      source: 'website',
      sourceUrl: 'https://www.jumia.co.ke/watches-sunglasses/',
      category: 'website'
    },
    {
      id: 'web_jumia_home',
      question: 'What is Jumia Kenya and what products do you sell?',
      answer: 'Jumia Kenya is East Africa’s leading online shopping destination, offering over 1 million authentic products across smartphones, electronics, watches, computing, fashion, beauty, home appliances, and groceries with secure nationwide delivery.',
      keywords: ['about jumia', 'what is jumia', 'company overview', 'jumia kenya marketplace', 'who is jumia'],
      source: 'website',
      sourceUrl: 'https://www.jumia.co.ke/',
      category: 'overview'
    },
    {
      id: 'web_jumia_laptops',
      question: 'What laptops, MacBooks and computers are available on Jumia?',
      answer: 'We feature brand new computing laptops from verified Jumia Mall stores:\n\n• **HP 15 Intel Core i5** (8GB RAM, 512GB NVMe SSD, 15.6" FHD) — **KES 48,000** ([View on Jumia](https://www.jumia.co.ke/laptops/))\n• **Apple MacBook Air M2 13.6"** (8GB RAM, 256GB SSD) — **KES 145,000** ([View on Jumia](https://www.jumia.co.ke/laptops/))\n• **Lenovo IdeaPad 3 Core i3** (8GB RAM, 256GB SSD) — **KES 35,000** ([View on Jumia](https://www.jumia.co.ke/laptops/))\n• **Dell Latitude Core i5 Refurbished Grade A** — **KES 26,500** ([View on Jumia](https://www.jumia.co.ke/laptops/))\n\nPre-installed with genuine Windows/macOS and full warranty.',
      keywords: ['laptop', 'laptops', 'computer', 'computers', 'hp', 'macbook', 'lenovo', 'computing', 'pc', 'core i5', 'core i7', 'dell'],
      source: 'website',
      sourceUrl: 'https://www.jumia.co.ke/laptops/',
      category: 'services'
    },
    {
      question: 'What are Botly Pro SaaS pricing plans, features, and API integrations?',
      answer: "Botly Pro offers flexible SaaS subscription tiers:\n• **Starter Plan** — **$15/month** — 1 Chatbot, 1,000 chats/mo, basic customizer.\n• **Growth Plan** — **$49/month** — 5 Chatbots, unlimited chats, M-Pesa + Card checkout, crawler, Webhooks.\n• **Enterprise Plan** — **$199/month** — Dedicated server, custom AI fine-tuning, SLA, priority support.",
      keywords: ['saas', 'pricing', 'plans', 'features', 'growth plan', 'enterprise', 'api', 'webhooks'],
      source: 'website',
      sourceUrl: 'https://botly.ai/pricing',
      category: 'website'
    }
  ]
});

// Test 15.1: Product search query matches watch catalog chunk and doesn't default to lead capture
const watchQuery = catalogEngine.classify('I am looking for a watch');
assert(watchQuery.intent === 'faq' && watchQuery.reply.includes('Curren'), 'Product query "I am looking for a watch" accurately matches watch catalog FAQ');

// Test 15.2: Watch query generates dynamic quick replies with product name and price
const watchReplies = watchQuery.quickReplies || [];
const hasBuyWatchBtn = watchReplies.some(r => r.label.includes('Buy') && r.label.includes('Curren') && r.label.includes('2,499'));
assert(hasBuyWatchBtn, 'Generates dynamic quick reply button with exact product name and price');

// Test 15.3: Quick reply payload contains checkout_item format with name, amount, currency, and URL
const buyWatchReply = watchReplies.find(r => r.label.includes('Buy') && r.label.includes('Curren'));
assert(buyWatchReply && buyWatchReply.payload.startsWith('checkout_item:'), 'Checkout quick reply uses checkout_item format');
assert(buyWatchReply.payload.includes('2499') && buyWatchReply.payload.includes('KES'), 'Checkout quick reply encodes amount (2499) and currency (KES)');
assert(buyWatchReply.payload.includes(encodeURIComponent('https://www.jumia.co.ke/watches-sunglasses/')), 'Checkout quick reply encodes direct product URL');

// Test 15.4: SaaS pricing and features query accurately matches SaaS tier chunk
const saasQuery = catalogEngine.classify('What are your SaaS pricing plans and features?');
assert(saasQuery.intent === 'faq' && saasQuery.reply.includes('Growth Plan') && saasQuery.reply.includes('$49'), 'SaaS query accurately returns multi-tier pricing and features');

// Test 15.5: Specific product inquiry ("i want Naviforce Dual Display Military Leather Watch") focuses exclusively on that item
const naviforceQuery = catalogEngine.classify('i want Naviforce Dual Display Military Leather Watch');
assert(naviforceQuery.intent === 'faq', 'Specific item inquiry accurately matches knowledge base FAQ');
assert(naviforceQuery.reply.includes('Naviforce Dual Display Military Leather Watch'), 'Reply focuses on requested Naviforce watch');
assert(!naviforceQuery.reply.includes('Curren'), 'Reply filters out unrelated items (Curren) when specific item is inquired');
const naviReplies = naviforceQuery.quickReplies || [];
const buyNavi = naviReplies.find(r => r.label.includes('Naviforce'));
assert(buyNavi && buyNavi.payload.includes('2999') && buyNavi.payload.includes('KES'), 'Checkout quick reply button focuses specifically on Naviforce at KES 2,999');

// Test 15.6: Specific inquiry for Casio Vintage Watch focuses exclusively on Casio
const casioQuery = catalogEngine.classify('Casio Vintage Digital Gold Watch');
assert(casioQuery.reply.includes('Casio Vintage') && !casioQuery.reply.includes('Curren'), 'Casio inquiry focuses on Casio and omits Curren');
const buyCasio = (casioQuery.quickReplies || []).find(r => r.label.includes('Casio'));
assert(buyCasio && buyCasio.payload.includes('3850') && buyCasio.payload.includes('KES'), 'Casio checkout quick reply focuses on KES 3,850');

console.log('\n--- 🛡️ 16. Testing Absence of Evidence & Capability Gating (Phase 1 Bugfix) ---');
const lawFirmConfig = {
  mode: 'saas',
  goals: ['lead_generation', 'consultation_booking'],
  goal: 'consultation_booking',
  company: {
    name: 'Wanzaki Vindu Advocates',
    websiteUrl: 'https://wanzakivinduadvocates.com/',
    supportEmail: 'info@wanzakivinduadvocates.com'
  },
  checkout: {
    enabled: false,
    item: '',
    amount: null
  },
  customKnowledge: [
    {
      question: 'What is Wanzaki Vindu Advocates and what do you do?',
      answer: 'Welcome to Wanzaki Vindu Advocates! We provide premier legal services, dispute resolution, and corporate advisory across Kenya.',
      source: 'website',
      keywords: ['wanzakivinduadvocates', 'about', 'services', 'legal', 'advocates']
    }
  ]
};

const lawFirmEngine = new IntentEngine(lawFirmConfig);

// Test 16.1: Pricing inquiry does NOT return $49 or "Professional Plan"
const lawPricingQuery = lawFirmEngine.classify('What are your pricing packages and plans? Can I get a $49 plan?');
assert(!lawPricingQuery.reply.includes('$49'), 'Pricing query does NOT return $49 plan when evidence is absent');
assert(!lawPricingQuery.reply.includes('Professional Plan'), 'Pricing query does NOT return Professional Plan');
assert(lawPricingQuery.reply.includes('info@wanzakivinduadvocates.com') || lawPricingQuery.reply.includes('team'), 'Pricing query directs user to reach out to the firm');

// Test 16.2: Quick replies do not include checkout_now or pay buttons
const pricingReplies = lawPricingQuery.suggestedQuickReplies || [];
assert(!pricingReplies.some(r => r.payload === 'checkout_now' || r.payload === 'intent_pay'), 'Quick replies do not include checkout_now or payment triggers');

// Test 16.3: Direct checkout request does not trigger payment wizard when checkout.enabled is false
const directPayQuery = lawFirmEngine.classify('checkout_now');
assert(directPayQuery.action !== 'OPEN_PAYMENT_WIZARD', 'Direct checkout payload does NOT route to OPEN_PAYMENT_WIZARD when checkout is disabled');

console.log('\n--- 🛒 17. Testing Live Dynamic Product Search Tool & Tiered Fallback ("i want socks") ---');
// Test 17.1: "i want socks" on Jumia invokes product search, NOT lead capture name prompt
const socksQuery = catalogEngine.classify('i want socks');
assert(socksQuery.action !== 'LEAD_CAPTURE', 'Product query "i want socks" does NOT trigger LEAD_CAPTURE');
assert(!socksQuery.reply.includes('full name'), 'Product query "i want socks" does NOT demand user\'s full name');
assert(socksQuery.action === 'PRODUCT_SEARCH', 'Routes to PRODUCT_SEARCH dynamic tool action');
assert(socksQuery.reply.includes('https://www.jumia.co.ke/catalog/?q=socks'), 'Reply includes live Jumia catalog search URL for socks');

// Test 17.2: Quick reply provides direct catalog search link
const socksReplies = socksQuery.suggestedQuickReplies || [];
assert(socksReplies.some(r => r.payload && r.payload.includes('q=socks')), 'Quick reply provides direct live catalog link');

// Test 17.3: "do you have blenders" also triggers dynamic product search
const blenderQuery = catalogEngine.classify('do you have blenders?');
assert(blenderQuery.action === 'PRODUCT_SEARCH', 'Query "do you have blenders?" triggers PRODUCT_SEARCH');
assert(blenderQuery.reply.includes('https://www.jumia.co.ke/catalog/?q=blenders'), 'Reply includes live search URL for blenders');
assert(!blenderQuery.reply.includes('full name'), 'Blender search does not ask for full name');

// Test 17.4: Non-ecommerce law firm inquiry does NOT trigger product search
const lawMatterQuery = lawFirmEngine.classify('do you handle land disputes in Machakos?');
assert(lawMatterQuery.action !== 'PRODUCT_SEARCH', 'Law firm legal matter inquiry does NOT route to PRODUCT_SEARCH');

// Test 17.5: "i want to buy a toy for my child what do you have?" queries live catalog for toys, NOT store definition
const toyQuery = catalogEngine.classify('i want to buy a toy for my child what do you have?');
assert(toyQuery.action === 'PRODUCT_SEARCH', 'Toy query triggers PRODUCT_SEARCH');
assert(!toyQuery.reply.includes('East Africa’s leading'), 'Toy query does NOT return generic brochure definition of Jumia');
assert(!toyQuery.reply.includes('for your business'), 'Toy query does NOT ask B2B advisor question for business');
assert(!toyQuery.reply.includes('full name'), 'Toy query does NOT demand user full name');
assert(toyQuery.reply.includes('https://www.jumia.co.ke/catalog/?q=toy'), 'Toy query builds live Jumia catalog link for toy');
assert(toyQuery.reply.includes('Baby Products, Toys & Games'), 'Toy query identifies Baby & Toys department');

// Test 17.6: "i want to buy cooking oil do you have any" queries live catalog for cooking oil
const oilQuery = catalogEngine.classify('i want to buy cooking oil do you have any');
assert(oilQuery.action === 'PRODUCT_SEARCH', 'Cooking oil query triggers PRODUCT_SEARCH');
assert(!oilQuery.reply.includes('East Africa’s leading'), 'Cooking oil query does NOT return generic brochure definition');
assert(!oilQuery.reply.includes('for your business'), 'Cooking oil query does NOT ask B2B advisor question for business');
assert(oilQuery.reply.includes('cooking') && oilQuery.reply.includes('oil'), 'Cooking oil query extracts keywords cooking and oil');
assert(oilQuery.reply.includes('Groceries & Supermarket'), 'Cooking oil query identifies Groceries & Supermarket department');

// Test 17.7: Explicit company overview query "What is Jumia Kenya?" DOES match overview FAQ
const aboutQuery = catalogEngine.classify('What is Jumia Kenya and what products do you sell?');
assert(aboutQuery.intent === 'faq', 'Overview query matches FAQ intent');
assert(aboutQuery.reply.includes('East Africa’s leading'), 'Overview query correctly returns company definition overview');

// --- 18. Testing Hard Relevance Threshold, Content-Type Gating & Null Catalog Fallback ---
console.log('\n--- 🛡️ 18. Testing Relevance Floor, Content-Type Gating & Honest Search Fallback ---');

// Test 18.1: Unindexed groceries query "eggs" does NOT match laptops
const eggsQuery = catalogEngine.classify('i want eggs');
assert(eggsQuery.action === 'PRODUCT_SEARCH', 'Eggs query triggers PRODUCT_SEARCH');
assert(!eggsQuery.reply.includes('HP 15'), 'Eggs query does NOT return HP laptop listing');
assert(!eggsQuery.reply.includes('MacBook'), 'Eggs query does NOT return MacBook listing');
assert(!eggsQuery.reply.includes('Lenovo'), 'Eggs query does NOT return Lenovo listing');
assert(!eggsQuery.reply.includes('From Website Knowledge'), 'Eggs query does NOT synthesize From Website Knowledge');
assert(eggsQuery.reply.includes("I don't have **eggs** in my indexed knowledge"), 'Eggs query honestly states item is not in indexed knowledge');
assert(eggsQuery.reply.includes('https://www.jumia.co.ke/catalog/?q=eggs'), 'Eggs query provides live catalog link to eggs');
assert(eggsQuery.reply.includes('Groceries & Supermarket'), 'Eggs query routes to Groceries department');

// Test 18.2: Raw catalog URL input "https://www.jumia.co.ke/catalog/?q=eggs" extracts eggs entity and avoids laptops
const urlInputQuery = catalogEngine.classify('https://www.jumia.co.ke/catalog/?q=eggs');
assert(urlInputQuery.action === 'PRODUCT_SEARCH', 'URL input triggers PRODUCT_SEARCH');
assert(!urlInputQuery.reply.includes('HP 15') && !urlInputQuery.reply.includes('MacBook'), 'URL input does NOT match laptops');
assert(!urlInputQuery.reply.includes('From Website Knowledge'), 'URL input does NOT say From Website Knowledge');
assert(urlInputQuery.reply.includes('https://www.jumia.co.ke/catalog/?q=eggs'), 'URL input provides live search link for eggs');

// Test 18.3: Legitimate laptops query matches laptops catalog chunk
const laptopQuery = catalogEngine.classify('Tell me about laptops and MacBooks available');
assert(laptopQuery.intent === 'faq', 'Laptops query matches FAQ intent');
assert(laptopQuery.reply.includes('HP 15'), 'Laptops query includes HP 15 listing');
assert(laptopQuery.reply.includes('MacBook Air'), 'Laptops query includes MacBook Air listing');
assert(laptopQuery.reply.includes('From Website Knowledge'), 'Laptops query includes From Website Knowledge citation');

// Test 18.4: Category gating prevents watches from matching laptops
const watchGatingQuery = catalogEngine.classify('I am looking for a watch');
assert(watchGatingQuery.intent === 'faq', 'Watch query matches FAQ intent');
assert(watchGatingQuery.reply.includes('Curren'), 'Watch query includes Curren');
assert(!watchGatingQuery.reply.includes('MacBook'), 'Watch query does NOT include laptops');

// --- 🛍️ 19. Testing In-Chat Product Discovery, Store Boundaries & Exact Stemming ---
console.log('\n--- 🛍️ 19. Testing In-Chat Product Discovery, Store Boundaries & Exact Stemming ---');

// Test 19.1: Exact root equality prevents "cars" from false-matching "care", "carry", and "cards"
assert(!catalogEngine.wordsMatch('cars', 'care'), 'Stemmer does NOT match "cars" with "care"');
assert(!catalogEngine.wordsMatch('cars', 'carry'), 'Stemmer does NOT match "cars" with "carry"');
assert(!catalogEngine.wordsMatch('cars', 'cards'), 'Stemmer does NOT match "cars" with "cards"');
assert(catalogEngine.wordsMatch('cars', 'car'), 'Stemmer correctly matches "cars" with "car"');
assert(catalogEngine.wordsMatch('lotion', 'lotions'), 'Stemmer correctly matches "lotion" with "lotions"');

// Test 19.2: "do you have lotion" delivers real in-chat product cards & 1-click buy chips
const lotionQuery = catalogEngine.classify('do you have lotion');
assert(lotionQuery.action === 'PRODUCT_SEARCH', 'Lotion query triggers PRODUCT_SEARCH');
assert(lotionQuery.reply.includes('Nivea Cocoa Butter'), 'Lotion query returns Nivea Cocoa Butter card');
assert(lotionQuery.reply.includes('Vaseline Intensive Care'), 'Lotion query returns Vaseline Aloe card');
assert(lotionQuery.reply.includes('KES 650'), 'Lotion query includes authentic KES 650 price');
assert(!lotionQuery.reply.includes("I don't have **lotion** in my indexed knowledge"), 'Does NOT give passive "I don\'t have lotion in indexed knowledge" fallback');
assert(lotionQuery.suggestedQuickReplies.some(q => q.payload.startsWith('checkout_item:') && q.payload.includes('Nivea')), 'Surfaces 1-click in-chat Buy button for Nivea');

// Test 19.3: Livestock boundary refusal for "i am looking for a cow"
const cowQuery = catalogEngine.classify('i am looking for a cow');
assert(cowQuery.action === 'OUT_OF_SCOPE', 'Cow query triggers OUT_OF_SCOPE boundary action');
assert(cowQuery.reply.includes('does not sell live animals or livestock'), 'Cow query returns honest livestock merchant refusal');
assert(!cowQuery.reply.includes('catalog/?q=cow'), 'Cow query does NOT generate absurd catalog link for cow');
assert(cowQuery.suggestedQuickReplies.some(q => q.label.includes('Meat & Poultry')), 'Cow query offers Meat & Poultry alternative');
assert(cowQuery.suggestedQuickReplies.some(q => q.label.includes('Dairy & Eggs')), 'Cow query offers Dairy & Eggs alternative');

// Test 19.4: Motor vehicles boundary refusal for "do you sell cars"
const carQuery = catalogEngine.classify('do you sell cars');
assert(carQuery.action === 'OUT_OF_SCOPE', 'Car query triggers OUT_OF_SCOPE boundary action');
assert(carQuery.reply.includes('does not sell full motor vehicles or cars'), 'Car query returns honest motor vehicle refusal');
assert(!carQuery.reply.includes('+1 (800) 555-0199'), 'Car query does NOT return Customer Care toll-free hotline');
assert(!carQuery.reply.includes('East Africa’s leading'), 'Car query does NOT return generic company definition');
assert(carQuery.suggestedQuickReplies.some(q => q.label.includes('Car Accessories')), 'Car query offers Car Accessories alternative');
assert(carQuery.suggestedQuickReplies.some(q => q.label.includes('Car Batteries')), 'Car query offers Car Batteries alternative');

// Test 19.5: Real estate boundary refusal for "can I buy a house"
const houseQuery = catalogEngine.classify('can I buy a house');
assert(houseQuery.action === 'OUT_OF_SCOPE', 'House query triggers OUT_OF_SCOPE boundary action');
assert(houseQuery.reply.includes('does not sell real estate or land'), 'House query returns real estate boundary refusal');
assert(houseQuery.suggestedQuickReplies.some(q => q.label.includes('Kitchen Appliances')), 'House query offers Kitchen Appliances alternative');

console.log('\n--- 🌐 20. Testing Live Web Scraping Engine & Dynamic In-Chat Checkout ---');
assert(typeof fetchLiveScrapedProducts === 'function', 'fetchLiveScrapedProducts is exported as an async helper');
assert(typeof formatScrapedProductsResult === 'function', 'formatScrapedProductsResult is exported as a formatter');

// Test 20.1: Live scraped products payload formatting
const mockScrapedData = {
  found: true,
  query: 'milk',
  source: 'beautifulsoup_live',
  searchUrl: 'https://www.jumia.co.ke/catalog/?q=milk',
  items: [
    {
      name: 'Brookside Fresh Whole Milk (500ml)',
      price: 65,
      currency: 'KES',
      rawPrice: 'KSh 65',
      url: 'https://www.jumia.co.ke/brookside-whole-milk.html',
      rating: '⭐ 4.8 (210 reviews)',
      specs: 'Save 13% • Official warranty & doorstep delivery'
    },
    {
      name: 'KCC Gold Crown Long Life Milk 500ml',
      price: 75,
      currency: 'KES',
      rawPrice: 'KSh 75',
      url: 'https://www.jumia.co.ke/kcc-long-life-milk.html',
      rating: '⭐ 4.7 (145 reviews)',
      specs: 'Ultra pasteurized long life milk'
    }
  ]
};

const formattedLive = formatScrapedProductsResult(mockScrapedData, 'milk', 'https://www.jumia.co.ke', 'Jumia Kenya');
assert(formattedLive !== null, 'Formatter returns structured live result');
assert(formattedLive.isLiveScraped === true, 'Sets isLiveScraped flag to true');
assert(formattedLive.message.includes('live catalog engine'), 'Message specifies authentic live catalog extraction');
assert(formattedLive.message.includes('Brookside Fresh Whole Milk (500ml)'), 'Message includes scraped Brookside milk');
assert(formattedLive.message.includes('KES 65'), 'Message displays authentic scraped KES 65 price');
assert(formattedLive.message.includes('Groceries & Supermarket'), 'Department hint correctly infers supermarket for milk');

// Test 20.2: Quick reply direct store product links
const viewChips = formattedLive.suggestedQuickReplies.filter(q => q.label && q.label.includes('🛍️ View') && q.url);
assert(viewChips.length === 2, 'Generates direct verified store product links for each scraped product');
assert(viewChips[0].label.includes('65'), 'Product chip displays product name and authentic price');
assert(viewChips[0].url.includes('brookside-whole-milk'), 'Product chip links directly to official merchant page');
assert(formattedLive.suggestedQuickReplies.some(q => q.label.includes('Inquire')), 'Offers specialist concierge inquiry option');



// Test 20.3: searchProducts with live scraped data injection
const searchLive = searchProducts({ query: 'milk', scrapedData: mockScrapedData }, { company: { name: 'Jumia Kenya', websiteUrl: 'https://www.jumia.co.ke' } });
assert(searchLive.found === true, 'searchProducts returns found with live scraped data');
assert(searchLive.isLiveScraped === true, 'searchProducts sets isLiveScraped with scrapedData');
assert(searchLive.items.length === 2, 'searchProducts preserves scraped items');

// Test 20.4: IntentEngine async resolution
assert(typeof catalogEngine.classifyAsync === 'function', 'IntentEngine provides classifyAsync method');
const syncFallback = catalogEngine.classify('milk');
assert(syncFallback.action === 'PRODUCT_SEARCH', 'Synchronous classify resolves milk to PRODUCT_SEARCH');

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}



