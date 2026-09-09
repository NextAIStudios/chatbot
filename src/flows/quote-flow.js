/**
 * Interactive Insurance Quote Flow
 * Calculates instant policy quotes with dynamic tiers, deductible adjustments, and add-ons.
 */

export class QuoteFlow {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.state = {
      active: false,
      step: 0,
      productType: 'auto', // auto | health | home | life | travel
      tierId: null,
      selectedAddons: [],
      assetValue: 25000,
      driverAge: 32,
      calculatedQuote: null
    };
  }

  start(productType = 'auto') {
    this.reset();
    this.state.active = true;
    this.state.productType = productType in this.config.products ? productType : 'auto';
    this.state.step = 1;

    const product = this.config.products[this.state.productType];

    return {
      message: `Great! Let's calculate your instant **${product.name}** quote in 30 seconds. ⏱️\n\nFirst, select the coverage tier that matches your needs:`,
      cards: product.tiers.map(tier => ({
        id: tier.id,
        title: tier.name + (tier.popular ? ' ⭐ (Most Popular)' : ''),
        badge: tier.popular ? 'Recommended' : null,
        description: `Deductible: ${this.formatMoney(tier.deductible || 0)} | Coverage: ${tier.coverageLimit ? this.formatMoney(tier.coverageLimit) : tier.benefit ? this.formatMoney(tier.benefit) : 'Full Plan'}`,
        rateMultiplier: tier.rateMultiplier,
        actionPayload: `select_tier_${tier.id}`
      })),
      quickReplies: product.tiers.map(t => ({
        label: t.name,
        payload: `select_tier_${t.id}`
      }))
    };
  }

  handleInput(input) {
    if (!this.state.active) return null;

    const lower = (input || '').toLowerCase().trim();

    // Step 1: Tier Selection
    if (this.state.step === 1) {
      const product = this.config.products[this.state.productType];
      const matchedTier = product.tiers.find(t =>
        lower.includes(t.id) ||
        lower.includes(t.name.toLowerCase()) ||
        lower.includes(t.name.split(' ')[0].toLowerCase())
      ) || product.tiers[1] || product.tiers[0];

      this.state.tierId = matchedTier.id;
      this.state.step = 2;

      // Ask for optional add-ons or customization
      const addons = product.addons || [];
      return {
        message: `Excellent choice! You selected **${matchedTier.name}**.\n\nWould you like to include any recommended add-on riders for total peace of mind?`,
        addons: addons.map(a => ({
          id: a.id,
          name: a.name,
          cost: this.formatMoney(a.costPerYear) + '/yr',
          rawCost: a.costPerYear
        })),
        quickReplies: [
          { label: '✨ All Recommended Add-ons', payload: 'addon_all' },
          { label: '🛡️ Just Basic Plan (No Add-ons)', payload: 'addon_none' },
          ...addons.slice(0, 2).map(a => ({ label: `+ ${a.name.slice(0, 18)}...`, payload: `addon_${a.id}` }))
        ]
      };
    }

    // Step 2: Add-on Selection -> Final Quote
    if (this.state.step === 2) {
      const product = this.config.products[this.state.productType];
      if (lower.includes('all')) {
        this.state.selectedAddons = (product.addons || []).map(a => a.id);
      } else if (lower.includes('none') || lower.includes('basic') || lower.includes('no')) {
        this.state.selectedAddons = [];
      } else {
        const matchedAddon = (product.addons || []).find(a => lower.includes(a.id) || lower.includes(a.name.toLowerCase()));
        if (matchedAddon) {
          this.state.selectedAddons.push(matchedAddon.id);
        }
      }

      this.state.step = 3;
      const quote = this.calculateFinalQuote();
      this.state.calculatedQuote = quote;

      return {
        message: `🎉 **Your Instant Personalized Quote is Ready!**\n\nHere is your transparent breakdown for **${quote.productName}** with immediate coverage activation:`,
        quoteCard: quote,
        quickReplies: [
          { label: '💳 Proceed to Payment ($' + quote.annualTotal + ')', payload: 'checkout_now' },
          { label: '📅 Pay Monthly ($' + quote.monthlyTotal + '/mo)', payload: 'checkout_monthly' },
          { label: '🔄 Recalculate Quote', payload: 'recalculate_quote' }
        ]
      };
    }

    return null;
  }

  calculateFinalQuote() {
    const product = this.config.products[this.state.productType];
    const tier = product.tiers.find(t => t.id === this.state.tierId) || product.tiers[0];
    const base = product.baseAnnualRate * (tier.rateMultiplier || 1.0);

    let addonsTotal = 0;
    const activeAddons = (product.addons || []).filter(a => this.state.selectedAddons.includes(a.id));
    for (const addon of activeAddons) {
      addonsTotal += addon.costPerYear;
    }

    const subtotal = Math.round(base + addonsTotal);
    const tax = Math.round(subtotal * (this.config.payment.taxRate || 0.045));
    const annualTotal = subtotal + tax;
    const monthlyTotal = Math.round((annualTotal / 12) * 1.05); // 5% installment buffer

    return {
      quoteId: 'QT-' + Math.floor(100000 + Math.random() * 900000),
      productKey: this.state.productType,
      productName: product.name,
      tierName: tier.name,
      tierId: tier.id,
      deductible: tier.deductible !== undefined ? this.formatMoney(tier.deductible) : 'N/A',
      coverageLimit: tier.coverageLimit ? this.formatMoney(tier.coverageLimit) : tier.benefit ? this.formatMoney(tier.benefit) : 'Comprehensive Unlimited',
      addons: activeAddons.map(a => a.name),
      subtotal,
      tax,
      annualTotal,
      monthlyTotal,
      currency: this.config.currency.code,
      currencySymbol: this.config.currency.symbol,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  }

  formatMoney(amount) {
    const symbol = this.config.currency?.symbol || '$';
    return `${symbol}${Number(amount).toLocaleString()}`;
  }
}

export default QuoteFlow;
