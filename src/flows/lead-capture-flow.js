/**
 * Lead & Custom Inquiry Capture Flow
 * Gracefully collects names, phone numbers, and custom needs when an inquiry
 * is outside the bot's standard knowledge base, and persists them for the business.
 */

export class LeadCaptureFlow {
  constructor(config = {}, onLeadCaptured = null) {
    this.config = config;
    this.onLeadCaptured = onLeadCaptured;
    this.state = {
      active: false,
      step: 'idle', // 'idle' | 'awaiting_name' | 'awaiting_phone' | 'completed'
      inquiredNeed: '',
      name: '',
      phone: ''
    };
  }

  /**
   * Start lead capture for an unlisted inquiry or custom request
   */
  start(inquiredNeed = '') {
    const cleanNeed = (inquiredNeed || '').trim();
    this.state = {
      active: true,
      step: 'awaiting_name',
      inquiredNeed: cleanNeed || 'Custom Service & Solution Inquiry',
      name: '',
      phone: ''
    };

    const needTopicDisplay = cleanNeed ? ` regarding "**${this.escapeHtml(cleanNeed)}**"` : '';
    let startMsg = '';

    if (this.config.leadCapture?.askNamePrompt) {
      startMsg = this.config.leadCapture.askNamePrompt
        .replace(/\{need\}/g, cleanNeed || 'your custom request')
        .replace(/\{needTopic\}/g, needTopicDisplay);
    } else {
      startMsg = `That's a fantastic inquiry${needTopicDisplay}! While I don't have all the exact specifications for that right here in my instant guide, I'd love to connect you with our specialist team so they can prepare a custom solution and exact quote for you.\n\nMay I please have your **full name**?`;
    }

    return {
      message: startMsg,
      quickReplies: [
        { label: 'Cancel & Main Menu', payload: 'intent_cancel_lead' }
      ]
    };
  }

  /**
   * Handle conversational input during active lead capture
   */
  handleInput(input) {
    const text = (input || '').trim();

    // Check cancellation
    if (/^(cancel|nevermind|stop|exit|main menu|back)\b/i.test(text) || text === 'intent_cancel_lead') {
      this.reset();
      return {
        message: `No problem at all! We can explore other options anytime.\n\nWhat would you like to check next? You can ask about our standard catalog, get an instant quote, or file a claim.`,
        quickReplies: [
          { label: '🚗 Auto Quote', payload: 'intent_quote_auto' },
          { label: '🏥 Health Plans', payload: 'intent_quote_health' },
          { label: '💳 Make a Payment', payload: 'intent_pay' },
          { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
        ]
      };
    }

    // Step 1: Collect Name
    if (this.state.step === 'awaiting_name') {
      // Basic cleanup of greeting prefixes e.g. "I am Sarah", "My name is David"
      let name = text.replace(/^(my name is|i am|i'm|call me|this is)\s+/i, '').trim();
      if (!name || name.length < 2) {
        return {
          message: `Could you please share your name so our specialist knows who they'll be assisting?`
        };
      }

      this.state.name = name;
      this.state.step = 'awaiting_phone';

      let phonePrompt = '';
      if (this.config.leadCapture?.askPhonePrompt) {
        phonePrompt = this.config.leadCapture.askPhonePrompt.replace(/\{name\}/g, this.escapeHtml(name));
      } else {
        phonePrompt = `Wonderful to meet you, **${this.escapeHtml(name)}**! 🤝\n\nWhat is the best **phone number** (or direct contact) for our specialist team to reach you?`;
      }

      return {
        message: phonePrompt
      };
    }

    // Step 2: Collect Phone Number
    if (this.state.step === 'awaiting_phone') {
      const phone = text;
      // Accept numbers, +, dashes, parens, spaces with at least 6 digits
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 6) {
        return {
          message: `Please provide a valid phone number (e.g. **+1 555-0199** or **0712 345 678**) so our advisor can reach you:`
        };
      }

      this.state.phone = phone;
      this.state.step = 'completed';
      this.state.active = false;

      // Create structured lead record
      const goalKey = this.config.goal || 'lead_generation';
      const leadRecord = {
        id: 'LEAD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        name: this.state.name,
        phone: this.state.phone,
        need: this.state.inquiredNeed,
        goal: goalKey,
        timestamp: new Date().toISOString(),
        createdAtFormatted: new Date().toLocaleString(),
        status: 'New',
        company: this.config.company?.name || 'Botly AI'
      };

      // Persist to storage
      LeadCaptureFlow.saveLeadToStorage(leadRecord);

      // Trigger callback & event
      if (this.onLeadCaptured) {
        try {
          this.onLeadCaptured(leadRecord);
        } catch (e) {
          console.warn('Error in onLeadCaptured callback:', e);
        }
      }

      // Check webhook
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        try {
          window.dispatchEvent(new CustomEvent('botly:leadCaptured', { detail: leadRecord }));
        } catch {}
      }

      let confirmationMsg = '';
      if (this.config.leadCapture?.confirmationMessage) {
        confirmationMsg = this.config.leadCapture.confirmationMessage
          .replace(/\{name\}/g, this.escapeHtml(this.state.name))
          .replace(/\{need\}/g, this.escapeHtml(this.state.inquiredNeed))
          .replace(/\{phone\}/g, this.escapeHtml(this.state.phone));
      } else {
        confirmationMsg = `🎉 **Thank you, ${this.escapeHtml(this.state.name)}!**\n\nYour request for **${this.escapeHtml(this.state.inquiredNeed)}** has been saved and routed directly to our specialist team. An advisor will reach out to you at **${this.escapeHtml(this.state.phone)}** shortly.`;
      }

      // Human follow-up question
      const followUp = this.config.leadCapture?.followUpQuestion ||
        `💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant quote rates or see an overview of our coverage?`;

      return {
        message: `${confirmationMsg}\n\n${followUp}`,
        leadCaptured: leadRecord,
        quickReplies: [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '💳 In-Chat Payment Checkout', payload: 'intent_pay' },
          { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
        ]
      };
    }

    return null;
  }

  reset() {
    this.state = {
      active: false,
      step: 'idle',
      inquiredNeed: '',
      name: '',
      phone: ''
    };
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Static Storage & Export Helpers ---

  static get STORAGE_KEY() {
    return 'botly_captured_leads';
  }

  static getLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(LeadCaptureFlow.STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error loading leads from storage:', e);
    }
    return LeadCaptureFlow._memoryLeads || [];
  }

  static saveLeadToStorage(lead) {
    try {
      const current = LeadCaptureFlow.getLeads();
      const updated = [lead, ...current];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LeadCaptureFlow.STORAGE_KEY, JSON.stringify(updated));
      }
      LeadCaptureFlow._memoryLeads = updated;
      return updated;
    } catch (e) {
      console.warn('Error saving lead to storage:', e);
      if (!LeadCaptureFlow._memoryLeads) LeadCaptureFlow._memoryLeads = [];
      LeadCaptureFlow._memoryLeads.unshift(lead);
      return LeadCaptureFlow._memoryLeads;
    }
  }

  static clearLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LeadCaptureFlow.STORAGE_KEY);
      }
      LeadCaptureFlow._memoryLeads = [];
      return true;
    } catch {
      return false;
    }
  }

  static exportCSV() {
    const leads = LeadCaptureFlow.getLeads();
    if (!leads || leads.length === 0) {
      return 'ID,Name,Phone,Need,Goal,Status,Date\n';
    }

    const headers = ['ID', 'Name', 'Phone', 'Need', 'Goal', 'Status', 'Date'];
    const rows = leads.map(l => [
      `"${(l.id || '').replace(/"/g, '""')}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.need || '').replace(/"/g, '""')}"`,
      `"${(l.goal || 'lead_generation').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.createdAtFormatted || l.timestamp || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

LeadCaptureFlow._memoryLeads = [];

export default LeadCaptureFlow;
