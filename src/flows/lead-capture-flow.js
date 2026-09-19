/**
 * Lead & Custom Inquiry Capture Flow
 * Gracefully collects names, phone numbers, and custom needs when an inquiry
 * is outside the bot's standard knowledge base, and persists them for the business.
 */

export class LeadCaptureFlow {
  constructor(config = {}, onLeadCaptured = null) {
    this.config = config;
    this.onLeadCaptured = onLeadCaptured;
    this.collectedContact = { name: '', phone: '' };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('botly_user_contact');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            this.collectedContact = {
              name: parsed.name || '',
              phone: parsed.phone || ''
            };
          }
        }
      } catch (e) {}
    }
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
    const cleanNeed = (inquiredNeed || '').trim() || 'Custom Service & Solution Inquiry';

    // If both name and phone have already been collected, do not ask again!
    if (this.collectedContact.name && this.collectedContact.phone) {
      this.state = {
        active: false,
        step: 'completed',
        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: this.collectedContact.phone
      };

      const goalKey = this.config.goal || 'lead_generation';
      const leadRecord = {
        id: 'LEAD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
        name: this.collectedContact.name,
        phone: this.collectedContact.phone,
        need: cleanNeed,
        goal: goalKey,
        timestamp: new Date().toISOString(),
        createdAtFormatted: new Date().toLocaleString(),
        status: 'New',
        company: this.config.company?.name || 'Botly AI'
      };

      LeadCaptureFlow.saveLeadToStorage(leadRecord);

      if (this.onLeadCaptured) {
        try { this.onLeadCaptured(leadRecord); } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        try { window.dispatchEvent(new CustomEvent('botly:leadCaptured', { detail: leadRecord })); } catch {}
      }

      const isSaas = this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0) || (this.config.customFaqs && this.config.customFaqs.length > 0);
      const compName = this.config.company?.name || 'our';
      const followUp = this.config.leadCapture?.followUpQuestion ||
        (isSaas
          ? `💬 **In the meantime, how else can I assist you right now?** Feel free to ask any other questions about our services.`
          : `💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant rates or view an overview of our coverage?`);

      return {
        message: `🎉 **Thank you, ${this.escapeHtml(this.collectedContact.name)}!**\n\nI've logged your request regarding **${this.escapeHtml(cleanNeed)}**. Our specialist team already has your contact details (**${this.escapeHtml(this.collectedContact.phone)}**) and will follow up with you directly.\n\n${followUp}`,
        leadCaptured: leadRecord,
        quickReplies: isSaas ? [
          { label: 'Our Services', payload: 'What services do you offer?' },
          { label: 'Get started', payload: 'How do I get started?' },
          { label: 'Talk to someone', payload: `I want to speak with someone from the team` }
        ] : [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
        ]
      };
    }

    // If only name has been collected, skip asking for name and ask for phone directly
    if (this.collectedContact.name && !this.collectedContact.phone) {
      this.state = {
        active: true,
        step: 'awaiting_phone',
        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: ''
      };
      return {
        message: `Wonderful to connect with you again, **${this.escapeHtml(this.collectedContact.name)}**! 🤝\n\nWhat is the best **phone number** (or direct contact) for our specialist team to reach you regarding **${this.escapeHtml(cleanNeed)}**?`,
        quickReplies: [
          { label: 'Cancel & Main Menu', payload: 'intent_cancel_lead' }
        ]
      };
    }

    this.state = {
      active: true,
      step: 'awaiting_name',
      inquiredNeed: cleanNeed,
      name: '',
      phone: ''
    };

    const needTopicDisplay = cleanNeed ? ` regarding "**${this.escapeHtml(cleanNeed)}**"` : '';
    let startMsg = '';
    const compName = this.config.company?.name || 'our';
    const isSaas = this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0) || (this.config.customFaqs && this.config.customFaqs.length > 0);

    if (this.config.leadCapture?.askNamePrompt) {
      startMsg = this.config.leadCapture.askNamePrompt
        .replace(/\{need\}/g, cleanNeed || 'your custom request')
        .replace(/\{needTopic\}/g, needTopicDisplay)
        .replace(/\{companyName\}/g, compName);
    } else if (isSaas) {
      startMsg = `That's a great question${needTopicDisplay}! While I don't have those specific details in my instant memory right now, I'd love to connect you with the **${compName}** team so someone can assist you directly.\n\nMay I please have your **full name**?`;
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
      const compName = this.config.company?.name;
      const isSaas = this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0);
      if (isSaas) {
        return {
          message: `No problem at all! What else can I help you with today?`,
          quickReplies: [
            { label: 'Our Services', payload: 'What services do you offer?' },
            { label: 'Get started', payload: 'How do I get started?' },
            { label: 'Talk to someone', payload: `I want to speak with someone from ${compName ? 'the ' + compName + ' team' : 'the team'}` }
          ]
        };
      }
      return {
        message: `No problem at all! We can explore other options anytime.\n\nWhat would you like to check next? You can ask about our standard catalog, get an instant quote, or file a claim.`,
        quickReplies: [
          { label: '🚗 Auto Quote', payload: 'intent_quote_auto' },
          { label: '🏥 Health Plans', payload: 'intent_quote_health' },
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
      this.collectedContact.name = name;
      if (typeof window !== 'undefined' && window.localStorage) {
        try { localStorage.setItem('botly_user_contact', JSON.stringify(this.collectedContact)); } catch (e) {}
      }
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
      this.collectedContact.phone = phone;
      if (typeof window !== 'undefined' && window.localStorage) {
        try { localStorage.setItem('botly_user_contact', JSON.stringify(this.collectedContact)); } catch (e) {}
      }
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
      const isSaas = this.config.mode === 'saas' || (this.config.customKnowledge && this.config.customKnowledge.length > 0) || (this.config.customFaqs && this.config.customFaqs.length > 0);
      const followUp = this.config.leadCapture?.followUpQuestion ||
        (isSaas
          ? `💬 **In the meantime, how else can I assist you right now?** Feel free to ask any other questions about our services.`
          : `💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant quote rates or see an overview of our coverage?`);

      const postQuickReplies = isSaas ? [
        { label: 'Our Services', payload: 'What services do you offer?' },
        { label: 'Get started', payload: 'How do I get started?' },
        { label: 'Talk to someone', payload: `I want to speak with someone from ${this.config.company?.name ? 'the ' + this.config.company.name + ' team' : 'the team'}` }
      ] : [
        { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
        { label: '❓ Coverage Overview', payload: 'intent_coverage_overview' }
      ];

      return {
        message: `${confirmationMsg}\n\n${followUp}`,
        leadCaptured: leadRecord,
        quickReplies: postQuickReplies
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
      return 'ID,Name,Phone,Need,Goal,Status,Payment Method,M-Pesa Code,Amount,Date\n';
    }

    const headers = ['ID', 'Name', 'Phone', 'Need', 'Goal', 'Status', 'Payment Method', 'M-Pesa Code', 'Amount', 'Date'];
    const rows = leads.map(l => [
      `"${(l.id || '').replace(/"/g, '""')}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.need || '').replace(/"/g, '""')}"`,
      `"${(l.goal || 'lead_generation').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(l.mpesaCode || '').replace(/"/g, '""')}"`,
      `"${(l.amount || '').replace(/"/g, '""')}"`,
      `"${(l.createdAtFormatted || l.timestamp || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

LeadCaptureFlow._memoryLeads = [];

export default LeadCaptureFlow;
