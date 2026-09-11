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
          reply: faqMatch.item.answer + '\n\n' + this.generateFollowUpQuestion(faqMatch.item)
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
            reply: faqMatch.item.answer + '\n\n' + this.generateFollowUpQuestion(faqMatch.item)
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
      const followUp = this.generateFollowUpQuestion(bestFaq.item);
      return {
        intent: 'faq',
        confidence: bestFaq.score,
        matchedItem: bestFaq.item,
        reply: `${bestFaq.item.answer}\n\n${followUp}`,
        suggestedQuickReplies: [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '💳 Proceed to Payment', payload: 'intent_pay' },
          { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
        ]
      };
    }

    // 8. Lead Capture Flow for Undefined Queries / Custom Inquiries
    let needTopic = raw.replace(/^(do you have|do you offer|can you do|can you provide|tell me about|how about|what about|i want|i need|i'm looking for|we need)\s+/i, '').trim();
    if (!needTopic || needTopic.length < 3) needTopic = raw;

    return {
      intent: 'lead_capture_needed',
      confidence: 0.2,
      action: 'LEAD_CAPTURE',
      inquiredNeed: needTopic,
      reply: `That's a fantastic inquiry regarding **${needTopic}**! While that isn't directly covered in my standard knowledge base right now, I want to make sure you get an accurate, personalized answer from our specialist team.\n\nCould you please share your **full name**?`
    };
  }

  /**
   * Generates a context-aware human follow-up question based on topic and company goal tone
   */
  generateFollowUpQuestion(item) {
    const tone = this.config.followUpDynamics?.tone || (this.config.goal === 'customer_support' ? 'support' : (this.config.goal === 'payment_checkout' ? 'sales' : 'consultative'));

    if (tone === 'direct') {
      return '💬 Would you like to proceed with this or explore other options?';
    }

    if (!item) {
      if (tone === 'sales') return '💬 Would you like me to connect you with an advisor to reserve this rate today?';
      if (tone === 'support') return '💬 Did this completely solve your inquiry, or can I clarify anything else?';
      return '💬 Does this answer your question, or would you like me to clarify anything specific?';
    }

    const cat = item.category || '';
    const q = (item.question || '').toLowerCase();

    if (tone === 'sales') {
      if (cat === 'payments' || q.includes('pay')) {
        return '💬 Shall we complete your activation and lock in your discount right now?';
      }
      if (cat === 'auto' || cat === 'health') {
        return '💬 Would you like our underwriter to reserve this quote for you today?';
      }
    }

    if (tone === 'support') {
      if (cat === 'claims' || q.includes('claim')) {
        return '💬 Would you like me to file this claim for you immediately, or do you have supporting documents to check?';
      }
      return '💬 Did this help resolve your concern, or would you prefer a quick call from a support specialist?';
    }

    if (cat === 'claims' || q.includes('claim')) {
      return '💬 Would you like me to start an incident report and fast-track a claim for you right now?';
    }
    if (cat === 'auto' || q.includes('auto') || q.includes('car')) {
      return '💬 Would you like me to calculate an exact quote with these options included, or compare another tier?';
    }
    if (cat === 'health' || q.includes('health') || q.includes('medical')) {
      return '💬 Would you like to compare our Silver, Gold, and Platinum health tiers, or check family add-on rates?';
    }
    if (cat === 'payments' || q.includes('pay') || q.includes('discount')) {
      return '💬 Would you like to proceed with checkout and apply your active discount code now?';
    }
    if (q.includes('deductible')) {
      return '💬 Would you like to see how choosing a higher or lower deductible affects your monthly premium?';
    }

    return '💬 Does this answer what you had in mind, or would you like me to clarify anything specific about your setup?';
  }

  /**
   * Search knowledge base for highest scoring match
   */
  matchKnowledgeBase(queryTokens, categoryFilter = null) {
    const stopWords = new Set(['do', 'you', 'we', 'i', 'the', 'a', 'an', 'and', 'or', 'of', 'for', 'in', 'on', 'to', 'is', 'are', 'it', 'can', 'how', 'what', 'offer', 'have', 'insurance', 'policy']);
    let best = null;
    let highestScore = 0;

    for (const item of this.knowledgeBase) {
      if (categoryFilter && item.category !== categoryFilter) continue;

      const qTokens = new Set([...this.tokenize(item.question), ...(item.keywords || []).flatMap(k => this.tokenize(k))]);
      let keyMatches = 0;
      for (const token of queryTokens) {
        if (qTokens.has(token) && !stopWords.has(token)) {
          keyMatches += 2.5;
        }
      }

      let score = this.computeScore(queryTokens, item.question + ' ' + item.answer, item.keywords || []);
      if (keyMatches > 0) {
        score += keyMatches * 0.2;
      } else {
        // If NO domain keywords or question words matched at all, penalize
        score *= 0.2;
      }

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
