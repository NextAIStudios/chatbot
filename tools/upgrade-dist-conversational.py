#!/usr/bin/env python3
"""Apply the conversational-tone upgrades to dist/insurance-chatbot.js.

Why this exists: dist/ is a build artifact excluded from workspace snapshots,
so hand edits to it vanish every turn and `git checkout -- dist` (run by
server.py's _ensure_dist_assets on boot) reverts them. This script reapplies
every upgrade idempotently from tracked source, and server.py runs it on every
boot right after restoring dist/.

Idempotency is PER PATCH (a patch whose new text is already present is
skipped), so new patch groups can be appended safely at any time.

Upgrades:
  V1:
    P1  Smart overview gate: overview chunks that mention the query's topic
        stay in the race; only generic ones are skipped.
    P2  Human lead-capture / fallback copy (the rendered "I don't know" path).
    P3  Conversational SaaS follow-up questions.
  V2 (knowledge-aware answers):
    P4  Contact-aware answers: product questions carrying a contact sub-intent
        ("who do I talk to?") get the business's real contact details from
        trained knowledge (or config fallback) appended to the answer.
    P5  Topic-aware follow-ups: specific product answers get follow-ups that
        reference the actual topic ("Want me to connect you with our team
        about **Smart City Solutions**?") instead of generic corporate text.
    P6  Short lead-need labels ("Follow-up regarding our services" instead of
        echoing the full question back).
    P7  Neutral default lead-capture follow-up (no insurance-specific "quote
        rates / coverage" text leaking into SaaS bots).

Usage: python3 tools/upgrade-dist-conversational.py [--check]
  --check: exit 0 if all patches applied, 1 if not (no writes).
"""

import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_JS = os.path.join(REPO_ROOT, "dist", "insurance-chatbot.js")

# (name, old_exact, new_exact, expected_count)
PATCHES = [
    (
        "P1 smart-overview-gate",
        """      // 2. Strict Content-Type Gating
      if (contentType === 'overview' && (isProductInquiry || (!isAboutCompany && topicalKeywords.length > 0))) {
        return;
      }""",
        """      // 2. Strict Content-Type Gating
      // Conversational upgrade: overview chunks that actually mention the query's
      // topic stay in the race — only generic ones are skipped. (Keeps product
      // questions like "I want an educational tool" answerable from knowledge.)
      if (contentType === 'overview' && (isProductInquiry || (!isAboutCompany && topicalKeywords.length > 0))) {
        var _ovTokens = tokenize((item.question || '') + ' ' + (item.keywords || []).join(' '));
        var _ovTopical = false;
        for (var _oi = 0; _oi < topicalKeywords.length && !_ovTopical; _oi++) {
          for (var _oj = 0; _oj < _ovTokens.length; _oj++) {
            if (wordsMatch(topicalKeywords[_oi], _ovTokens[_oj])) { _ovTopical = true; break; }
          }
        }
        if (!_ovTopical && cleanSearchSubject && cleanSearchSubject.length >= 3 &&
            (item.question || '').toLowerCase().indexOf(cleanSearchSubject) !== -1) {
          _ovTopical = true;
        }
        if (!_ovTopical) {
          return;
        }
      }""",
        1,
    ),
    (
        "P2a default askNamePrompt",
        '''askNamePrompt: "That's a fantastic inquiry{needTopic}! While I don't have all the exact specifications for that right here in my instant guide, I'd love to connect you with our specialist team so they can prepare a custom solution and assist you directly.\\n\\nMay I please have your **full name**?",''',
        '''askNamePrompt: "Good question! I want to make sure you get the right answer{needTopic}, so let me bring in a specialist from our team who can sort you out properly.\\n\\nWhat's your **full name**?",''',
        1,
    ),
    (
        "P2b lead_generation goal askNamePrompt",
        '''askNamePrompt: "That's a fantastic inquiry{needTopic}! While I don't have all those details right here in my instant memory, our team can help you with exactly what you need.\\n\\nMay I please have your **full name**?",''',
        '''askNamePrompt: "Good question! I want to make sure you get the right answer{needTopic}, so let me have our specialist put together exactly what you need.\\n\\nWhat's your **full name**?",''',
        1,
    ),
    (
        "P2c SaaS lead-capture opener",
        '''startMsg = "That's a great question" + needDisplay + "! While I don't have those specific details in my instant memory right now, I'd love to connect you with the **" + compName + "** team so someone can assist you directly.\\n\\nMay I please have your **full name**?";''',
        '''startMsg = "Good question" + needDisplay + "! I want to make sure you get the right answer, so let me connect you with the **" + compName + "** team who can sort you out properly.\\n\\nWhat's your **full name**?";''',
        1,
    ),
    (
        "P2d insurance lead-capture opener",
        '''startMsg = "That's a fantastic inquiry" + needDisplay + "! While I don't have all the exact specifications for that right here in my instant guide, I'd love to connect you with our specialist team so they can prepare a custom solution and assist you directly.\\n\\nMay I please have your **full name**?";''',
        '''startMsg = "Good question" + needDisplay + "! I want to make sure you get the right answer, so let me connect you with our specialist team who can sort you out properly.\\n\\nWhat's your **full name**?";''',
        1,
    ),
    (
        "P2e Tier-4 SaaS fallback",
        '''? "Great inquiry regarding **" + needTopic + "**! While I don't have those specific details in my instant memory right now, I'd love to connect you with the **" + compName + "** team so someone can assist you directly.\\n\\nCould you please share your **full name**?"''',
        '''? "Good question! I want to make sure you get the right answer about **" + needTopic + "**, so let me connect you with the **" + compName + "** team who can sort you out properly.\\n\\nWhat's your **full name**?"''',
        1,
    ),
    (
        "P2f Tier-4 insurance fallback",
        ''': "That's a fantastic inquiry regarding **" + needTopic + "**! While that isn't directly covered in my standard knowledge base right now, I want to make sure you get an accurate, personalized answer from our specialist team.\\n\\nCould you please share your **full name**?"''',
        ''': "Good question! I want to make sure you get the right answer about **" + needTopic + "**, so let me connect you with our specialist team who can sort you out properly.\\n\\nWhat's your **full name**?"''',
        1,
    ),
    (
        "P2g consultation leadIntro",
        '''"Awesome! Let's get your 1-on-1 consultation session scheduled. May I please have your **full name**?"''',
        '''"Awesome — let's get your 1-on-1 consultation scheduled! What's your **full name**?"''',
        2,
    ),
    (
        "P2h lead-gen leadIntro",
        '''"Wonderful! I'll have our specialist prepare a custom proposal and reach out directly. May I please have your **full name**?"''',
        '''"Wonderful! I'll have our specialist put together a custom proposal and reach out directly. What's your **full name**?"''',
        1,
    ),
    (
        "P2i support leadIntro",
        '''"I'd be glad to connect you with our support team! You can also reach us directly at **" + supportPhone + "** or email **" + supportEmail + "**.\\n\\nCould you please share your **full name** so an agent can call you right back?"''',
        '''"I'd be glad to connect you with our support team! You can also reach us directly at **" + supportPhone + "** or email **" + supportEmail + "**.\\n\\nWhat's your **full name**, so an agent can call you right back?"''',
        1,
    ),
    (
        "P3a followup which-service",
        """text: '💬 Which of these services aligns best with your current project, or would you like a tailored recommendation from our team?'""",
        """text: '💬 Which of these sounds most like what you\\'re looking for? Happy to dig into any of them with you.'""",
        1,
    ),
    (
        "P3b followup custom-proposal",
        """text: '💬 Would you like our specialist to prepare a custom scope breakdown and proposal for your team?'""",
        """text: '💬 Want me to have our specialist put together a custom proposal for your team?'""",
        1,
    ),
    (
        "P3c followup advisor-connect",
        """text: '💬 Shall I connect you directly with a specialist to review requirements and share personalized options?'""",
        """text: '💬 I can connect you with a specialist to talk through your requirements — shall I set that up?'""",
        1,
    ),
    (
        "P3d followup support-callback",
        """text: '💬 Did this answer address your inquiry, or would you prefer a quick callback from our support specialist?'""",
        """text: '💬 Did that answer your question, or would you like a quick callback from our support team?'""",
        1,
    ),
    (
        "P3e followup support-escalate",
        """text: '💬 Our team is available at **' + phoneNum + '**. Would you like an advisor to reach out directly?'""",
        """text: '💬 Our team is available at **' + phoneNum + '** — want an advisor to reach out to you directly?'""",
        1,
    ),
    (
        "P3f followup onboard",
        """text: '💬 Would you like our team to guide you through getting started with a personalized walkthrough?'""",
        """text: '💬 Want our team to walk you through getting started, step by step?'""",
        1,
    ),
    (
        "P3g followup default-progress",
        """text: '💬 Would you like our team to follow up with you directly, or can I help with anything else?'""",
        """text: '💬 Want our team to follow up with you directly, or can I help with anything else?'""",
        1,
    ),
    (
        "P3h followup default-progress-2",
        """text: '💬 Shall I have an advisor follow up with tailored recommendations for your inquiry?'""",
        """text: '💬 Shall I have an advisor follow up with some tailored recommendations?'""",
        1,
    ),
    (
        "P3i followup support-default",
        """text: '💬 Does this help address your inquiry, or would you like more details?'""",
        """text: '💬 Does that help, or would you like more details?'""",
        1,
    ),
    (
        "P3j followup custom-pricing",
        """text: '💬 Would you like our specialist to send you a customized pricing breakdown for your team?'""",
        """text: '💬 Want our specialist to send over a customized pricing breakdown for your team?'""",
        1,
    ),
    (
        "P3k followup discount",
        """text: '💬 Shall I have an advisor follow up with you directly to discuss discount options and volume tiers?'""",
        """text: '💬 Shall I have an advisor follow up about discount options and volume tiers?'""",
        1,
    ),
    (
        "P3l followup pricing-help",
        """text: '💬 Did this pricing information help, or would you like to speak directly with an advisor?'""",
        """text: '💬 Did that pricing info help, or would you like to speak directly with an advisor?'""",
        1,
    ),
    (
        "P4a contact-intent + short-topic precompute",
        """      var followUpObj = generateFollowUpQuestion(best, memory, config, isSaasMode);
      var followUpText = (typeof followUpObj === 'string') ? followUpObj : (followUpObj ? followUpObj.text : '');""",
        """      var followUpObj = generateFollowUpQuestion(best, memory, config, isSaasMode);
      var followUpText = (typeof followUpObj === 'string') ? followUpObj : (followUpObj ? followUpObj.text : '');
      // Conversational upgrade (V2): detect a contact sub-intent ("who do I talk
      // to?") and pre-compute the matched topic in short human form.
      var _wantsContact = /\\b(talk\\s+to|speak\\s+(to|with)|contact|callback|call|phone|email|reach|human|agent|someone|support)\\b/i.test(raw);
      var _contactItem = null;
      for (var _ci = 0; _ci < allFaqs.length; _ci++) {
        var _cand = allFaqs[_ci];
        if (!_cand) continue;
        if (_cand.category === 'contact' || /\\b(contact|phone|email|reach\\s+us|talk\\s+to|support)\\b/i.test(_cand.question || '')) {
          _contactItem = _cand;
          break;
        }
      }
      var _bestIsContact = best.category === 'contact' || /\\b(contact|phone|email)\\b/i.test(best.question || '');
      var _shortTopic = (best.question || '')
        .replace(/^(what\\s+about|what\\s+is|what\\s+are|who\\s+is|how\\s+do\\s+i|how\\s+can\\s+i|tell\\s+me\\s+about)\\s+/i, '')
        .replace(/^what\\s+services\\s+or\\s+solutions\\s+does\\s+.+?\\s+offer\\??\\s*$/i, 'our services')
        .replace(/\\?+\\s*$/, '').trim();
      if (_shortTopic.length > 60) _shortTopic = _shortTopic.substring(0, 57) + '...';
      if (!_shortTopic) _shortTopic = 'this';""",
        1,
    ),
    (
        "P5 topic-aware answer + followup",
        """            footerText + '\\n\\nYou can order directly below:';
        }
      }

      if (isSaasMode) {""",
        """            footerText + '\\n\\nYou can order directly below:';
        }
      }

      // Conversational upgrade (V2): contact-aware answers + topic-aware
      // follow-ups driven by the trained knowledge, not generic templates.
      if (_wantsContact && _contactItem && _contactItem !== best) {
        finalAnswerText += '\\n\\n' + (_contactItem.answer || '');
      } else if (_wantsContact && !_contactItem) {
        var _cfgPhone = (config && config.company && config.company.supportPhone) || '';
        var _cfgEmail = (config && config.company && config.company.supportEmail) || '';
        if (_cfgPhone || _cfgEmail) {
          var _reachBits = [];
          if (_cfgPhone) _reachBits.push('**' + _cfgPhone + '**');
          if (_cfgEmail) _reachBits.push('**' + _cfgEmail + '**');
          finalAnswerText += '\\n\\nYou can reach our team directly at ' + _reachBits.join(' or ') + '.';
        }
      }
      var _isGenericOverview = best && best.id && best.id.toLowerCase().indexOf('overview') !== -1;
      if (!_bestIsContact && _shortTopic && _shortTopic !== 'this') {
        if (_wantsContact) {
          followUpText = '💬 Want me to connect you with our team about **' + _shortTopic + '**?';
          followUpObj = { key: '_topic_followup', type: 'lead_generation', text: followUpText, topic: _shortTopic };
        } else if (isProductInquiry && !_isGenericOverview) {
          followUpText = '💬 Is **' + _shortTopic + '** what you\\'re looking for? I can share more details or connect you with our team.';
          followUpObj = { key: '_topic_followup', type: 'lead_generation', text: followUpText, topic: _shortTopic };
        }
      }

      if (isSaasMode) {""",
        1,
    ),
    (
        "P6 short lead-need label",
        """      var topicDesc = memory.lastFollowUp.topic || memory.lastTopic || 'your inquiry';""",
        """      var _rawTopicDesc = memory.lastFollowUp.topic || memory.lastTopic || 'your inquiry';
      var topicDesc = _rawTopicDesc
        .replace(/^(what\\s+about|what\\s+is|what\\s+are|who\\s+is|how\\s+do\\s+i|how\\s+can\\s+i|tell\\s+me\\s+about)\\s+/i, '')
        .replace(/^what\\s+services\\s+or\\s+solutions\\s+does\\s+.+?\\s+offer\\??\\s*$/i, 'our services')
        .replace(/\\?+\\s*$/, '').trim();
      if (!topicDesc) topicDesc = 'your inquiry';
      if (topicDesc.length > 70) topicDesc = topicDesc.substring(0, 67) + '...';""",
        1,
    ),
    (
        "P7 neutral default lead-capture followup",
        '''followUpQuestion: "💬 **In the meantime, how else can I assist you right now?** Would you like to check our instant quote rates or see an overview of our coverage?",''',
        '''followUpQuestion: "💬 **In the meantime, how else can I assist you right now?** Feel free to ask any other questions about our services.",''',
        1,
    ),
    (
        "P8 shared-root stem containment",
        """  function wordsMatch(w1, w2) {
    if (!w1 || !w2) return false;
    var v1 = w1.toLowerCase();
    var v2 = w2.toLowerCase();
    if (v1 === v2) return true;
    var s1 = getStem(v1);
    var s2 = getStem(v2);
    if (s1.length >= 2 && s2.length >= 2 && s1 === s2) return true;
    return false;
  }""",
        """  function wordsMatch(w1, w2) {
    if (!w1 || !w2) return false;
    var v1 = w1.toLowerCase();
    var v2 = w2.toLowerCase();
    if (v1 === v2) return true;
    var s1 = getStem(v1);
    var s2 = getStem(v2);
    if (s1.length >= 2 && s2.length >= 2 && s1 === s2) return true;
    // Conversational upgrade (V3): shared-root containment for long words, so
    // morphological cousins like agriculture/agricultural still match. The
    // length floor keeps short words (smart, custom, price) strict.
    if (s1.length >= 7 && s2.length >= 7 && (s1.indexOf(s2) !== -1 || s2.indexOf(s1) !== -1)) return true;
    return false;
  }""",
        1,
    ),
    (
        "P9a handover regex (speak with / talk to someone)",
        """    if (/human|agent|representative|speak\\s*to|advisor|person|talk\\s*to\\s*someone|call\\s*me/i.test(lower)) {""",
        """    if (/human|agent|representative|speak\\s*(to|with)\\s*(someone|person|a\\s*human|an?\\s*agent|human|agent)?|advisor|person|talk\\s*to\\s*(someone|person)|call\\s*me/i.test(lower)) {""",
        1,
    ),
    (
        "P9b handover starts lead capture",
        """      return {
        intent: 'human_handover',
        reply: handoverReply
      };""",
        """      return {
        intent: 'human_handover',
        action: 'LEAD_CAPTURE',
        inquiredNeed: 'Support callback request',
        leadIntro: isSaasMode
          ? "I'd be glad to connect you with our team! You can reach us directly at **" + supportPhone + "** or email **" + supportEmail + "**.\\n\\nTo have a specialist reach out, what's your **full name**?"
          : "I'd be glad to connect you with a licensed advisor! Call us directly at **" + supportPhone + "** or email **" + supportEmail + "**.\\n\\nTo have an advisor call you right back, what's your **full name**?",
        reply: handoverReply
      };""",
        1,
    ),
    (
        "P10 disableQuickReplies flag in appendBot",
        """  BotlyChatbotController.prototype.appendBot = function(text, opts) {
    opts = opts || {};""",
        """  BotlyChatbotController.prototype.appendBot = function(text, opts) {
    opts = opts || {};
    // Conversational upgrade (V4): pure free-text mode — no suggestion chips.
    if (this.config && this.config.disableQuickReplies) {
      opts.quickReplies = null;
    }""",
        1,
    ),
    (
        "P11a collectedContact init gains email",
        """    this.collectedContact = { name: '', phone: '' };""",
        """    this.collectedContact = { name: '', phone: '', email: '' };""",
        1,
    ),
    (
        "P11b collectedContact load gains email",
        """            this.collectedContact = {
              name: parsedContact.name || '',
              phone: parsedContact.phone || ''
            };""",
        """            this.collectedContact = {
              name: parsedContact.name || '',
              phone: parsedContact.phone || '',
              email: parsedContact.email || ''
            };""",
        1,
    ),
    (
        "P11c leadState inits gain email",
        """this.leadState = { active: false, step: 'idle', inquiredNeed: '', name: '', phone: '' };""",
        """this.leadState = { active: false, step: 'idle', inquiredNeed: '', name: '', phone: '', email: '' };""",
        2,
    ),
    (
        "P12a known-contact condition accepts email",
        """    if (this.collectedContact && this.collectedContact.name && this.collectedContact.phone) {""",
        """    if (this.collectedContact && this.collectedContact.name && (this.collectedContact.phone || this.collectedContact.email)) {""",
        1,
    ),
    (
        "P12b known-contact leadState gains email",
        """      this.leadState = {
        active: false,
        step: 'completed',
        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: this.collectedContact.phone
      };""",
        """      this.leadState = {
        active: false,
        step: 'completed',
        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: this.collectedContact.phone,
        email: this.collectedContact.email || ''
      };""",
        1,
    ),
    (
        "P12c known-contact lead record gains email",
        """        name: this.collectedContact.name,
        phone: this.collectedContact.phone,
        need: cleanNeed,""",
        """        name: this.collectedContact.name,
        phone: this.collectedContact.phone,
        email: this.collectedContact.email || '',
        need: cleanNeed,""",
        1,
    ),
    (
        "P12d known-contact message shows email fallback",
        """your contact details (**" + this.escape(this.collectedContact.phone) + "**) and will reach out shortly""",
        """your contact details (**" + this.escape(this.collectedContact.phone || this.collectedContact.email) + "**) and will reach out shortly""",
        1,
    ),
    (
        "P12e name-only condition accepts email",
        """    if (this.collectedContact && this.collectedContact.name && !this.collectedContact.phone) {""",
        """    if (this.collectedContact && this.collectedContact.name && !(this.collectedContact.phone || this.collectedContact.email)) {""",
        1,
    ),
    (
        "P12f name-only message offers email",
        """What is the best **phone number** (or direct contact) for our specialist team to reach you regarding **" + this.escape(cleanNeed) + "**?""",
        """What is the best **phone number** or **email address** for our specialist team to reach you regarding **" + this.escape(cleanNeed) + "**?""",
        1,
    ),
    (
        "P12g name-only leadState gains email",
        """        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: ''
      };""",
        """        inquiredNeed: cleanNeed,
        name: this.collectedContact.name,
        phone: '',
        email: ''
      };""",
        1,
    ),
    (
        "P12h fresh leadState gains email",
        """    this.leadState = {
      active: true,
      step: 'awaiting_name',
      inquiredNeed: cleanNeed,
      name: '',
      phone: ''
    };""",
        """    this.leadState = {
      active: true,
      step: 'awaiting_name',
      inquiredNeed: cleanNeed,
      name: '',
      phone: '',
      email: ''
    };""",
        1,
    ),
    (
        "P13a contact step accepts email",
        """    if (this.leadState.step === 'awaiting_phone') {
      var digitsOnly = input.replace(/\\D/g, '');
      if (digitsOnly.length < 6) {
        this.appendBot("Please provide a valid phone number (e.g. **+1 555-0199** or **0712 345 678**) so our advisor can reach you:");
        return;
      }
      this.leadState.phone = input;
      this.collectedContact.phone = input;""",
        """    if (this.leadState.step === 'awaiting_phone') {
      var digitsOnly = input.replace(/\\D/g, '');
      var looksLikeEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(input);
      if (!looksLikeEmail && digitsOnly.length < 6) {
        this.appendBot("Please share a valid **phone number** or **email address** (e.g. **+1 555-0199**, **0712 345 678** or **you@example.com**) so our advisor can reach you:");
        return;
      }
      if (looksLikeEmail) {
        this.leadState.email = input;
        this.leadState.phone = '';
        this.collectedContact.email = input;
      } else {
        this.leadState.phone = input;
        this.collectedContact.phone = input;
      }""",
        1,
    ),
    (
        "P13b completion lead record gains email",
        """        name: this.leadState.name,
        phone: this.leadState.phone,""",
        """        name: this.leadState.name,
        phone: this.leadState.phone,
        email: this.leadState.email || '',""",
        1,
    ),
    (
        "P13c confirmation uses email fallback",
        """          .replace(/\\{phone\\}/g, this.escape(this.leadState.phone));""",
        """          .replace(/\\{phone\\}/g, this.escape(this.leadState.phone || this.leadState.email));""",
        1,
    ),
    (
        "P13d fallback confirmation uses email fallback",
        """Someone from our team will reach out to **" + this.escape(this.leadState.phone) + "** shortly.""",
        """Someone from our team will reach out to **" + this.escape(this.leadState.phone || this.leadState.email) + "** shortly.""",
        1,
    ),
    (
        "P14a default askPhonePrompt offers email",
        '''askPhonePrompt: "Wonderful to meet you, **{name}**! 🤝\\n\\nWhat is the best **phone number** (or direct contact) for our specialist team to reach you?",''',
        '''askPhonePrompt: "Wonderful to meet you, **{name}**! 🤝\\n\\nWhat is the best **phone number** or **email address** for our specialist team to reach you?",''',
        1,
    ),
    (
        "P14b fallback phone prompt offers email",
        '''phonePrompt = "Nice to meet you, **" + this.escape(name) + "**! What's the best number to reach you?";''',
        '''phonePrompt = "Nice to meet you, **" + this.escape(name) + "**! What's the best number or email address to reach you?";''',
        1,
    ),
    (
        "P14c lead-gen goal phone prompt offers email",
        '''askPhonePrompt: "Thank you, **{name}**! What is your direct **phone number** (or WhatsApp) for our solutions specialist to reach you?",''',
        '''askPhonePrompt: "Thank you, **{name}**! What is your direct **phone number** (or WhatsApp) or **email address** for our solutions specialist to reach you?",''',
        1,
    ),
    (
        "P14d support goal phone prompt offers email",
        '''askPhonePrompt: "Thank you, **{name}**! What is the best **phone number** for our support agent to call you back?",''',
        '''askPhonePrompt: "Thank you, **{name}**! What is the best **phone number** or **email address** for our support agent to reach you?",''',
        1,
    ),
    (
        "P14e consultation goal phone prompt offers email",
        '''askPhonePrompt: "Thank you, **{name}**! What is your preferred **phone number** to confirm your consultation schedule?",''',
        '''askPhonePrompt: "Thank you, **{name}**! What is your preferred **phone number** or **email address** to confirm your consultation schedule?",''',
        1,
    ),
    (
        "P15a CSV empty header gains Email",
        """    if (!leads || leads.length === 0) return 'ID,Name,Phone,Need,Goal,Status,Payment Method,M-Pesa Code,Amount,Date\\n';""",
        """    if (!leads || leads.length === 0) return 'ID,Name,Phone,Email,Need,Goal,Status,Payment Method,M-Pesa Code,Amount,Date\\n';""",
        1,
    ),
    (
        "P15b CSV headers gain Email",
        """    var headers = ['ID', 'Name', 'Phone', 'Need', 'Goal', 'Status', 'Payment Method', 'M-Pesa Code', 'Amount', 'Date'];""",
        """    var headers = ['ID', 'Name', 'Phone', 'Email', 'Need', 'Goal', 'Status', 'Payment Method', 'M-Pesa Code', 'Amount', 'Date'];""",
        1,
    ),
    (
        "P15c CSV row gains Email",
        """        '"' + (l.phone || '').replace(/"/g, '""') + '"',""",
        """        '"' + (l.phone || '').replace(/"/g, '""') + '"',
        '"' + (l.email || '').replace(/"/g, '""') + '"',""",
        1,
    ),
]


def main() -> int:
    check_only = "--check" in sys.argv
    try:
        with open(DIST_JS, "r", encoding="utf-8") as fh:
            src = fh.read()
    except FileNotFoundError:
        print(f"upgrade-dist-conversational: {DIST_JS} missing, nothing to do")
        return 0

    applied, skipped, failures = [], [], []
    for name, old, new, expected in PATCHES:
        if new in src:
            skipped.append(name)
            continue
        found = src.count(old)
        if found != expected:
            failures.append(f"{name}: found {found}, expected {expected}")
            continue
        src = src.replace(old, new)
        applied.append(name)

    if failures:
        print("upgrade-dist-conversational: FAILED — dist bundle drifted, refusing to write:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    if check_only:
        if applied:
            print(f"upgrade-dist-conversational: {len(applied)} patch(es) not applied yet")
            return 1
        print("upgrade-dist-conversational: all patches applied")
        return 0

    if applied:
        with open(DIST_JS, "w", encoding="utf-8") as fh:
            fh.write(src)
    print(
        f"upgrade-dist-conversational: applied {len(applied)}, "
        f"skipped {len(skipped)} (already present)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
