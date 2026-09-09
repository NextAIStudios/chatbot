/**
 * Main Insurance Chatbot Widget Controller & Public SDK
 */

import { DEFAULT_CONFIG } from '../config/default-config.js';
import { IntentEngine } from '../nlp/intent-engine.js';
import { QuoteFlow } from '../flows/quote-flow.js';
import { ClaimsFlow } from '../flows/claims-flow.js';
import { PolicyLookupFlow } from '../flows/policy-lookup-flow.js';
import { CheckoutFlow } from '../payments/checkout-flow.js';
import { ReceiptGenerator } from '../payments/receipt-generator.js';
import { UIRenderer } from './ui-renderer.js';

export class InsuranceChatbotWidget {
  constructor(customConfig = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, customConfig);
    this.intentEngine = new IntentEngine(this.config);
    this.quoteFlow = new QuoteFlow(this.config);
    this.claimsFlow = new ClaimsFlow(this.config);
    this.policyLookupFlow = new PolicyLookupFlow(this.config);

    this.checkoutFlow = new CheckoutFlow(this.config, (receipt) => {
      this.handlePaymentSuccess(receipt);
    });

    this.ui = new UIRenderer(this.config, (action, payload) => {
      this.handleAction(action, payload);
    });

    this.isInitialized = false;
  }

  mergeConfig(base, custom) {
    const output = { ...base };
    for (const key of Object.keys(custom || {})) {
      if (custom[key] && typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
        output[key] = { ...base[key], ...custom[key] };
      } else {
        output[key] = custom[key];
      }
    }
    return output;
  }

  init(containerSelector = null) {
    if (this.isInitialized) return;
    this.ui.init(containerSelector);
    this.sendGreeting();
    this.isInitialized = true;
  }

  sendGreeting() {
    const greeting = this.config.bot?.greeting || 'Hello! How can I protect you today?';
    const quickReplies = this.config.bot?.initialQuickReplies || [];

    setTimeout(() => {
      this.ui.appendBotMessage(greeting, { quickReplies });
    }, 200);
  }

  handleAction(action, payload) {
    if (action === 'RESET_CHAT') {
      this.reset();
      return;
    }

    if (action === 'USER_MESSAGE') {
      this.processUserInput(payload);
      return;
    }

    if (action === 'QUICK_REPLY') {
      this.processQuickReply(payload);
    }
  }

  processQuickReply(payload) {
    if (payload.startsWith('intent_quote_')) {
      const type = payload.replace('intent_quote_', '');
      this.startQuote(type);
      return;
    }

    if (payload === 'intent_quote') {
      this.startQuote('auto');
      return;
    }

    if (payload === 'intent_claim') {
      this.startClaim();
      return;
    }

    if (payload === 'intent_pay' || payload === 'checkout_now') {
      this.startPayment();
      return;
    }

    if (payload === 'checkout_monthly') {
      this.startPayment(true);
      return;
    }

    if (payload === 'intent_coverage_overview') {
      this.processUserInput('What insurance products do you offer and what do they cover?');
      return;
    }

    if (payload === 'intent_agent_handover' || payload === 'request_callback') {
      this.processUserInput('I want to talk to a human agent');
      return;
    }

    if (payload.startsWith('select_tier_') || payload.startsWith('addon_')) {
      this.processUserInput(payload);
      return;
    }

    // Default: treat as message text
    this.processUserInput(payload);
  }

  processUserInput(text) {
    this.ui.appendUserMessage(text);
    this.ui.showTypingIndicator();

    setTimeout(() => {
      // 1. Check if Quote Flow is active
      if (this.quoteFlow.state.active) {
        const flowResult = this.quoteFlow.handleInput(text);
        if (flowResult) {
          if (flowResult.quoteCard) {
            this.checkoutFlow.setQuote(flowResult.quoteCard);
          }
          this.ui.appendBotMessage(flowResult.message, flowResult);
          return;
        }
      }

      // 2. Check if Claims Flow is active
      if (this.claimsFlow.state.active) {
        const flowResult = this.claimsFlow.handleInput(text);
        if (flowResult) {
          this.ui.appendBotMessage(flowResult.message, flowResult);
          return;
        }
      }

      // 3. Check if Policy Lookup Flow is active
      if (this.policyLookupFlow.active) {
        const flowResult = this.policyLookupFlow.handleInput(text);
        if (flowResult) {
          this.ui.appendBotMessage(flowResult.message, flowResult);
          return;
        }
      }

      // 4. Intent Classification
      const res = this.intentEngine.classify(text);

      if (res.action === 'OPEN_QUOTE_WIZARD') {
        this.startQuote(res.productType || 'auto');
        return;
      }

      if (res.action === 'OPEN_CLAIMS_WIZARD') {
        this.startClaim();
        return;
      }

      if (res.action === 'OPEN_PAYMENT_WIZARD') {
        this.startPayment();
        return;
      }

      if (res.action === 'OPEN_POLICY_LOOKUP') {
        const lookup = this.policyLookupFlow.startLookup();
        this.ui.appendBotMessage(lookup.message, { quickReplies: lookup.quickReplies });
        return;
      }

      // 5. Default Bot Reply
      this.ui.appendBotMessage(res.reply, {
        quickReplies: res.suggestedQuickReplies || this.config.bot?.initialQuickReplies
      });
    }, this.config.bot?.typingDelayMs || 400);
  }

  startQuote(productType = 'auto') {
    const quoteRes = this.quoteFlow.start(productType);
    this.ui.appendBotMessage(quoteRes.message, quoteRes);
  }

  startClaim() {
    const claimRes = this.claimsFlow.start();
    this.ui.appendBotMessage(claimRes.message, claimRes);
  }

  startPayment() {
    const quote = this.quoteFlow.state.calculatedQuote;
    const checkoutRes = this.checkoutFlow.start(quote);
    this.ui.appendBotMessage(checkoutRes.message, {
      rawHtml: checkoutRes.rawHtml,
      cardId: checkoutRes.cardId,
      cardInstance: checkoutRes.cardInstance
    });
  }

  handlePaymentSuccess(receipt) {
    const receiptHtml = ReceiptGenerator.renderReceiptHtml(receipt);
    this.ui.appendBotMessage(
      `🎉 **Payment Verified & Coverage Active!**\n\nCongratulations ${receipt.policyholder.name}, your policy is officially in effect immediately. Your official digital certificate has been issued below:`,
      {
        receiptHtml,
        quickReplies: [
          { label: '🚗 Get Another Quote', payload: 'intent_quote' },
          { label: '📑 How to file a claim?', payload: 'How do I file a claim?' },
          { label: '❓ Ask Coverage Questions', payload: 'intent_coverage_overview' }
        ]
      }
    );

    if (this.config.webhooks?.onPaymentSuccess) {
      try {
        if (typeof this.config.webhooks.onPaymentSuccess === 'function') {
          this.config.webhooks.onPaymentSuccess(receipt);
        }
      } catch (err) {
        console.warn('Webhook execution error:', err);
      }
    }
  }

  reset() {
    this.quoteFlow.reset();
    this.claimsFlow.reset();
    this.policyLookupFlow.active = false;
    this.ui.clearMessages();
    this.sendGreeting();
  }

  updateConfig(newConfig) {
    this.config = this.mergeConfig(this.config, newConfig);
    this.intentEngine.updateConfig(this.config);
    this.ui.applyThemeStyles();
  }

  open() {
    this.ui.toggleChat(true);
  }

  close() {
    this.ui.toggleChat(false);
  }

  toggle() {
    this.ui.toggleChat();
  }

  triggerAction(payload) {
    this.processQuickReply(payload);
  }
}

// Global Browser SDK Expose
if (typeof window !== 'undefined') {
  window.InsuranceChatbotWidget = InsuranceChatbotWidget;
  window.InsuranceChatbot = {
    instance: null,
    init: function(config = {}, selector = null) {
      if (!this.instance) {
        this.instance = new InsuranceChatbotWidget(config);
        this.instance.init(selector);
      }
      return this.instance;
    },
    open: function() { this.instance?.open(); },
    close: function() { this.instance?.close(); },
    toggle: function() { this.instance?.toggle(); },
    triggerAction: function(payload) { this.instance?.triggerAction(payload); },
    updateConfig: function(cfg) { this.instance?.updateConfig(cfg); },
    printCertificate: function(receipt) {
      const targetReceipt = receipt || window.__lastIssuedReceipt;
      if (targetReceipt) {
        ReceiptGenerator.printCertificate(targetReceipt);
      } else {
        window.print();
      }
    }
  };
}

export default InsuranceChatbotWidget;
