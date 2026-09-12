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
    this.knowledgeBase = this.config.mode === 'saas'
      ? [...this.customKnowledge]
      : [...this.customKnowledge, ...INSURANCE_KNOWLEDGE_BASE];
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
   * Extract morphological word stem for fuzzy root matching
   */
  getStem(word) {
    if (!word || word.length < 4) return word || '';
    return word
      .toLowerCase()
      .replace(/(ing|tions?|tionals?|ated|ates?|ating|ed|es|s|ments?|ables?|ity|al|ive|izes?|ises?)$/, '');
  }

  /**
   * Determine if two words share a semantic root or significant prefix
   * (e.g. "automation" and "automated" -> root "automat")
   */
  wordsMatch(w1, w2) {
    if (!w1 || !w2) return false;
    if (w1 === w2) return true;
    if (w1.length >= 4 && w2.length >= 4) {
      if (w1.includes(w2) || w2.includes(w1)) return true;
      const s1 = this.getStem(w1);
      const s2 = this.getStem(w2);
      if (s1.length >= 3 && s2.length >= 3) {
        if (s1 === s2 || s1.startsWith(s2) || s2.startsWith(s1)) return true;
      }
      const minLen = Math.min(w1.length, w2.length);
      if (minLen >= 5) {
        const prefixLen = Math.min(5, minLen);
        if (w1.slice(0, prefixLen) === w2.slice(0, prefixLen)) return true;
      }
    }
    return false;
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
        // Root/stem matching (e.g. "automation" -> "automated", "deduct" -> "deductible")
        for (const target of targetTokens) {
          if (this.wordsMatch(token, target)) {
            matches += 1.0;
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

    const isSaas = this.config.mode === 'saas';

    // 1. Direct Greetings & Pleasantries
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|howdy)\b/i.test(lower)) {
      const greetMsg = this.config.bot?.greeting || (isSaas
        ? `Hey! 👋 How can I help you today? Feel free to ask about our pricing, features, or how to get started.`
        : `Hello! 👋 How can I help you today? You can ask me any insurance question, get an instant quote, or file a claim.`);
      return {
        intent: 'greeting',
        confidence: 0.99,
        reply: greetMsg
      };
    }

    if (/^(thank\s*you|thanks|thx|appreciate\s*it|awesome|great|perfect)\b/i.test(lower)) {
      return {
        intent: 'thanks',
        confidence: 0.95,
        reply: isSaas
          ? `You're very welcome! 😊 Let me know if you have any other questions or need help setting up your bot.`
          : `You're very welcome! 😊 Protecting what matters most to you is what we do best. Is there anything else you'd like to check or calculate?`
      };
    }

    // 2. Human Agent / Escalation
    if (/human|agent|representative|advisor|speak\s*to\s*(someone|person)|customer\s*service\s*rep/i.test(lower)) {
      const phone = this.config.company?.supportPhone || '+1 (800) 555-0199';
      const email = this.config.company?.supportEmail || (isSaas ? 'care@botly.ai' : 'care@insurance.example.com');
      return {
        intent: 'human_handover',
        confidence: 0.95,
        reply: isSaas
          ? `I'd be glad to connect you with our team! You can reach us at **${phone}** or email **${email}**.\n\nAlternatively, enter your email or phone below and someone from our team will reach out shortly.`
          : `I'd be glad to connect you with a licensed underwriter! You can reach our direct priority line at **${phone}** or email **${email}**.\n\nAlternatively, enter your email or phone below and I'll schedule a callback within 15 minutes.`
      };
    }

    // In insurance mode ONLY, evaluate claim / quote / policy flows
    if (!isSaas) {
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
    }

    // 7. General Knowledge Base FAQ Search
    const bestFaq = this.matchKnowledgeBase(queryTokens);
    if (bestFaq && bestFaq.score >= 0.25) {
      const followUp = this.generateFollowUpQuestion(bestFaq.item);
      let replyPrefix = '';
      if (bestFaq.item.source === 'document' || bestFaq.item.category === 'document') {
        replyPrefix = '**From Company Records:**\n\n';
      } else if (bestFaq.item.source === 'website' || bestFaq.item.category === 'website') {
        const host = bestFaq.item.sourceUrl ? bestFaq.item.sourceUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') : 'Website';
        replyPrefix = `**From Website Knowledge (${host}):**\n\n`;
      }

      const compName = this.config.company?.name;
      const teamLabel = compName && compName !== 'Botly' ? `the ${compName} team` : 'the team';
      const quickReplies = isSaas ? [
        { label: 'Our Services', payload: 'What services do you offer?' },
        { label: 'Get started', payload: 'How do I get started?' },
        { label: 'Talk to someone', payload: `I want to speak with someone from ${teamLabel}` }
      ] : [
        { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
        { label: '💳 Proceed to Payment', payload: 'intent_pay' },
        { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
      ];
      return {
        intent: 'faq',
        confidence: bestFaq.score,
        matchedItem: bestFaq.item,
        reply: `${replyPrefix}${bestFaq.item.answer}\n\n${followUp}`,
        suggestedQuickReplies: quickReplies
      };
    }

    // 8. If SaaS mode and asked about pricing / cost / how much
    if (isSaas && /\b(price|pricing|cost|how\s*much|fee|rate|\$10|ten\s*dollars|plan|plans|charge|pay|purchase|buy)\b/i.test(lower)) {
      const compName = this.config.company?.name;
      const isBotlySelf = !compName || compName.toLowerCase() === 'botly' || /botly|chatbot\s*(cost|pricing|price)|buy\s*(a\s*)?chatbot/i.test(lower);

      if (isBotlySelf) {
        return {
          intent: 'faq',
          confidence: 0.9,
          reply: `$10 per chatbot per company, flat.\n\nNo ongoing subscription, no per-message fees, no hidden charges. You pay $10 once to deploy a bot for a company with unlimited conversations.\n\nNeed a high-volume multi-brand or agency deployment? Custom Enterprise pricing is also available.\n\n💬 Would you like help getting started?`,
          suggestedQuickReplies: [
            { label: 'Get started', payload: 'I want to get a chatbot for my company, how do I start?' },
            { label: 'Custom Enterprise', payload: 'Tell me about custom Enterprise pricing' },
            { label: 'Talk to someone', payload: 'I want to speak with someone from the team' }
          ]
        };
      } else {
        const supportEmail = this.config.company?.supportEmail || 'our team';
        return {
          intent: 'faq',
          confidence: 0.85,
          reply: `For exact pricing, plans, or tailored packages for **${compName}**, please contact our team directly at **${supportEmail}** or leave your contact information below.\n\n💬 Would you like someone from our team to reach out to you?`,
          suggestedQuickReplies: [
            { label: 'Talk to someone', payload: `I want to speak with someone from the ${compName} team` }
          ]
        };
      }
    }

    // 9. Lead Capture Flow for Undefined Queries / Custom Inquiries
    let needTopic = raw.replace(/^(do you have|do you offer|can you do|can you provide|tell me about|how about|what about|i want|i need|i'm looking for|we need)\s+/i, '').trim();
    if (!needTopic || needTopic.length < 3) needTopic = raw;

    const compName = this.config.company?.name || 'our';
    return {
      intent: 'lead_capture_needed',
      confidence: 0.2,
      action: 'LEAD_CAPTURE',
      inquiredNeed: needTopic,
      reply: isSaas
        ? `Great inquiry regarding **${needTopic}**! While I don't have those specific details in my instant memory right now, I'd love to connect you with the **${compName}** team so someone can assist you directly.\n\nCould you please share your **full name**?`
        : `That's a fantastic inquiry regarding **${needTopic}**! While that isn't directly covered in my standard knowledge base right now, I want to make sure you get an accurate, personalized answer from our specialist team.\n\nCould you please share your **full name**?`
    };
  }

  /**
   * Generates a context-aware human follow-up question based on topic and company goal tone
   */
  generateFollowUpQuestion(item) {
    if (this.config.mode === 'saas') {
      const goals = this.config.goals || (this.config.goal ? [this.config.goal] : ['lead_generation']);
      if (goals.includes('payment_checkout')) {
        return '💬 Would you like to complete an order or checkout, or do you have any other questions?';
      }
      if (goals.includes('consultation_booking')) {
        return '💬 Would you like to schedule a 1-on-1 consultation or demo session with our team?';
      }
      if (goals.includes('lead_generation')) {
        return '💬 Would you like our team to follow up with you directly, or can I help with anything else?';
      }
      return '💬 Does this help, or would you like more details?';
    }

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
      const isDocOrWeb = item.source === 'document' || item.source === 'website' || item.category === 'document' || item.category === 'website';
      const aTokens = isDocOrWeb ? new Set(this.tokenize(item.answer || '')) : null;
      let keyMatches = 0;

      for (const token of queryTokens) {
        if (!stopWords.has(token)) {
          let matched = false;
          for (const qt of qTokens) {
            if (this.wordsMatch(token, qt)) {
              keyMatches += (token === qt ? 2.5 : 2.0);
              matched = true;
              break;
            }
          }
          if (!matched && aTokens) {
            for (const at of aTokens) {
              if (this.wordsMatch(token, at)) {
                keyMatches += (token === at ? 1.5 : 1.2);
                break;
              }
            }
          }
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
