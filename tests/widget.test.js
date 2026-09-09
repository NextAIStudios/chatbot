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

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
