/**
 * Natural Language Processing & Intent Engine
 * Performs fuzzy intent classification, knowledge-base matching, and flow routing.
 */

import { INSURANCE_KNOWLEDGE_BASE } from './knowledge-base.js';
import { buildProductSearchUrl, searchProducts, getDepartmentHint, fetchLiveScrapedProducts, formatScrapedProductsResult } from '../tools/tool-registry.js';

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
    if (!word || word.length < 3) return (word || '').toLowerCase();
    return word
      .toLowerCase()
      .replace(/(ing|tions?|tionals?|ated|ates?|ating|ed|es|s|ments?|ables?|ity|al|ive|izes?|ises?)$/, '');
  }

  /**
   * Determine if two words share a semantic root
   * (e.g. "automation" and "automated" -> root "automat", "cars" and "car" -> root "car")
   */
  wordsMatch(w1, w2) {
    if (!w1 || !w2) return false;
    const v1 = w1.toLowerCase();
    const v2 = w2.toLowerCase();
    if (v1 === v2) return true;
    const s1 = this.getStem(v1);
    const s2 = this.getStem(v2);
    if (s1.length >= 2 && s2.length >= 2 && s1 === s2) return true;
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
   * Extract key topical and entity keywords from conversational queries
   */
  extractQueryKeywords(rawText = '') {
    if (!rawText) return { keywords: [], cleanQuery: '', searchTerms: '', isProductInquiry: false, isAboutCompany: false };
    const raw = rawText.trim();
    let cleaned = raw;
    let isProductInquiry = false;

    // Check if input contains or is a search/catalog URL (e.g. https://www.jumia.co.ke/catalog/?q=eggs)
    const urlQueryMatch = raw.match(/[?&]q=([^&#]+)/i);
    if (urlQueryMatch) {
      try {
        cleaned = decodeURIComponent(urlQueryMatch[1].replace(/\+/g, ' ')).trim();
      } catch (e) {
        cleaned = urlQueryMatch[1].replace(/\+/g, ' ').trim();
      }
      isProductInquiry = true;
    } else if (/^https?:\/\//i.test(raw)) {
      try {
        const parsedUrl = new URL(raw);
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          cleaned = pathParts[pathParts.length - 1].replace(/[-_]+/g, ' ').trim();
          isProductInquiry = true;
        }
      } catch (e) {}
    }

    const isAboutCompany = /^(?:what\s*is|who\s*(?:is|are)|about\s*(?:us|the\s*company)|tell\s*me\s*about\s*(?:the\s*company|you)|what\s*do\s*you\s*(?:guys\s*)?do)\b/i.test(raw);

    const productPrefixPatterns = [
      /^(?:i\s*(?:am\s*looking|'m\s*looking|look)\s*for)\s+/i,
      /^(?:looking\s*for)\s+/i,
      /^(?:i\s*want\s*to\s*(?:buy|purchase|order|get|find|see|have))\s+/i,
      /^(?:i\s*would\s*like\s*to\s*(?:buy|purchase|order|get|find|see))\s+/i,
      /^(?:i\s*(?:want|need|wish\s*for))\s+/i,
      /^(?:we\s*(?:want|need|are\s*looking\s*for))\s+/i,
      /^(?:do\s*you\s*(?:have|sell|offer|stock|carry))\s+(?:any\s+)?/i,
      /^(?:can\s*i\s*(?:buy|purchase|get|find|order))\s+/i,
      /^(?:can\s*you\s*(?:show|give|find|recommend)\s*me)\s+/i,
      /^(?:show\s*me|search\s*for|find\s*me)\s+/i,
      /^(?:where\s*can\s*i\s*(?:find|buy|get|order))\s+/i,
      /^(?:what\s*kind\s*of|what\s*types?\s*of)\s+/i,
      /^(?:what\s*(?:do\s*you\s*have|are\s*there)\s*for)\s+/i,
      /^(?:is\s*there\s*any|are\s*there\s*any)\s+/i
    ];

    for (const p of productPrefixPatterns) {
      if (p.test(cleaned)) {
        isProductInquiry = true;
        cleaned = cleaned.replace(p, '');
        break;
      }
    }

    if (!isProductInquiry && !isAboutCompany && /\b(buy|purchase|order|shop|stock|items?|products?|catalog|deal|deals|selling)\b/i.test(raw)) {
      isProductInquiry = true;
    }

    // Strip conversational trailing questions/phrases
    cleaned = cleaned
      .replace(/\s+(?:what\s*do\s*you\s*have|what\s*(?:is|are)\s*available|do\s*you\s*have\s*any|do\s*you\s*have\s*that|do\s*you\s*have\s*them|in\s*stock|available|on\s*(?:your\s*)?(?:site|store|jumia)|can\s*i\s*get(?:\s*one|\s*some)?|please|for\s*sale|right\s*now|today)[?!.,\s]*$/i, '')
      .replace(/[?!.,]+$/g, '')
      .trim();

    // Strip leading articles or quantities
    cleaned = cleaned.replace(/^(?:a|an|the|some|any|pair\s*of)\s+/i, '').trim();

    // Secondary cleanup of filler words to isolate key topical entities
    const fillerWords = new Set([
      'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours',
      'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
      'about', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
      'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will',
      'shall', 'may', 'might', 'what', 'which', 'who', 'whom', 'this', 'that',
      'these', 'those', 'any', 'some', 'all', 'and', 'or', 'but', 'if', 'so',
      'there', 'here', 'please', 'want', 'need', 'buy', 'purchase', 'order',
      'looking', 'look', 'find', 'get', 'show', 'tell', 'give', 'sell', 'offer',
      'have', 'available', 'stock', 'something', 'thing', 'things',
      'insurance', 'policy', 'policies', 'cover', 'coverage', 'explain', 'tell',
      'https', 'http', 'www', 'com', 'co', 'ke', 'org', 'net',
      'catalog', 'search', 'query', 'url', 'website', 'web', 'page', 'site',
      'jumia', 'botly'
    ]);

    const rawTokens = this.tokenize(cleaned);
    const keywords = rawTokens.filter(t => !fillerWords.has(t) && t.length >= 2);

    let searchTerms = keywords.join(' ');
    if (!searchTerms) {
      searchTerms = cleaned || raw;
    }

    return {
      keywords,
      cleanQuery: cleaned || raw,
      searchTerms,
      isProductInquiry: isProductInquiry && !isAboutCompany,
      isAboutCompany
    };
  }

  /**
   * Asynchronous intent classification with live web scraping resolution for dynamic tools
   */
  async classifyAsync(text) {
    const res = this.classify(text);
    if (res.action === 'PRODUCT_SEARCH' && !res.isOutOfScope) {
      try {
        const webUrl = this.config.company?.websiteUrl || '';
        const compName = this.config.company?.name || 'our store';
        const liveData = await fetchLiveScrapedProducts(res.productQuery || text, webUrl);
        if (liveData && liveData.found && liveData.items && liveData.items.length > 0) {
          const formatted = formatScrapedProductsResult(liveData, res.productQuery || text, webUrl, compName);
          if (formatted) {
            return {
              ...res,
              isLiveScraped: true,
              scrapedItems: liveData.items,
              searchUrl: formatted.searchUrl || res.searchUrl,
              reply: formatted.message,
              suggestedQuickReplies: formatted.suggestedQuickReplies,
              quickReplies: formatted.suggestedQuickReplies
            };
          }
        }
      } catch (err) {
        // Fallback to synchronous classify result
      }
    }
    return res;
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

    // User explicitly asking to repeat the last question or what was asked
    if (/\b(repeat(\s*the)?\s*question|ask\s*(me\s*)?(again|that)|what\s*did\s*you\s*(just\s*)?ask|say\s*(that\s*)?again|what\s*was\s*that\s*question)\b/i.test(lower)) {
      if (this.memory && this.memory.lastFollowUp && this.memory.lastFollowUp.text) {
        return {
          intent: 'repeat_question',
          confidence: 0.98,
          reply: `I was asking:\n\n${this.memory.lastFollowUp.text}`
        };
      }
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

    // Payment / Checkout Intents (both SaaS mode with payment_checkout goal and insurance mode)
    const configGoals = this.config.goals || (this.config.goal ? [this.config.goal] : []);
    const hasPaymentGoal = configGoals.includes('payment_checkout') || !!(this.config.checkout && this.config.checkout.enabled);

    if (!isSaas || hasPaymentGoal) {
      if (lower === 'checkout_method_mpesa' || /\b(mpesa|m-pesa|lipa\s*na\s*mpesa)\b/i.test(lower)) {
        return {
          intent: 'start_payment_flow',
          confidence: 0.95,
          action: 'OPEN_PAYMENT_WIZARD',
          paymentMethod: 'mpesa'
        };
      }
      if (lower === 'checkout_method_card' || /\b(credit\s*card|debit\s*card|pay\s*with\s*card|visa|mastercard|stripe|paypal)\b/i.test(lower)) {
        return {
          intent: 'start_payment_flow',
          confidence: 0.95,
          action: 'OPEN_PAYMENT_WIZARD',
          paymentMethod: 'card'
        };
      }
      if (/\b(pay(\s*now|\s*my|\s*bill|\s*policy|\s*premium|\s*online)?|checkout(\s*now)?|lipa(\s*sasa)?|make\s*payment|proceed\s*to\s*checkout|start\s*checkout)\b/i.test(lower) && !/\b(watch|phone|laptop|tv|product|shoes|dress|sneaker|plan|pricing|cost|how\s*much|quote)\b/i.test(lower)) {
        // If it's a general question about payment methods or installments
        if (/methods?|accept|how\s*can\s*i\s*pay|installment|monthly/i.test(lower)) {
          const faqMatch = this.matchKnowledgeBase(queryTokens, 'payments', raw);
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
          action: 'OPEN_PAYMENT_WIZARD',
          paymentMethod: null
        };
      }
    }

    // In insurance mode ONLY, evaluate claim / quote / policy flows
    if (!isSaas) {
      // 3. Claims Intents
      if (/claim|accident|stolen|theft|damage|broken|crashed|file\s*a\s*claim|report\s*(damage|loss)/i.test(lower)) {
        // Check if it's an informational claim question first
        const faqMatch = this.matchKnowledgeBase(queryTokens, 'claims', raw);
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
          confidence: 0.95,
          action: 'OPEN_CLAIMS_WIZARD'
        };
      }

      // 4. Quote / Price Calculation Intents
      if (/\b(quote|cost|rate|calculate|estimate|how\s*much\s*is|pricing)\b/i.test(lower)) {
        let productType = 'auto';
        if (/health|medical|hospital/i.test(lower)) productType = 'health';
        else if (/home|property|house|rent/i.test(lower)) productType = 'home';
        else if (/life|funeral|term/i.test(lower)) productType = 'life';
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
    const bestFaq = this.matchKnowledgeBase(queryTokens, null, raw);
    if (bestFaq && bestFaq.score >= 0.45) {
      const followUp = this.generateFollowUpQuestion(bestFaq.item);
      let replyPrefix = '';
      const host = bestFaq.item.sourceUrl ? bestFaq.item.sourceUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') : 'Website';
      const compName = this.config.company?.name || 'our company';

      if (bestFaq.item.source === 'document' || bestFaq.item.category === 'document') {
        replyPrefix = '**From Company Records:**\n\n';
      } else if (bestFaq.item.source === 'website' || bestFaq.item.category === 'website' || bestFaq.item.contentType) {
        replyPrefix = `**From Website Knowledge (${host}):**\n\n`;
      }

      const teamLabel = compName && compName !== 'Botly' && compName !== 'Botly Pro' ? `the ${compName} team` : 'the team';

      // Detect product catalog listings with prices and direct URLs
      const detectedProducts = [];
      if (bestFaq.item.products && Array.isArray(bestFaq.item.products) && bestFaq.item.products.length > 0) {
        detectedProducts.push(...bestFaq.item.products);
      } else if (bestFaq.item.answer) {
        const lines = bestFaq.item.answer.split('\n');
        for (const l of lines) {
          const pMatch = l.match(/[•\*\-]+\s*\*\*([^*]+)\*\*.*?[—–\-:]\s*\*\*([A-Z\$]{1,4})?\s*([0-9,]+(?:\.[0-9]{2})?)\*\*/i);
          if (pMatch) {
            const pName = pMatch[1].trim();
            const pCur = pMatch[2] ? pMatch[2].trim() : (this.config.currency?.code || 'KES');
            const pAmt = parseFloat(pMatch[3].replace(/,/g, ''));
            const urlMatch = l.match(/\((https?:\/\/[^)]+)\)/i);
            const pUrl = (urlMatch ? urlMatch[1] : null) || (bestFaq.item.sourceUrl || (this.config.company?.websiteUrl ? this.config.company.websiteUrl + '/products' : ''));
            detectedProducts.push({ name: pName, price: pAmt, currency: pCur, url: pUrl, rawLine: l.trim() });
          }
        }
      }

      // Check if user is asking for a specific product or item
      let focusedProduct = null;
      let highestProdScore = 0;
      const stopWords = new Set([
        'i', 'me', 'my', 'we', 'our', 'you', 'your', 'want', 'need', 'buy',
        'purchase', 'order', 'looking', 'for', 'a', 'an', 'the', 'give',
        'how', 'much', 'is', 'are', 'what', 'about', 'show', 'tell',
        'details', 'of', 'cost', 'price', 'can', 'get', 'please', 'to',
        'do', 'have', 'there', 'like', 'interested', 'in', 'some'
      ]);
      const meaningfulTokens = queryTokens.filter(t => !stopWords.has(t) && t.length >= 2);

      if (detectedProducts.length > 0 && meaningfulTokens.length > 0) {
        const queryText = lower;
        for (let pi = 0; pi < detectedProducts.length; pi++) {
          const p = detectedProducts[pi];
          const pNameLower = p.name.toLowerCase();
          const pTokens = pNameLower.split(/[^a-z0-9]+/i).filter(Boolean);
          let pScore = 0;

          // Full product name match
          if (queryText.includes(pNameLower)) {
            pScore += 25;
          }

          // First / brand word match (e.g. "Naviforce", "Curren", "Casio", "Apple", "Samsung", "HP", "Lenovo")
          const brandWord = pTokens[0];
          if (brandWord && brandWord.length >= 3 && queryText.includes(brandWord)) {
            pScore += 10;
          }

          // Individual token matches
          for (const token of meaningfulTokens) {
            if (pTokens.includes(token)) {
              const isCategoryGeneric = /^(watch|watches|phone|phones|laptop|laptops|tv|tvs|smart|device|men|mens|women|womens)$/i.test(token);
              pScore += isCategoryGeneric ? 1 : 5;
            } else if (pNameLower.includes(token) && token.length >= 4) {
              pScore += 3;
            }
          }

          if (pScore > highestProdScore) {
            highestProdScore = pScore;
            focusedProduct = { product: p, index: pi, score: pScore };
          }
        }
      }

      // If user specifically asked for an item, promote that item to top position
      if (focusedProduct && focusedProduct.score >= 5) {
        const [chosenProd] = detectedProducts.splice(focusedProduct.index, 1);
        detectedProducts.unshift(chosenProd);
      }

      // Build focused or catalog reply text
      let finalAnswerText = bestFaq.item.answer;
      if (focusedProduct && focusedProduct.score >= 5) {
        const targetProd = detectedProducts[0];
        const allLines = bestFaq.item.answer.split('\n');
        let matchingLine = '';
        const footerLines = [];
        let pastBullets = false;

        for (const line of allLines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (/^[•\*\-]\s*\*\*/.test(trimmed)) {
            if (trimmed.toLowerCase().includes(targetProd.name.toLowerCase()) ||
                (targetProd.rawLine && trimmed.includes(targetProd.rawLine))) {
              matchingLine = trimmed;
            }
            pastBullets = true;
          } else if (pastBullets) {
            footerLines.push(trimmed);
          }
        }

        if (matchingLine) {
          const footerText = footerLines.length > 0
            ? footerLines.join('\n\n')
            : 'All items are covered by official warranty, customer protection, and doorstep delivery.';
          finalAnswerText = `Here are the details for **${targetProd.name}**:\n\n${matchingLine}\n\n${footerText}\n\nYou can order directly below:`;
        }
      }

      let quickReplies = [];
      if (isSaas) {
        if (detectedProducts.length > 0) {
          const topProd = detectedProducts[0];
          const prodSym = (topProd.currency === 'USD' || topProd.currency === '$') ? '$' : (topProd.currency === 'KES' ? 'KES ' : `${topProd.currency} `);
          const prodShort = topProd.name.length > 20 ? topProd.name.slice(0, 18) + '...' : topProd.name;

          quickReplies.push({
            label: `🛒 Buy ${prodShort} (${prodSym}${Number(topProd.price).toLocaleString()})`,
            payload: `checkout_item:${encodeURIComponent(topProd.name)}:${topProd.price}:${topProd.currency}:${encodeURIComponent(topProd.url || '')}`
          });
          quickReplies.push({
            label: '📱 Pay with M-Pesa',
            payload: `checkout_item:${encodeURIComponent(topProd.name)}:${topProd.price}:${topProd.currency}:${encodeURIComponent(topProd.url || '')}:mpesa`
          });
          quickReplies.push({
            label: '💳 Pay with Card',
            payload: `checkout_item:${encodeURIComponent(topProd.name)}:${topProd.price}:${topProd.currency}:${encodeURIComponent(topProd.url || '')}:card`
          });

          if (focusedProduct && focusedProduct.score >= 5) {
            quickReplies.push({
              label: '🔍 View all options',
              payload: bestFaq.item.question || 'What other options do you offer?'
            });
          } else if (detectedProducts.length > 1) {
            const secProd = detectedProducts[1];
            const secSym = (secProd.currency === 'USD' || secProd.currency === '$') ? '$' : 'KES ';
            const secShort = secProd.name.length > 18 ? secProd.name.slice(0, 16) + '...' : secProd.name;
            quickReplies.splice(1, 0, {
              label: `🛒 ${secShort} (${secSym}${Number(secProd.price).toLocaleString()})`,
              payload: `checkout_item:${encodeURIComponent(secProd.name)}:${secProd.price}:${secProd.currency}:${encodeURIComponent(secProd.url || '')}`
            });
          }
        } else {
          quickReplies = [
            { label: 'Our Services', payload: 'What services do you offer?' },
            { label: 'Get started', payload: 'How do I get started?' },
            { label: 'Talk to someone', payload: `I want to speak with someone from ${teamLabel}` }
          ];
        }
      } else {
        quickReplies = [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '💳 Proceed to Payment', payload: 'intent_pay' },
          { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
        ];
      }

      return {
        intent: 'faq',
        confidence: bestFaq.score,
        matchedItem: bestFaq.item,
        reply: `${replyPrefix}${finalAnswerText}\n\n${followUp}`,
        suggestedQuickReplies: quickReplies,
        quickReplies: quickReplies
      };
    }

    const extracted = this.extractQueryKeywords(raw);
    let needTopic = extracted.cleanQuery;
    if (!needTopic || needTopic.length < 2) needTopic = raw;

    const compName = this.config.company?.name || 'our';
    const webUrl = this.config.company?.websiteUrl || '';

    // Detect ecommerce or shopping intent
    const isEcommerce =
      (this.config.archetype === 'ecommerce' || this.config.archetype === 'retail') ||
      (webUrl && /jumia|amazon|shopify|store|shop|mall|market|catalog/i.test(webUrl)) ||
      (compName && /jumia|store|shop|mall|market|retail/i.test(compName));

    // 8. If SaaS mode and asked about pricing / cost / plans (and NOT an ecommerce product inquiry)
    const isPricingInquiry = !isEcommerce && !extracted.isProductInquiry &&
      (/\b(price|pricing|subscription|plans?|packages?|tier|tiers|fee|rates?|\$10|ten\s*dollars)\b/i.test(lower) || /\b(how\s*much|cost|charge)\b/i.test(lower));

    if (isSaas && isPricingInquiry) {
      const isBotlySelf = !compName || compName.toLowerCase() === 'botly' || compName.toLowerCase() === 'botly pro' || /botly|chatbot\s*(cost|pricing|price)|buy\s*(a\s*)?chatbot/i.test(lower);

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

    // 9. Dynamic Tool Search & Tiered Fallback Engine

    // Tier 3: Live Product Search Tool for Ecommerce / Retail
    if (isEcommerce) {
      let searchKey = extracted.searchTerms || extracted.cleanQuery;
      if (extracted.keywords.includes('toy')) {
        searchKey = 'toy';
      } else if (extracted.keywords.includes('cooking') && extracted.keywords.includes('oil')) {
        searchKey = 'cooking oil';
      } else if (extracted.keywords.length > 0) {
        searchKey = extracted.keywords.slice(0, 3).join(' ');
      }

      const searchResult = searchProducts({ query: searchKey }, this.config);
      const searchUrl = searchResult.searchUrl || buildProductSearchUrl(webUrl, searchKey);
      const suggestedQuickReplies = searchResult.suggestedQuickReplies || [];

      return {
        intent: searchResult.isOutOfScope ? 'out_of_scope' : 'product_search',
        confidence: 0.95,
        action: searchResult.isOutOfScope ? 'OUT_OF_SCOPE' : 'PRODUCT_SEARCH',
        productQuery: searchKey,
        searchUrl: searchUrl,
        reply: searchResult.message,
        suggestedQuickReplies,
        quickReplies: suggestedQuickReplies
      };
    }

    // Tier 4: Unknown / Human Help Needed
    const leadCaptureEnabled = this.config.leadCapture ? this.config.leadCapture.enabled !== false : true;
    if (leadCaptureEnabled) {
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

    // Clean neutral fallback without demanding user's full name
    const supportEmail = this.config.company?.supportEmail || '';
    const supportPhone = this.config.company?.supportPhone || '';
    let contactInfo = '';
    if (supportEmail && supportPhone) {
      contactInfo = `at **${supportEmail}** or call **${supportPhone}**`;
    } else if (supportEmail) {
      contactInfo = `at **${supportEmail}**`;
    } else if (supportPhone) {
      contactInfo = `at **${supportPhone}**`;
    }

    return {
      intent: 'fallback_neutral',
      confidence: 0.3,
      reply: `I don't have the specific details for **"${needTopic}"** in my instant memory. Please reach out to the **${compName}** team ${contactInfo || 'directly'} or ask about our services and policies.`,
      suggestedQuickReplies: [
        { label: 'Our Services', payload: 'What services or products do you offer?' },
        { label: 'Talk to team', payload: `I want to speak with someone from the ${compName} team` }
      ]
    };
  }

  /**
   * Generates a context-aware human follow-up question based on topic, memory, and company goal progression
   */
  generateFollowUpQuestion(item) {
    const cfg = this.config || {};
    const mem = this.memory = this.memory || { turns: 0, history: [], visitedTopics: [], askedFollowUps: [], lastFollowUp: null, goalStage: 0, lastTopic: '' };
    if (typeof mem.goalStage !== 'number') mem.goalStage = 0;
    if (!Array.isArray(mem.askedFollowUps)) mem.askedFollowUps = [];

    const goals = cfg.goals || (cfg.goal ? [cfg.goal] : ['lead_generation']);
    const phoneNum = cfg.company?.supportPhone || '+1 (800) 555-0199';

    const candidateList = [];
    const stage = mem.goalStage;
    let topicLabel = (item && item.question) ? item.question : 'our services';
    if (topicLabel.length > 38) topicLabel = topicLabel.substring(0, 35) + '...';

    if (this.config.mode !== 'saas') {
      const tone = this.config.followUpDynamics?.tone || (this.config.goal === 'customer_support' ? 'support' : (this.config.goal === 'payment_checkout' ? 'sales' : 'consultative'));

      if (tone === 'direct') {
        candidateList.push({ key: 'ins_direct', type: 'direct', text: '💬 Would you like to proceed with this or explore other options?' });
      }

      if (!item) {
        if (tone === 'sales') candidateList.push({ key: 'ins_reserve_rate', type: 'sales', text: '💬 Would you like me to connect you with an advisor to reserve this rate today?' });
        if (tone === 'support') candidateList.push({ key: 'ins_solve_inquiry', type: 'customer_support', text: '💬 Did this completely solve your inquiry, or can I clarify anything else?' });
        candidateList.push({ key: 'ins_clarify_specific', type: 'customer_support', text: '💬 Does this answer your question, or would you like me to clarify anything specific?' });
      } else {
        const cat = item.category || '';
        const q = (item.question || '').toLowerCase();

        if (tone === 'sales') {
          if (cat === 'payments' || q.includes('pay')) {
            candidateList.push({ key: 'ins_complete_act', type: 'payment_checkout', text: '💬 Shall we complete your activation and lock in your discount right now?' });
          }
          if (cat === 'auto' || cat === 'health') {
            candidateList.push({ key: 'ins_reserve_quote', type: 'lead_generation', text: '💬 Would you like our underwriter to reserve this quote for you today?' });
          }
        }

        if (tone === 'support') {
          if (cat === 'claims' || q.includes('claim')) {
            candidateList.push({ key: 'ins_file_claim', type: 'customer_support', text: '💬 Would you like me to file this claim for you immediately, or do you have supporting documents to check?' });
          }
          candidateList.push({ key: 'ins_support_specialist', type: 'customer_support', text: '💬 Did this help resolve your concern, or would you prefer a quick call from a support specialist?' });
        }

        if (cat === 'claims' || q.includes('claim')) {
          candidateList.push({ key: 'ins_start_incident', type: 'customer_support', text: '💬 Would you like me to start an incident report and fast-track a claim for you right now?' });
        }
        if (cat === 'auto' || q.includes('auto') || q.includes('car')) {
          candidateList.push({ key: 'ins_exact_quote', type: 'lead_generation', text: '💬 Would you like me to calculate an exact quote with these options included, or compare another tier?' });
        }
        if (cat === 'health' || q.includes('health') || q.includes('medical')) {
          candidateList.push({ key: 'ins_health_tiers', type: 'lead_generation', text: '💬 Would you like to compare our Silver, Gold, and Platinum health tiers, or check family add-on rates?' });
        }
        if (cat === 'payments' || q.includes('pay') || q.includes('discount')) {
          candidateList.push({ key: 'ins_pay_discount', type: 'payment_checkout', text: '💬 Would you like to proceed with checkout and apply your active discount code now?' });
        }
        if (q.includes('deductible')) {
          candidateList.push({ key: 'ins_deductible_effect', type: 'lead_generation', text: '💬 Would you like to see how choosing a higher or lower deductible affects your monthly premium?' });
        }

        candidateList.push({ key: 'ins_clarify_setup', type: 'customer_support', text: '💬 Does this answer what you had in mind, or would you like me to clarify anything specific about your setup?' });
        candidateList.push({ key: 'ins_more_options', type: 'customer_support', text: '💬 Can I help with any other policy details or coverage options?' });
      }
    } else {

    // SaaS Mode: Progressive, Context-Aware, Memory-Tracking Follow-Up System
    const qLower = (item ? item.question || '' : '').toLowerCase();
    const aLower = (item ? item.answer || '' : '').toLowerCase();
    const fullTxt = `${qLower} ${aLower} ${(item && item.keywords ? item.keywords.join(' ') : '').toLowerCase()}`;

    const isPricing = /\b(price|pricing|cost|fee|rate|plan|plans|package|packages|tier|tiers|\$|subscription|billing|charge)\b/i.test(fullTxt);
    const isServices = /\b(service|services|solution|solutions|feature|features|capability|capabilities|offer|provide|platform|develop|custom)\b/i.test(fullTxt);
    const isSupport = /\b(support|contact|reach|phone|email|help|assist|call|hours|location)\b/i.test(fullTxt);
    const isOnboarding = /\b(start|how|work|setup|install|embed|guide|onboard|getting started|step|process)\b/i.test(fullTxt);

    // 1. If topic is Pricing / Plans
    if (isPricing) {
      if (goals.includes('payment_checkout')) {
        candidateList.push({ key: 'chk_lock_plan', type: 'payment_checkout', text: '💬 Would you like to proceed with secure in-chat checkout to lock in this plan today?' });
        candidateList.push({ key: 'chk_complete_order', type: 'payment_checkout', text: '💬 Ready to get started? We can complete your order right here in chat in under 2 minutes.' });
        candidateList.push({ key: 'chk_launch_now', type: 'payment_checkout', text: '💬 Shall we launch instant checkout now to activate your setup?' });
      }
      if (goals.includes('consultation_booking')) {
        candidateList.push({ key: 'con_pricing_demo', type: 'consultation_booking', text: '💬 Would you like to schedule a 1-on-1 consultation to review a tailored pricing proposal?' });
        candidateList.push({ key: 'con_15min_session', type: 'consultation_booking', text: "💬 Shall we book a quick 15-minute demo with our team to walk through what's included?" });
      }
      if (goals.includes('lead_generation')) {
        candidateList.push({ key: 'lead_custom_pricing', type: 'lead_generation', text: '💬 Would you like our specialist to send you a customized pricing breakdown for your team?' });
        candidateList.push({ key: 'lead_discount_followup', type: 'lead_generation', text: '💬 Shall I have an advisor follow up with you directly to discuss discount options and volume tiers?' });
      }
      if (goals.includes('customer_support') || candidateList.length === 0) {
        candidateList.push({ key: 'sup_pricing_help', type: 'customer_support', text: '💬 Did this pricing information help, or would you like to speak directly with an advisor?' });
      }
    }
    // 2. If topic is Services / Solutions
    else if (isServices) {
      if (goals.includes('lead_generation')) {
        if (stage === 0) {
          candidateList.push({ key: 'lead_which_service', type: 'lead_generation', text: '💬 Which of these services aligns best with your current project, or would you like a tailored recommendation from our team?' });
        }
        candidateList.push({ key: 'lead_custom_proposal', type: 'lead_generation', text: '💬 Would you like our specialist to prepare a custom scope breakdown and proposal for your team?' });
        candidateList.push({ key: 'lead_advisor_connect', type: 'lead_generation', text: '💬 Shall I connect you directly with a specialist to review requirements and share personalized options?' });
      }
      if (goals.includes('consultation_booking')) {
        candidateList.push({ key: 'con_walkthrough', type: 'consultation_booking', text: '💬 Would you like to schedule a 1-on-1 consultation or demo session with our team to walk through your requirements?' });
        candidateList.push({ key: 'con_workflow_demo', type: 'consultation_booking', text: '💬 Would you like to see how this works in practice for your specific workflow in a live demo?' });
      }
      if (goals.includes('payment_checkout')) {
        candidateList.push({ key: 'chk_package_options', type: 'payment_checkout', text: '💬 Would you like to review our available packages and pricing tiers for this service?' });
      }
      if (goals.includes('customer_support')) {
        candidateList.push({ key: 'sup_service_clarify', type: 'customer_support', text: '💬 Does this cover what you were looking for, or can I clarify any specific feature?' });
      }
    }
    // 3. If topic is Support / Contact / Phone
    else if (isSupport) {
      candidateList.push({ key: 'sup_direct_callback', type: 'customer_support', text: '💬 Did this answer address your inquiry, or would you prefer a quick callback from our support specialist?' });
      candidateList.push({ key: 'sup_phone_escalate', type: 'customer_support', text: `💬 Our team is available at **${phoneNum}**. Would you like an advisor to reach out directly?` });
    }
    // 4. If topic is Onboarding / Getting Started
    else if (isOnboarding) {
      if (goals.includes('lead_generation')) {
        candidateList.push({ key: 'lead_onboard_step', type: 'lead_generation', text: '💬 Would you like our team to guide you through getting started with a personalized walkthrough?' });
      }
      if (goals.includes('consultation_booking')) {
        candidateList.push({ key: 'con_onboard_session', type: 'consultation_booking', text: '💬 Would you like to schedule a 1-on-1 onboarding demo session with our specialist?' });
      }
      if (goals.includes('payment_checkout')) {
        candidateList.push({ key: 'chk_onboard_checkout', type: 'payment_checkout', text: '💬 Ready to activate your setup with instant checkout, or do you have any other questions?' });
      }
    }

    // 5. Default progressive sequence across active goals
    const isEcommerceFollowUp =
      (cfg.archetype === 'ecommerce' || cfg.archetype === 'retail') ||
      (cfg.company?.websiteUrl && /jumia|amazon|shopify|store|shop|mall|market|catalog/i.test(cfg.company.websiteUrl)) ||
      (cfg.company?.name && /jumia|store|shop|mall|market|retail/i.test(cfg.company.name));

    if (isEcommerceFollowUp) {
      candidateList.push({ key: 'ecom_delivery_help', type: 'ecommerce', text: '💬 Would you like details on delivery timelines, or help finding another item?' });
      candidateList.push({ key: 'ecom_browse_more', type: 'ecommerce', text: '💬 Can I help you search for anything else on the store today?' });
    } else {
      if (goals.includes('payment_checkout')) {
        candidateList.push({ key: 'chk_default_progress', type: 'payment_checkout', text: '💬 Would you like to complete an order or checkout, or do you have any other questions?' });
      }
      if (goals.includes('consultation_booking')) {
        candidateList.push({ key: 'con_default_progress', type: 'consultation_booking', text: '💬 Would you like to schedule a 1-on-1 consultation or demo session with our team?' });
      }
      if (goals.includes('lead_generation')) {
        candidateList.push({ key: 'lead_default_progress', type: 'lead_generation', text: '💬 Would you like our team to follow up with you directly, or can I help with anything else?' });
        candidateList.push({ key: 'lead_default_progress_2', type: 'lead_generation', text: '💬 Shall I have an advisor follow up with tailored recommendations for your inquiry?' });
      }
      if (goals.includes('customer_support')) {
        candidateList.push({ key: 'sup_default_progress', type: 'customer_support', text: '💬 Does this help address your inquiry, or would you like more details?' });
      }
    }
    candidateList.push({ key: 'gen_default_help', type: goals[0] || 'lead_generation', text: '💬 Does this help, or would you like more details?' });
    }

    // Anti-repetition filter
    let chosen = null;
    for (let ci = 0; ci < candidateList.length; ci++) {
      const cand = candidateList[ci];
      if (!mem.askedFollowUps.includes(cand.key) && !mem.askedFollowUps.includes(cand.text)) {
        chosen = cand;
        break;
      }
    }

    if (!chosen) {
      const cycleNum = mem.askedFollowUps.length + 1;
      const freshKey = `fresh_followup_${cycleNum}`;
      if (goals.includes('consultation_booking') && !mem.askedFollowUps.includes(`fresh_con_${cycleNum}`)) {
        chosen = { key: `fresh_con_${cycleNum}`, type: 'consultation_booking', text: '💬 Would you like to schedule a 1-on-1 advisor call to review any remaining questions?' };
      } else if (goals.includes('payment_checkout') && !mem.askedFollowUps.includes(`fresh_chk_${cycleNum}`)) {
        chosen = { key: `fresh_chk_${cycleNum}`, type: 'payment_checkout', text: '💬 When you are ready, I can help you complete your order right here. Shall we proceed?' };
      } else {
        chosen = { key: freshKey, type: goals[0] || 'lead_generation', text: `💬 What other details about **${topicLabel}** can I help clarify, or would you like our team to connect with you?` };
      }
    }

    mem.askedFollowUps.push(chosen.key);
    mem.askedFollowUps.push(chosen.text);
    mem.goalStage = stage + 1;
    mem.lastTopic = topicLabel;
    mem.lastFollowUp = { type: chosen.type, topic: topicLabel, text: chosen.text, stage };

    return chosen.text;
  }

  /**
   * Search knowledge base for highest scoring match
   */
  matchKnowledgeBase(queryTokens, categoryFilter = null, rawQuery = '') {
    const stopWords = new Set([
      'do', 'you', 'we', 'i', 'the', 'a', 'an', 'and', 'or', 'of', 'for', 'in',
      'on', 'to', 'is', 'are', 'it', 'can', 'how', 'what', 'offer', 'have',
      'insurance', 'policy', 'looking', 'look', 'want', 'need', 'find', 'show',
      'give', 'buy', 'purchase', 'order', 'sell', 'store', 'mall', 'products',
      'product', 'item', 'items', 'shopping', 'online', 'available', 'stock',
      'get', 'deal', 'deals', 'selling', 'carry',
      // Domain & URL boilerplate tokens
      'https', 'http', 'www', 'com', 'co', 'ke', 'org', 'net',
      'catalog', 'search', 'query', 'url', 'website', 'web', 'page', 'site',
      'jumia', 'botly'
    ]);
    let best = null;
    let highestScore = 0;

    const extracted = this.extractQueryKeywords(rawQuery);
    const topicalKeywords = extracted.keywords;
    const isProductInquiry = extracted.isProductInquiry;
    const isAboutCompany = extracted.isAboutCompany;
    const cleanSubject = (extracted.cleanQuery || '').toLowerCase();
    const isPolicyInquiry = /\b(return|refund|returns|refunds|warranty|shipping|delivery|dispatch|timeline|fee|courier|pay|payment|mpesa|m-pesa|card|checkout|terms|privacy|policy|policies)\b/i.test(rawQuery);

    for (const item of this.knowledgeBase) {
      if (categoryFilter && item.category !== categoryFilter) continue;

      // 1. Tag Content Type
      let contentType = item.contentType;
      if (!contentType) {
        if ((item.products && Array.isArray(item.products) && item.products.length > 0) ||
            (item.answer && /[•\*\-]+\s*\*\*([^*]+)\*\*.*?[—–\-:]\s*\*\*([A-Z\$]{1,4})?\s*([0-9,]+(?:\.[0-9]{2})?)\*\*/i.test(item.answer))) {
          contentType = 'product_listing';
        } else if (item.category === 'overview' || item.id === 'web_jumia_home' || /^(what\s*is\s*([a-z0-9]+\s+)?(company|jumia|botly|this|you)|who\s*(we\s*are|are\s*you)|about\s*(us|the\s*company))/i.test(item.question || '')) {
          contentType = 'overview';
        } else if (item.category === 'policies' || item.category === 'policy' || /\b(return|refund|warranty|shipping|delivery|dispatch|courier|guarantee|terms|privacy|payment|pay|m-pesa|mpesa|escrow)\b/i.test(item.question || '')) {
          contentType = 'policy';
        } else {
          contentType = 'faq';
        }
      }
      item.contentType = contentType;

      // 2. Strict Content-Type Gating
      // Overview / Company definition FAQs cannot match specific product or item inquiries
      if (contentType === 'overview' && (isProductInquiry || (!isAboutCompany && topicalKeywords.length > 0))) {
        continue;
      }

      // Policy FAQs cannot match item/product inquiries unless the query specifically asks about policy terms
      if (contentType === 'policy' && isProductInquiry && !isPolicyInquiry) {
        continue;
      }

      // Product Listing Chunks: Strict Domain / Category Alignment
      // A product listing chunk (e.g. laptops, watches, phones) can ONLY match if the query's topical keywords
      // or clean subject specifically align with this chunk's product categories or items.
      if (contentType === 'product_listing' && (isProductInquiry || topicalKeywords.length > 0)) {
        const allowedProductTokens = new Set();
        (item.keywords || []).forEach(k => {
          this.tokenize(k).forEach(t => {
            if (!stopWords.has(t) && t.length >= 2) allowedProductTokens.add(t.toLowerCase());
          });
        });
        this.tokenize(item.question || '').forEach(t => {
          if (!stopWords.has(t) && t.length >= 2) allowedProductTokens.add(t.toLowerCase());
        });
        if (item.products && Array.isArray(item.products)) {
          item.products.forEach(p => {
            this.tokenize(p.name || '').forEach(t => {
              if (!stopWords.has(t) && t.length >= 2) allowedProductTokens.add(t.toLowerCase());
            });
          });
        }
        if (item.answer) {
          const bMatches = item.answer.match(/\*\*([^*]+)\*\*/g) || [];
          bMatches.forEach(b => {
            this.tokenize(b).forEach(t => {
              if (!stopWords.has(t) && t.length >= 2) allowedProductTokens.add(t.toLowerCase());
            });
          });
        }

        let chunkHasProductMatch = false;
        for (const tk of topicalKeywords) {
          for (const ap of allowedProductTokens) {
            if (this.wordsMatch(tk, ap)) {
              chunkHasProductMatch = true;
              break;
            }
          }
          if (chunkHasProductMatch) break;
        }

        // Exact cleanSubject substring check against question/keywords
        if (!chunkHasProductMatch && cleanSubject && cleanSubject.length >= 3) {
          if ((item.question || '').toLowerCase().includes(cleanSubject) ||
              (item.keywords || []).some(k => k.toLowerCase().includes(cleanSubject))) {
            chunkHasProductMatch = true;
          }
        }

        if (!chunkHasProductMatch) {
          continue;
        }
      }

      const qTokens = new Set([...this.tokenize(item.question), ...(item.keywords || []).flatMap(k => this.tokenize(k))]);
      const isDocOrWeb = item.source === 'document' || item.source === 'website' || item.category === 'document' || item.category === 'website';
      const aTokens = isDocOrWeb ? new Set(this.tokenize(item.answer || '')) : null;
      let keyMatches = 0;

      // Exact cleanSubject match bonus
      if (cleanSubject && cleanSubject.length >= 3) {
        if ((item.question || '').toLowerCase().includes(cleanSubject)) {
          keyMatches += 4.0;
        } else if ((item.keywords || []).some(k => k.toLowerCase().includes(cleanSubject))) {
          keyMatches += 3.5;
        } else if (item.answer && item.answer.toLowerCase().includes(cleanSubject)) {
          keyMatches += 2.5;
        }
      }

      // Check topical keyword matches
      let topicalMatched = false;
      if (topicalKeywords.length > 0) {
        for (const tk of topicalKeywords) {
          for (const qt of qTokens) {
            if (this.wordsMatch(tk, qt)) {
              keyMatches += (tk === qt ? 3.0 : 2.0);
              topicalMatched = true;
              break;
            }
          }
        }
      }

      for (const token of queryTokens) {
        if (!stopWords.has(token) && token.length >= 2) {
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

      // If the query has specific topical keywords, require that at least one topical keyword matched
      if (topicalKeywords.length > 0 && !topicalMatched && !((item.question || '').toLowerCase().includes(cleanSubject))) {
        continue;
      }

      let score = this.computeScore(queryTokens, item.question + ' ' + item.answer, item.keywords || []);
      if (keyMatches > 0) {
        score += keyMatches * 0.2;
      } else {
        // If NO domain keywords or question words matched at all, penalize
        score *= 0.1;
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

    if (best && highestScore >= 0.45) {
      return { item: best, score: highestScore };
    }
    return null;
  }
}

export default IntentEngine;
