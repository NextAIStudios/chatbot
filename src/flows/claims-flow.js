/**
 * Conversational Claims Assistant
 * Guides policyholders through fast-track claim submission with incident logging.
 */

export class ClaimsFlow {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.state = {
      active: false,
      step: 0,
      incidentType: null,
      policyOrContact: '',
      incidentDate: 'Today',
      description: '',
      claimId: null
    };
  }

  start() {
    this.reset();
    this.state.active = true;
    this.state.step = 1;

    return {
      message: `I'm sorry to hear that you had an incident! Don't worry—you are protected, and I'll expedite your claim right now. 🛡️\n\nWhat type of claim are you filing today?`,
      quickReplies: [
        { label: '🚗 Auto Accident / Damage', payload: 'claim_auto' },
        { label: '🏥 Medical / Hospital Bill', payload: 'claim_health' },
        { label: '🏡 Property / Water Damage', payload: 'claim_property' },
        { label: '✈️ Travel Delay / Baggage', payload: 'claim_travel' },
        { label: '🔍 Check Status of Existing Claim', payload: 'claim_status' }
      ]
    };
  }

  handleInput(input) {
    if (!this.state.active) return null;
    const text = (input || '').trim();

    // Step 1: Claim Type
    if (this.state.step === 1) {
      if (/status|existing|check/i.test(text)) {
        this.reset();
        return {
          message: `To check your live claim status, please provide your **Claim Reference ID** (e.g. CLM-84920) or call our 24/7 hotline at **${this.config.company.supportPhone}**.`
        };
      }

      this.state.incidentType = text;
      this.state.step = 2;
      return {
        message: `Got it. Please provide your **Policy Number** or the **Email Address** registered with your insurance policy:`
      };
    }

    // Step 2: Policy / Contact Identifier
    if (this.state.step === 2) {
      this.state.policyOrContact = text;
      this.state.step = 3;
      return {
        message: `Thank you! Now please briefly describe what happened (e.g., *"Rear-ended at traffic lights on Main St"* or *"Emergency room visit for fever"*):`
      };
    }

    // Step 3: Description & Final Submission
    if (this.state.step === 3) {
      this.state.description = text;
      this.state.step = 4;
      this.state.active = false;

      const claimId = 'CLM-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      this.state.claimId = claimId;

      return {
        message: `✅ **Claim Successfully Logged & Fast-Tracked!**\n\nYour incident report has been registered under reference **${claimId}**.\n\n• **Assigned Adjuster:** Senior Claims Specialist Sarah Jenkins\n• **Review Target:** Within 2 hours\n• **Direct Emergency Line:** ${this.config.company.supportPhone}\n\nOur dispatch team will review your details and reach out to **${this.state.policyOrContact}** shortly. If immediate towing or medical pre-authorization is required, our phone lines are open 24/7.`,
        claimCard: {
          claimId,
          incidentType: this.state.incidentType,
          status: 'Under Immediate Review (Fast Track)',
          policyRef: this.state.policyOrContact,
          filedAt: new Date().toLocaleString()
        },
        quickReplies: [
          { label: '💳 Pay Premium Instead', payload: 'intent_pay' },
          { label: '🚗 Calculate New Quote', payload: 'intent_quote_auto' },
          { label: '❓ Ask Another Question', payload: 'intent_help' }
        ]
      };
    }

    return null;
  }
}

export default ClaimsFlow;
