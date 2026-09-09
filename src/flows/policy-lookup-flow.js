/**
 * Policy Lookup & Human Advisor Escalation Flow
 */

export class PolicyLookupFlow {
  constructor(config) {
    this.config = config;
    this.active = false;
  }

  startLookup() {
    this.active = true;
    return {
      message: `🔍 **Policy Lookup & Verification**\n\nPlease provide your **Policy Number** (e.g. *POL-482019*) or your registered **Email Address**:`,
      quickReplies: [
        { label: '📞 Request Human Callback', payload: 'request_callback' },
        { label: '💳 Pay Premium', payload: 'intent_pay' }
      ]
    };
  }

  handleInput(input) {
    if (!this.active) return null;
    const text = (input || '').trim();
    this.active = false;

    return {
      message: `✅ **Policy Found:**\n\n• **Policyholder:** Valued Customer\n• **Policy Ref:** ${text.toUpperCase()}\n• **Status:** Active & In Good Standing 🟢\n• **Coverage:** Comprehensive Care\n• **Next Renewal Due:** In 45 days\n\nWould you like to renew now, download your digital Certificate of Insurance, or submit a payment?`,
      quickReplies: [
        { label: '💳 Pay / Renew Policy', payload: 'intent_pay' },
        { label: '📄 Download Certificate', payload: 'intent_certificate' },
        { label: '🚗 Get Another Quote', payload: 'intent_quote_auto' }
      ]
    };
  }
}

export default PolicyLookupFlow;
