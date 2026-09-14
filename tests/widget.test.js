/**
 * Automated Verification Test Suite for Insurance Chatbot
 * Tests NLP intent classification, quote calculations, and payment receipt integrity.
 */

import { DEFAULT_CONFIG } from '../src/config/default-config.js';
import { IntentEngine } from '../src/nlp/intent-engine.js';
import { QuoteFlow } from '../src/flows/quote-flow.js';
import { ClaimsFlow } from '../src/flows/claims-flow.js';
import { ReceiptGenerator } from '../src/payments/receipt-generator.js';

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

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

