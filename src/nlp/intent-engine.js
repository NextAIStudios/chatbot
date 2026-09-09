/**
 * Natural Language Processing & Intent Engine
 * Performs fuzzy intent classification, knowledge-base matching, and flow routing.
 */

import { INSURANCE_KNOWLEDGE_BASE } from './knowledge-base.js';

export class IntentEngine {
  constructor(config = {}) {
    this.config = config;
    this.customKnowledge = [...(config.customKnowledge || []), ...(config.customFaqs || [])];
    this.rebuildKnowledgeBase();
  }

  rebuildKnowledgeBase() {
    this.knowledgeBase = [...this.customKnowledge, ...INSURANCE_KNOWLEDGE_BASE];
  }

  addCustomKnowledge(items) {
    if (!Array.isArray(items)) items = [items];
    const newItems = items.map(item => ({ ...item, isCustomTrained: true }));
    this.customKnowledge = [...newItems, ...this.customKnowledge];
    this.rebuildKnowledgeBase();
  }

  clearCustomKnowledge() {
    this.customKnowledge = [];
    this.rebuildKnowledgeBase();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.customKnowledge || newConfig.customFaqs) {
      this.customKnowledge = [...(newConfig.customKnowledge || []), ...(newConfig.customFaqs || [])];
    }
    this.rebuildKnowledgeBase();
  }

  /**
   * Tokenize and normalize input string
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /**
   * Compute similarity score between query tokens and target keywords/text
   */
  computeScore(queryTokens, targetText, targetKeywords = []) {
    const targetTokens = new Set([...this.tokenize(targetText), ...targetKeywords.flatMap(k => this.tokenize(k))]);
    if (targetTokens.size === 0 || queryTokens.length === 0) return 0;

    let matches = 0;
    for (const token of queryTokens) {
      if (targetTokens.has(token)) {
        matches += 1.5;
      } else {
        // Partial substring match for insurance terms (e.g. "deduct" -> "deductible")
        for (const target of targetTokens) {
          if (target.includes(token) || token.includes(target)) {
            matches += 0.8;
            break;
          }
        }
      }
    }

    return matches / Math.sqrt(queryTokens.length * targetTokens.size);
  }

  /**
   * Classify user query into intents or matching FAQ
   */
  classify(text) {
    const raw = (text || '').trim();
    const queryTokens = this.tokenize(raw);
    const lower = raw.toLowerCase();

    // 1. Direct Greetings & Pleasantries
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|howdy)\b/i.test(lower)) {
      return {
        intent: 'greeting',
        confidence: 0.99,
        reply: `Hello! 👋 How can I help you today? You can ask me any insurance question, get an instant quote, or file a claim.`
      };
    }

    if (/^(thank\s*you|thanks|thx|appreciate\s*it|awesome|great|perfect)\b/i.test(lower)) {
      return {
        intent: 'thanks',
        confidence: 0.95,
        reply: `You're very welcome! 😊 Protecting what matters most to you is what we do best. Is there anything else you'd like to check or calculate?`
      };
    }

    // 2. Human Agent / Escalation
    if (/human|agent|representative|advisor|speak\s*to\s*(someone|person)|customer\s*service\s*rep/i.test(lower)) {
      return {
        intent: 'human_handover',
        confidence: 0.95,
        reply: `I'd be glad to connect you with a licensed underwriter! You can reach our direct priority line at **${this.config.company?.supportPhone || '+1 (800) 555-0199'}** or email **${this.config.company?.supportEmail || 'care@insurance.example.com'}**.\n\nAlternatively, enter your email or phone below and I'll schedule a callback within 15 minutes.`
      };
    }

    // 3. Claims Intents
    if (/claim|accident|stolen|theft|damage|broken|crashed|file\s*a\s*claim|report\s*(damage|loss)/i.test(lower)) {
      // Check if it's an informational claim question first
      const faqMatch = this.matchKnowledgeBase(queryTokens, 'claims');
      if (faqMatch && faqMatch.score > 0.45 && /difference|how\s*long|timeline|when\s*will/i.test(lower)) {
        return {
          intent: 'faq',
          confidence: faqMatch.score,
          matchedItem: faqMatch.item,
          reply: faqMatch.item.answer
        };
      }

      return {
        intent: 'start_claim_flow',
        confidence: 0.9,
        action: 'OPEN_CLAIMS_WIZARD'
      };
    }

    // 4. Payment / Checkout Intents
    if (/\b(pay|payment|checkout|buy\s*policy|purchase|renew\s*policy|premium\s*payment|bill)\b/i.test(lower)) {
      // If it's a general question about payment methods or installments
      if (/methods?|accept|how\s*can\s*i\s*pay|installment|monthly/i.test(lower)) {
        const faqMatch = this.matchKnowledgeBase(queryTokens, 'payments');
        if (faqMatch && faqMatch.score > 0.35) {
          return {
            intent: 'faq',
            confidence: faqMatch.score,
            matchedItem: faqMatch.item,
            reply: faqMatch.item.answer
          };
        }
      }

      return {
        intent: 'start_payment_flow',
        confidence: 0.9,
        action: 'OPEN_PAYMENT_WIZARD'
      };
    }

    // 5. Quote Calculation Intents
    if (/\b(quote|price|cost|estimate|rate|how\s*much|calculate|premium|coverage\s*for)\b/i.test(lower)) {
      let productType = 'auto';
      if (/car|auto|motor|vehicle|driver/i.test(lower)) productType = 'auto';
      else if (/health|medical|doctor|hospital/i.test(lower)) productType = 'health';
      else if (/home|house|property|apartment|renter/i.test(lower)) productType = 'home';
      else if (/life|death|term\s*life/i.test(lower)) productType = 'life';
      else if (/travel|flight|trip|vacation/i.test(lower)) productType = 'travel';

      return {
        intent: 'start_quote_flow',
        confidence: 0.92,
        productType,
        action: 'OPEN_QUOTE_WIZARD'
      };
    }

    // 6. Policy Lookup / Certificate Intents
    if (/policy\s*number|certificate|proof\s*of\s*insurance|my\s*policy|policy\s*status/i.test(lower)) {
      return {
        intent: 'policy_lookup',
        confidence: 0.88,
        action: 'OPEN_POLICY_LOOKUP'
      };
    }

    // 7. General Knowledge Base FAQ Search
    const bestFaq = this.matchKnowledgeBase(queryTokens);
    if (bestFaq && bestFaq.score >= 0.28) {
      return {
        intent: 'faq',
        confidence: bestFaq.score,
        matchedItem: bestFaq.item,
        reply: bestFaq.item.answer
      };
    }

    // 8. Fallback Smart Response
    return {
      intent: 'fallback',
      confidence: 0.1,
      reply: `I want to make sure you get the exact information you need! Here are the most popular actions:\n\n• **Instant Quotes:** Get real-time pricing for Auto, Health, Home, Life, or Travel.\n• **Claims & Emergency:** Step-by-step incident reporting with instant triage.\n• **Policy Checkout:** Secure payment via Card, Mobile Money, or Digital Wallet.\n\nCould you clarify what you'd like to explore, or pick an option below?`,
      suggestedQuickReplies: [
        { label: '🚗 Auto Quote', payload: 'intent_quote_auto' },
        { label: '🏥 Health Plans', payload: 'intent_quote_health' },
        { label: '📑 File a Claim', payload: 'intent_claim' },
        { label: '💳 Pay Premium', payload: 'intent_pay' },
        { label: '📞 Speak to Advisor', payload: 'intent_agent_handover' }
      ]
    };
  }

  /**
   * Search knowledge base for highest scoring match
   */
  matchKnowledgeBase(queryTokens, categoryFilter = null) {
    let best = null;
    let highestScore = 0;

    for (const item of this.knowledgeBase) {
      if (categoryFilter && item.category !== categoryFilter) continue;

      let score = this.computeScore(queryTokens, item.question + ' ' + item.answer, item.keywords || []);
      // Custom user-trained knowledge receives priority boost so company-specific answers win
      if (item.isCustomTrained) {
        score *= 1.35;
      }
      if (score > highestScore) {
        highestScore = score;
        best = item;
      }
    }

    if (best) {
      return { item: best, score: highestScore };
    }
    return null;
  }
}

export default IntentEngine;
