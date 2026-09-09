/**
 * Checkout Flow Coordinator
 * Manages in-chat payment checkout triggers, quotes, and state transitions.
 */

import { PaymentCard } from './payment-card.js';

export class CheckoutFlow {
  constructor(config, onPaymentFinished) {
    this.config = config;
    this.onPaymentFinished = onPaymentFinished;
    this.currentQuote = null;
  }

  setQuote(quote) {
    this.currentQuote = quote;
  }

  start(quote = null) {
    if (quote) this.currentQuote = quote;

    const paymentCard = new PaymentCard(this.config, this.currentQuote, (receipt) => {
      if (this.onPaymentFinished) {
        this.onPaymentFinished(receipt);
      }
    });

    const { html, cardId } = paymentCard.render();

    return {
      message: `💳 Please review your coverage details and complete your payment below to instantly activate your policy:`,
      rawHtml: html,
      cardId,
      cardInstance: paymentCard
    };
  }
}

export default CheckoutFlow;
