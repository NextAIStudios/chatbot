/**
 * In-Chat Payment Card & Checkout UI Component
 * Provides an interactive, embedded checkout experience directly inside conversation bubbles.
 */

import { ReceiptGenerator } from './receipt-generator.js';

export class PaymentCard {
  constructor(config, quote, onComplete) {
    this.config = config;
    this.quote = quote || this.getFallbackQuote();
    this.onComplete = onComplete;
    this.appliedDiscount = 0;
    this.discountCode = '';
    this.currentMethod = 'card'; // 'card' | 'apple_pay' | 'mpesa'
  }

  getFallbackQuote() {
    return {
      quoteId: 'QT-DIRECT',
      productName: 'Comprehensive Shield Policy',
      tierName: 'Gold Advantage',
      deductible: '$500',
      coverageLimit: '$100,000',
      annualTotal: 720,
      tax: 32,
      subtotal: 688,
      currencySymbol: this.config.currency?.symbol || '$',
      currency: this.config.currency?.code || 'USD'
    };
  }

  calculateTotal() {
    const base = this.quote.annualTotal;
    const discountAmt = Math.round(base * this.appliedDiscount);
    return Math.max(1, base - discountAmt);
  }

  render() {
    const cardId = 'checkout-' + Math.random().toString(36).substring(2, 8);
    const sym = this.quote.currencySymbol || '$';
    const total = this.calculateTotal();

    const html = `
      <div class="inchat-checkout-card" id="${cardId}">
        <div class="checkout-header">
          <div class="checkout-title">
            <span class="lock-icon">🔒</span>
            <strong>Secure In-Chat Policy Checkout</strong>
          </div>
          <span class="pci-badge">PCI-DSS Level 1</span>
        </div>

        <div class="checkout-summary-bar">
          <div class="plan-info">
            <span class="plan-name">${this.quote.productName}</span>
            <span class="plan-sub">${this.quote.tierName} • Deductible: ${this.quote.deductible}</span>
          </div>
          <div class="plan-price" id="${cardId}-total-display">
            ${sym}${Number(total).toLocaleString()}
          </div>
        </div>

        <!-- Payment Method Tabs -->
        <div class="payment-tabs">
          <button type="button" class="tab-btn active" data-method="card">💳 Card</button>
          <button type="button" class="tab-btn" data-method="apple_pay">🍏 Apple / G-Pay</button>
          <button type="button" class="tab-btn" data-method="mpesa">📱 M-Pesa</button>
        </div>

        <!-- Card Form -->
        <div class="tab-content method-card" id="${cardId}-tab-card">
          <div class="form-group">
            <label>Cardholder Name</label>
            <input type="text" class="input-field field-name" placeholder="Sarah Jenkins" value="Sarah Jenkins" />
          </div>
          <div class="form-group">
            <label>Card Number</label>
            <div class="card-input-wrapper">
              <input type="text" class="input-field field-number" placeholder="4000 1234 5678 9010" maxlength="19" value="4000 1234 5678 9010" />
              <span class="card-icon">💳</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Expiry Date</label>
              <input type="text" class="input-field field-expiry" placeholder="MM/YY" maxlength="5" value="08/28" />
            </div>
            <div class="form-group half">
              <label>CVV / CVC</label>
              <input type="password" class="input-field field-cvv" placeholder="•••" maxlength="4" value="882" />
            </div>
          </div>
        </div>

        <!-- Apple / Google Pay Tab -->
        <div class="tab-content method-wallet hidden" id="${cardId}-tab-apple_pay">
          <div class="wallet-pay-box">
            <p>Pay instantly with your device's biometric wallet:</p>
            <button type="button" class="btn-wallet-express">
               Pay with Passkey / Face ID
            </button>
            <span class="wallet-sub">Instant zero-touch authorization</span>
          </div>
        </div>

        <!-- M-Pesa Mobile Money Tab -->
        <div class="tab-content method-mpesa hidden" id="${cardId}-tab-mpesa">
          <div class="form-group">
            <label>M-Pesa Mobile Number</label>
            <input type="tel" class="input-field field-phone" placeholder="0712 345 678" value="+254 712 345 678" />
            <small class="helper-text">You will receive an STK prompt on your phone to enter your M-Pesa PIN.</small>
          </div>
        </div>

        <!-- Promo Code Input -->
        <div class="promo-code-section">
          <div class="promo-input-row">
            <input type="text" class="input-promo" placeholder="Promo Code (e.g. SAVE15)" value="SAVE15" />
            <button type="button" class="btn-apply-promo">Apply</button>
          </div>
          <div class="promo-message" id="${cardId}-promo-msg">Code "SAVE15" applied! 15% discount saved.</div>
        </div>

        <!-- Submit Button -->
        <button type="button" class="btn-submit-payment" id="${cardId}-submit-btn">
          <span>🔒 Pay ${sym}${Number(total).toLocaleString()} & Issue Policy</span>
        </button>

        <!-- Processing Modal Overlay -->
        <div class="payment-processing-overlay hidden" id="${cardId}-processing">
          <div class="processing-spinner"></div>
          <div class="processing-step" id="${cardId}-proc-step">Connecting to Secure Gateway...</div>
          <div class="processing-sub">Please do not refresh or close this chat</div>
        </div>
      </div>
    `;

    // Setup initial discount if code is pre-filled
    this.appliedDiscount = 0.15;
    this.discountCode = 'SAVE15';

    return { html, cardId };
  }

  attachListeners(cardEl) {
    if (!cardEl) return;
    const cardId = cardEl.id;

    // Method Tabs
    const tabs = cardEl.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const method = tab.getAttribute('data-method');
        this.currentMethod = method;

        cardEl.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        const activeTab = cardEl.querySelector(`#${cardId}-tab-${method}`);
        if (activeTab) activeTab.classList.remove('hidden');
      });
    });

    // Promo Code Application
    const promoBtn = cardEl.querySelector('.btn-apply-promo');
    const promoInput = cardEl.querySelector('.input-promo');
    const promoMsg = cardEl.querySelector(`#${cardId}-promo-msg`);
    const totalDisplay = cardEl.querySelector(`#${cardId}-total-display`);
    const submitBtn = cardEl.querySelector(`#${cardId}-submit-btn`);

    const applyPromo = () => {
      const code = (promoInput.value || '').trim().toUpperCase();
      const validPromos = this.config.payment?.promoCodes || { 'SAVE15': 0.15, 'SAFE20': 0.20 };

      if (validPromos[code]) {
        this.appliedDiscount = validPromos[code];
        this.discountCode = code;
        const percent = Math.round(this.appliedDiscount * 100);
        promoMsg.textContent = `✅ Promo "${code}" applied! ${percent}% discount active.`;
        promoMsg.style.color = '#10b981';

        const updatedTotal = this.calculateTotal();
        const sym = this.quote.currencySymbol || '$';
        totalDisplay.textContent = `${sym}${Number(updatedTotal).toLocaleString()}`;
        submitBtn.querySelector('span').textContent = `🔒 Pay ${sym}${Number(updatedTotal).toLocaleString()} & Issue Policy`;
      } else {
        promoMsg.textContent = `❌ Invalid promo code. Try "SAVE15" or "SAFE20".`;
        promoMsg.style.color = '#ef4444';
      }
    };

    if (promoBtn) promoBtn.addEventListener('click', applyPromo);

    // Submission Handler
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.handlePaymentSubmit(cardEl));
    }

    const expressBtn = cardEl.querySelector('.btn-wallet-express');
    if (expressBtn) {
      expressBtn.addEventListener('click', () => this.handlePaymentSubmit(cardEl));
    }
  }

  handlePaymentSubmit(cardEl) {
    const cardId = cardEl.id;
    const overlay = cardEl.querySelector(`#${cardId}-processing`);
    const stepText = cardEl.querySelector(`#${cardId}-proc-step`);
    const nameInput = cardEl.querySelector('.field-name');
    const numberInput = cardEl.querySelector('.field-number');
    const phoneInput = cardEl.querySelector('.field-phone');

    if (overlay) overlay.classList.remove('hidden');

    // Simulate realistic 3-stage payment processing
    setTimeout(() => {
      if (stepText) stepText.textContent = 'Contacting Underwriting & Card Gateway...';
    }, 800);

    setTimeout(() => {
      if (stepText) stepText.textContent = 'Simulating 3D-Secure Biometric Verification...';
    }, 1800);

    setTimeout(() => {
      if (stepText) stepText.textContent = '✅ Payment Authorized! Generating Policy Certificate...';
    }, 2800);

    setTimeout(() => {
      if (overlay) overlay.classList.add('hidden');

      const paymentDetails = {
        totalAmount: this.calculateTotal(),
        paymentMethod: this.currentMethod,
        cardholderName: nameInput ? nameInput.value : 'Sarah Jenkins',
        cardNumber: numberInput ? numberInput.value : '4000 1234 5678 9010',
        phone: phoneInput ? phoneInput.value : '+1 555-0199',
        discountApplied: this.appliedDiscount,
        discountCode: this.discountCode
      };

      const receipt = ReceiptGenerator.generateReceiptData({
        quote: this.quote,
        paymentDetails,
        company: this.config.company
      });

      // Call completion callback
      if (this.onComplete) {
        this.onComplete(receipt);
      }
    }, 3600);
  }
}

export default PaymentCard;
