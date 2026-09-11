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

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
