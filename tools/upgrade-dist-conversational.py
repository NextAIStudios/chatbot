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
  V3 (conversation continuity — bot stays on topic until the user changes it):
    P61 Bare ack words ("ok"/"okay") leave the affirmative set.
    P62 Bare-ack continuer (never accepts offers / captures leads) +
        stale-offer expiry (>~2 turns old).
    P63-P66 Every pending offer carries its birth turn (follow-ups + pricing).
    P67 Bare "yes" with no pending offer stays on the live product topic.
    P68 Product replies clear stale offers + record live topic/product query.
    P69 Product results report their topic to conversation memory.
    P70 Topic-less Tier-4 fallback asks a clarifying question, never ambushes.
    P71 Short follow-ups ("how much is it?") resolve against the live topic;
        new content words classify fresh (topic change).
    P72 Catalog fallback ends with a clarifying continuer.
    P73 Greeting restarts the topic.
    P74 Widget stamps turn-less offers at sync time.
    P77 Filler words cover interrogatives/auxiliaries/pronouns (kills
        spurious KB matches like "how much" hitting a How-question).
    P78 Demo-catalog substring matching ignores <3-letter stubs ("it" no
        longer matches "with" inside product blurbs).
    P79 Human handover advertises only owner-configured contacts (no fake
        fallback number; Botly-self email is david@nextaistudios.com).
    P80 Support-acceptance lead-intro likewise drops fallback contacts.
    P81-P83 Widget init defaults + support follow-up carry no fallback contacts.
    (P2i/P9b retargeted onto the P79/P80-era text they were superseded by.)
    P84-P86 Post-chat rating card: thumbs up/down after the 3rd bot reply,
    thank-you + optional comment/name, lazy-Firebase submit to botly_ratings.
    Paid-only via the Studio publish gate; only approved ratings are public.

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
        '''"I'd be glad to connect you with our support team!" + _supLine + "\\n\\nWhat's your **full name**, so an agent can call you right back?"''',
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

      if (isSaasMode && !(config && config.disableFaqQuickReplies)) {""",
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

      if (isSaasMode && !(config && config.disableFaqQuickReplies)) {""",
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
          ? "I'd be glad to connect you with our team!" + _contactLine + "\\n\\nTo have a specialist reach out, what's your **full name**?"
          : "I'd be glad to connect you with a licensed advisor!" + _contactLine + "\\n\\nTo have an advisor call you right back, what's your **full name**?",
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
    (
        "P54 storage namespace machinery",
        """  var LEAD_STORAGE_KEY = 'botly_captured_leads';""",
        """  var LEAD_STORAGE_KEY = 'botly_captured_leads';
  // Multi-bot isolation: every bot gets its own lead/contact storage namespace
  // (config.botId, else company name). A visitor chatting with Company B never
  // inherits names/phones captured by Company A's bot on the same browser.
  var BOTLY_STORAGE_NS = 'default';
  function botlySanitizeNs(ns) {
    var s = String(ns || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return (s || 'default').slice(0, 40);
  }
  function botlySetStorageNs(ns) { BOTLY_STORAGE_NS = botlySanitizeNs(ns); }
  function botlyLeadKey() { return LEAD_STORAGE_KEY + '__' + BOTLY_STORAGE_NS; }
  function botlyContactKey() { return 'botly_user_contact__' + BOTLY_STORAGE_NS; }
  function botlyMemLeadsGet() {
    var m = window.__botly_memory_leads;
    if (m && !Array.isArray(m)) return m[BOTLY_STORAGE_NS] || [];
    return [];
  }
  function botlyMemLeadsSet(arr) {
    if (!window.__botly_memory_leads || Array.isArray(window.__botly_memory_leads)) window.__botly_memory_leads = {};
    window.__botly_memory_leads[BOTLY_STORAGE_NS] = arr;
  }""",
        1,
    ),
    (
        "P55 getStoredLeads namespaced",
        """  function getStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(LEAD_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch(e) {}
    return window.__botly_memory_leads || [];
  }""",
        """  function getStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(botlyLeadKey());
        if (raw) return JSON.parse(raw);
      }
    } catch(e) {}
    return botlyMemLeadsGet();
  }""",
        1,
    ),
    (
        "P56 saveStoredLead namespaced",
        """  function saveStoredLead(lead) {
    try {
      var current = getStoredLeads();
      var updated = [lead].concat(current);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(updated));
      }
      window.__botly_memory_leads = updated;
      return updated;
    } catch(e) {
      if (!window.__botly_memory_leads) window.__botly_memory_leads = [];
      window.__botly_memory_leads.unshift(lead);
      return window.__botly_memory_leads;
    }
  }""",
        """  function saveStoredLead(lead) {
    try {
      var current = getStoredLeads();
      var updated = [lead].concat(current);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(botlyLeadKey(), JSON.stringify(updated));
      }
      botlyMemLeadsSet(updated);
      return updated;
    } catch(e) {
      var _memLeads = botlyMemLeadsGet();
      _memLeads.unshift(lead);
      botlyMemLeadsSet(_memLeads);
      return _memLeads;
    }
  }""",
        1,
    ),
    (
        "P57 clearStoredLeads namespaced",
        """  function clearStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LEAD_STORAGE_KEY);
      }
      window.__botly_memory_leads = [];
      return true;
    } catch(e) { return false; }
  }""",
        """  function clearStoredLeads() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(botlyLeadKey());
      }
      botlyMemLeadsSet([]);
      return true;
    } catch(e) { return false; }
  }""",
        1,
    ),
    (
        "P58 stored-contact read namespaced",
        """        var storedContact = localStorage.getItem('botly_user_contact');""",
        """        var storedContact = localStorage.getItem(botlyContactKey());""",
        1,
    ),
    (
        "P59 stored-contact writes namespaced",
        """        try { localStorage.setItem('botly_user_contact', JSON.stringify(this.collectedContact)); } catch (e) {}""",
        """        try { localStorage.setItem(botlyContactKey(), JSON.stringify(this.collectedContact)); } catch (e) {}""",
        2,
    ),
    (
        "P60 constructor sets storage namespace",
        """  function BotlyChatbotController(userConfig) {
    this.config = Object.assign({}, DEFAULT_CONFIG, userConfig || {});""",
        """  function BotlyChatbotController(userConfig) {
    this.config = Object.assign({}, DEFAULT_CONFIG, userConfig || {});
    botlySetStorageNs((userConfig && (userConfig.botId || (userConfig.company && userConfig.company.name))) || 'default');""",
        1,
    ),
    # --- V3 (conversation continuity: acks continue the topic, offers expire,
    # --- short follow-ups resolve against the live topic) ---
    (
        "P61 ack-words leave affirmative set",
        """yup|sure|ok|okay|definitely""",
        """yup|sure|definitely""",
        1,
    ),
    (
        "P62 bare-ack continuer + stale-offer expiry",
        """    if (isAffirmative && memory.lastFollowUp && lower.length < 40) {""",
        """    // V3: pending offers expire — a "yes" more than ~2 turns later answers something else.
    if (memory.lastFollowUp && memory.lastFollowUp.turn && memory.lastFollowUp.turn < (memory.turns || 0) - 2) {
      memory.lastFollowUp = null;
    }

    // V3: bare acknowledgments ("okay", "got it", "sawa") continue the topic —
    // they NEVER accept a pending offer and NEVER trigger lead capture.
    var isBareAck = /^(ok|okay|k|kk|alright|got\\s*it|noted|cool|fine|understood|roger|sawa|poa|asante|shukrani|thx)\\b[\\s!.,]*(thanks|thank\\s*you|thx)?[\\s!.,]*$/i.test(lower);
    if (isBareAck && lower.length < 60) {
      var _ackTopic = (memory && (memory.lastTopic || (memory.lastFollowUp && memory.lastFollowUp.topic))) || '';
      _ackTopic = _ackTopic.replace(/^(what\\s+about|what\\s+is|what\\s+are|who\\s+is|how\\s+do\\s+i|how\\s+can\\s+i|tell\\s+me\\s+about)\\s+/i, '').replace(/\\?+\\s*$/, '').trim();
      if (_ackTopic.length > 60) _ackTopic = _ackTopic.substring(0, 57) + '...';
      var _ackComp = (config && config.company && config.company.name) ? config.company.name : '';
      var _ackTeam = (_ackComp && _ackComp !== 'Botly' && _ackComp !== 'Botly Pro') ? 'the ' + _ackComp + ' team' : 'the team';
      var _ackReplies = isSaasMode ? [
        { label: 'Our Services', payload: 'What services do you offer?' },
        { label: 'Pricing & Plans', payload: 'What are your pricing and plans?' },
        { label: 'Talk to someone', payload: 'I want to speak with someone from ' + _ackTeam }
      ] : [
        { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
        { label: '💳 Proceed to Payment', payload: 'intent_pay' },
        { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
      ];
      if (_ackTopic && isSaasMode) {
        _ackReplies.unshift({ label: 'More on ' + (_ackTopic.length > 22 ? _ackTopic.substring(0, 20) + '…' : _ackTopic), payload: 'Tell me more about ' + _ackTopic });
      }
      return {
        intent: 'acknowledge',
        reply: _ackTopic
          ? 'Got it! 👍 Anything else about **' + _ackTopic + '** — or is there something new I can help with?'
          : 'Got it! 👍 What else can I help you with?',
        suggestedQuickReplies: _ackReplies
      };
    }

    if (isAffirmative && memory.lastFollowUp && lower.length < 40) {""",
        1,
    ),
    (
        "P63 follow-up offers carry birth turn",
        """      mem.lastFollowUp = {
        type: chosen.type,
        topic: topicLabel,
        text: chosen.text,
        stage: stage
      };""",
        """      mem.lastFollowUp = {
        type: chosen.type,
        topic: topicLabel,
        text: chosen.text,
        stage: stage,
        turn: (mem.turns || 0)
      };""",
        1,
    ),
    (
        "P64 returned offer carries birth turn",
        """      return chosen;""",
        """      chosen.turn = (mem.lastFollowUp && mem.lastFollowUp.turn) || (mem.turns || 0);
      return chosen;""",
        1,
    ),
    (
        "P65 pricing offer (Botly) carries birth turn",
        """          memory.lastFollowUp = {
            type: 'lead_generation',
            topic: 'Botly Pro $10 Plan Deployment',
            text: priceFollowUp,
            stage: memory.goalStage || 0
          };""",
        """          memory.lastFollowUp = {
            type: 'lead_generation',
            topic: 'Botly Pro $10 Plan Deployment',
            text: priceFollowUp,
            stage: memory.goalStage || 0,
            turn: (memory.turns || 0)
          };""",
        1,
    ),
    (
        "P66 pricing offer (client) carries birth turn",
        """          memory.lastFollowUp = {
            type: 'lead_generation',
            topic: compName + ' Pricing & Custom Packages',
            text: compFollowUp,
            stage: memory.goalStage || 0
          };""",
        """          memory.lastFollowUp = {
            type: 'lead_generation',
            topic: compName + ' Pricing & Custom Packages',
            text: compFollowUp,
            stage: memory.goalStage || 0,
            turn: (memory.turns || 0)
          };""",
        1,
    ),
    (
        "P67 bare-yes without offer stays on product topic",
        """    if (isEcommerce) {
      var searchKey = extracted.searchTerms || extracted.cleanQuery;""",
        """    if (isEcommerce) {
      // V3: bare "yes" with no pending offer stays on the live product topic.
      if (isAffirmative && lower.length < 40 && !(memory && memory.lastFollowUp) && memory && memory.lastProductQuery) {
        return {
          intent: 'acknowledge',
          reply: 'Great — sticking with **' + memory.lastProductQuery + '**. Want prices, delivery details, or shall I look up something else?',
          suggestedQuickReplies: [
            { label: '🚚 Delivery info', payload: 'How does delivery work and what are the timelines?' },
            { label: 'Talk to team', payload: 'I want to speak with someone from the team' }
          ],
          topic: memory.lastProductQuery
        };
      }
      var searchKey = extracted.searchTerms || extracted.cleanQuery;""",
        1,
    ),
    (
        "P68 product replies clear stale offers, record live topic",
        """      var searchResult = searchProducts({ query: searchKey }, config);""",
        """      // V3: product replies carry no typed offer — clear stale ones, record live topic.
      if (memory) {
        memory.lastFollowUp = null;
        memory.lastTopic = searchKey;
        memory.lastProductQuery = searchKey;
      }
      var searchResult = searchProducts({ query: searchKey }, config);""",
        1,
    ),
    (
        "P69 product results report their topic",
        """        intent: searchResult.isOutOfScope ? 'out_of_scope' : 'product_search',
        confidence: 0.95,""",
        """        intent: searchResult.isOutOfScope ? 'out_of_scope' : 'product_search',
        confidence: 0.95,
        topic: searchKey,""",
        1,
    ),
    (
        "P70 topic-less fallback asks, never ambushes",
        """    // Tier 4: Unknown / Human Help Needed
    var leadCaptureEnabled = config && config.leadCapture ? config.leadCapture.enabled !== false : true;
    if (leadCaptureEnabled) {""",
        """    // Tier 4: Unknown / Human Help Needed
    var leadCaptureEnabled = config && config.leadCapture ? config.leadCapture.enabled !== false : true;
    // V3: no real topic (bare yes/ack/greeting residue) → clarifying question, never a lead ambush.
    var _tier4NoTopic = !needTopic || needTopic.length < 3 || /^(yes|yeah|yep|sure|ok|okay|hi|hello|hey|thanks|thank\\s*you|please|good|great)\\b/i.test(needTopic.trim());
    if (_tier4NoTopic) {
      var _t4Topic = (memory && memory.lastTopic) || '';
      var _t4Name = (compName && compName !== 'our') ? compName : '';
      return {
        intent: 'clarify',
        reply: _t4Topic
          ? 'Happy to help! 🙏 Are we still on **' + _t4Topic + '** — or could you tell me a bit more about what you need?'
          : 'Happy to help! 🙏 Could you tell me a bit more about what you\\'re looking for so I point you the right way?',
        suggestedQuickReplies: isSaasMode ? [
          { label: 'Our Services', payload: 'What services do you offer?' },
          { label: 'Talk to someone', payload: 'I want to speak with someone from ' + (_t4Name ? 'the ' + _t4Name + ' team' : 'the team') }
        ] : [
          { label: '🚗 Calculate a Quote', payload: 'intent_quote' },
          { label: '📞 Speak with Advisor', payload: 'intent_agent_handover' }
        ]
      };
    }
    if (leadCaptureEnabled) {""",
        1,
    ),
    (
        "P71 short follow-ups resolve against live topic",
        """    // 5. Knowledge Base Search (In SaaS mode, ONLY search custom FAQs and custom knowledge)
    var allFaqsRaw = isSaasMode""",
        """    // V3: short follow-ups ("how much is it?", "and delivery?") resolve against the live
    // topic. Anything carrying a NEW content word is a topic change and classifies fresh.
    if (memory && memory.lastProductQuery && lower.length < 60) {
      var _refWords = { how:1, what:1, when:1, where:1, which:1, that:1, this:1, those:1, them:1, they:1, with:1, about:1, does:1, have:1, much:1, many:1, cost:1, costs:1, price:1, prices:1, pricing:1, delivery:1, deliver:1, shipping:1, ship:1, payment:1, pay:1, order:1, buy:1, get:1, more:1, also:1, and:1, the:1, for:1, are:1, you:1, your:1, there:1, their:1, any:1, some:1, one:1, ones:1, else:1, other:1 };
      var _msgWords = lower.replace(/[^a-z0-9\\s]/g, ' ').split(/\\s+/);
      var _newWords = [];
      for (var _wi = 0; _wi < _msgWords.length; _wi++) {
        var _w = _msgWords[_wi];
        if (_w.length > 2 && !_refWords[_w] && memory.lastProductQuery.toLowerCase().indexOf(_w) === -1) _newWords.push(_w);
      }
      var _looksReferential = _msgWords.length <= 6 || /^(how\\s+much|what\\s+about|how\\s+about|and\\b|also\\b|tell\\s+me\\s+more|more\\b|delivery\\b|shipping\\b|price\\b|cost\\b|it\\b|that\\b|them\\b|those\\b|this\\b)/i.test(lower);
      if (_looksReferential && _newWords.length === 0) {
        raw = (raw + ' ' + memory.lastProductQuery).trim();
        lower = raw.toLowerCase();
        queryTokens = tokenize(raw);
      }
    }

    // 5. Knowledge Base Search (In SaaS mode, ONLY search custom FAQs and custom knowledge)
    var allFaqsRaw = isSaasMode""",
        1,
    ),
    (
        "P72 catalog fallback keeps conversation going",
        """    var message = fallbackIntros[Math.floor(Math.random() * fallbackIntros.length)];
    if (dept) {
      message += ' Check out the **' + dept.department + '** section — ' + dept.details;
    }""",
        """    var message = fallbackIntros[Math.floor(Math.random() * fallbackIntros.length)];
    if (dept) {
      message += ' Check out the **' + dept.department + '** section — ' + dept.details;
    }
    message += '\\n\\n💬 Tell me a brand, size, or budget and I\\'ll narrow it down — or tap a department below to keep browsing.';""",
        1,
    ),
    (
        "P73 greeting restarts the topic",
        """      var greetName = (config.bot && config.bot.name) ? config.bot.name : 'Botly Pro';""",
        """      var greetName = (config.bot && config.bot.name) ? config.bot.name : 'Botly Pro';
      if (memory) { memory.lastFollowUp = null; memory.lastProductQuery = null; } // V3: greeting restarts the topic""",
        1,
    ),
    (
        "P74 widget stamps turn-less offers",
        """    if (res.lastFollowUp) {
      mem.lastFollowUp = res.lastFollowUp;""",
        """    if (res.lastFollowUp) {
      if (!res.lastFollowUp.turn) res.lastFollowUp.turn = mem.turns; // V3: every offer carries its birth turn
      mem.lastFollowUp = res.lastFollowUp;""",
        1,
    ),
    (
        "P77 filler words cover interrogatives/auxiliaries/pronouns",
        """      'shall':1, 'may':1, 'might':1, 'what':1, 'which':1, 'who':1, 'whom':1, 'this':1, 'that':1,""",
        """      'shall':1, 'may':1, 'might':1, 'what':1, 'which':1, 'who':1, 'whom':1, 'this':1, 'that':1,
      // V3: question-words can never be topical — "how" must not match every How-question.
      'how':1, 'when':1, 'where':1, 'why':1, 'much':1, 'many':1, 'it':1, 'its':1,
      'they':1, 'them':1, 'their':1, 'he':1, 'she':1, 'him':1, 'her':1,
      'very':1, 'really':1, 'quite':1,""",
        1,
    ),
    (
        "P78 demo-catalog matching ignores stub tokens",
        """    var tokens = lower.split(/[^a-z0-9]+/i).filter(function(t) { return t.length >= 2; });""",
        """    // V3: 2-letter stubs ("it", "is") substring-match everything ("with", "this") —
    // catalog matching needs real tokens; departments still catch short queries.
    var tokens = lower.split(/[^a-z0-9]+/i).filter(function(t) { return t.length >= 3; });""",
        1,
    ),
    (
        "P79 handover advertises configured contacts only",
        """    // 3. Human Representative Escalation
    if (/human|agent|representative|speak\\s*(to|with)\\s*(someone|person|a\\s*human|an?\\s*agent|human|agent)?|advisor|person|talk\\s*to\\s*(someone|person)|call\\s*me/i.test(lower)) {
      var supportPhone = (config.company && config.company.supportPhone) || '+1 (800) 555-0199';
      var supportEmail = (config.company && config.company.supportEmail) || (isBotlySelf ? 'care@botly.ai' : (config.company && config.company.websiteUrl ? 'contact@' + config.company.websiteUrl.replace(/^https?:\\/\\//i, '').replace(/\\/.*$/, '') : 'our support team'));
      var handoverReply = isSaasMode
        ? "I'd be glad to connect you with our team! You can reach us directly at **" + supportPhone + "** or email **" + supportEmail + "**.\\n\\nLeave your contact details below and someone will reach out shortly."
        : "I'd be glad to connect you with a licensed advisor! Call us directly at **" + supportPhone + "** or email **" + supportEmail + "**.\\n\\nLeave your phone or email below and we'll call you right back!";
      return {
        intent: 'human_handover',
        action: 'LEAD_CAPTURE',
        inquiredNeed: 'Support callback request',
        leadIntro: isSaasMode
          ? "I'd be glad to connect you with our team!" + _contactLine + "\\n\\nTo have a specialist reach out, what's your **full name**?"
          : "I'd be glad to connect you with a licensed advisor!" + _contactLine + "\\n\\nTo have an advisor call you right back, what's your **full name**?",
        reply: handoverReply
      };
    }""",
        """    // 3. Human Representative Escalation
    if (/human|agent|representative|speak\\s*(to|with)\\s*(someone|person|a\\s*human|an?\\s*agent|human|agent)?|advisor|person|talk\\s*to\\s*(someone|person)|call\\s*me/i.test(lower)) {
      // V3: only advertise contact details the owner configured — never a fallback number.
      var supportPhone = (config.company && config.company.supportPhone) || '';
      var supportEmail = (config.company && config.company.supportEmail) || (isBotlySelf ? 'david@nextaistudios.com' : (config.company && config.company.websiteUrl ? 'contact@' + config.company.websiteUrl.replace(/^https?:\\/\\//i, '').replace(/\\/.*$/, '') : ''));
      var _contactBits = [];
      if (supportPhone) _contactBits.push('at **' + supportPhone + '**');
      if (supportEmail) _contactBits.push('by email at **' + supportEmail + '**');
      var _contactLine = _contactBits.length ? ' You can reach us directly ' + _contactBits.join(' or ') + '.' : '';
      var handoverReply = isSaasMode
        ? "I'd be glad to connect you with our team!" + _contactLine + "\\n\\nLeave your contact details below and someone will reach out shortly."
        : "I'd be glad to connect you with a licensed advisor!" + _contactLine + "\\n\\nLeave your phone or email below and we'll call you right back!";
      return {
        intent: 'human_handover',
        action: 'LEAD_CAPTURE',
        inquiredNeed: 'Support callback request',
        leadIntro: isSaasMode
          ? "I'd be glad to connect you with our team!" + _contactLine + "\\n\\nTo have a specialist reach out, what's your **full name**?"
          : "I'd be glad to connect you with a licensed advisor!" + _contactLine + "\\n\\nTo have an advisor call you right back, what's your **full name**?",
        reply: handoverReply
      };
    }""",
        1,
    ),
    (
        "P80 support-acceptance advertises configured contacts only",
        """        var supportPhone = (config && config.company && config.company.supportPhone) || '+1 (800) 555-0199';
        var supportEmail = (config && config.company && config.company.supportEmail) || 'care@mycompany.com';
        return {
          intent: 'human_handover',
          action: 'LEAD_CAPTURE',
          inquiredNeed: 'Support Specialist Callback (' + topicDesc + ')',
          leadIntro: "I'd be glad to connect you with our support team!" + _supLine + "\\n\\nWhat's your **full name**, so an agent can call you right back?\"""",
        """        // V3: only advertise contact details the owner configured (never a fallback number).
        var _supPhone = (config && config.company && config.company.supportPhone) || '';
        var _supEmail = (config && config.company && config.company.supportEmail) || '';
        var _supBits = [];
        if (_supPhone) _supBits.push('at **' + _supPhone + '**');
        if (_supEmail) _supBits.push('email **' + _supEmail + '**');
        var _supLine = _supBits.length ? ' You can also reach us directly ' + _supBits.join(' or ') + '.' : '';
        return {
          intent: 'human_handover',
          action: 'LEAD_CAPTURE',
          inquiredNeed: 'Support Specialist Callback (' + topicDesc + ')',
          leadIntro: "I'd be glad to connect you with our support team!" + _supLine + "\\n\\nWhat's your **full name**, so an agent can call you right back?\"""",
        1,
    ),
    (
        "P81 widget ships no default contacts",
        """      supportEmail: 'care@botly.ai',
      supportPhone: '+1 (800) 555-0199',""",
        """      supportEmail: '',
      supportPhone: '',""",
        1,
    ),
    (
        "P82 support follow-up resolves configured email too",
        """      var phoneNum = (cfg.company && cfg.company.supportPhone) ? cfg.company.supportPhone : '+1 (800) 555-0199';""",
        """      var phoneNum = (cfg.company && cfg.company.supportPhone) ? cfg.company.supportPhone : '';
      var emailAddr = (cfg.company && cfg.company.supportEmail) ? cfg.company.supportEmail : '';""",
        1,
    ),
    (
        "P83 support follow-up omits missing contacts",
        """        candidateList.push({
          key: 'sup_phone_escalate',
          type: 'customer_support',
          text: '💬 Our team is available at **' + phoneNum + '** — want an advisor to reach out to you directly?'
        });""",
        """        if (phoneNum) {
          candidateList.push({
            key: 'sup_phone_escalate',
            type: 'customer_support',
            text: '💬 Our team is available at **' + phoneNum + '** — want an advisor to reach out to you directly?'
          });
        } else if (emailAddr) {
          candidateList.push({
            key: 'sup_email_escalate',
            type: 'customer_support',
            text: '💬 Our team is available at **' + emailAddr + '** — want an advisor to reach out to you directly?'
          });
        }""",
        1,
    ),
    (
        "P84 rating state in constructor",
        """    this.container = null;
    this.launcher = null;
  }""",
        """    this.container = null;
    this.launcher = null;
    this._ratingShown = false;
    this._botMsgCount = 0;
  }""",
        1,
    ),
    (
        "P85 rating hook after bot replies",
        """      this.messagesList.appendChild(qrBox);
    }

    this.scrollDown();
  };

  BotlyChatbotController.prototype.showTyping = function() {""",
        """      this.messagesList.appendChild(qrBox);
    }

    this._ratingAfterReply();
    this.scrollDown();
  };

  BotlyChatbotController.prototype.showTyping = function() {""",
        1,
    ),
    (
        "P86 post-chat rating card + Firestore submit",
        """  // Public Singleton Instance
  var instance = null;""",
        """  // ---- P84-P87: post-chat rating card ----
  // Paid-only by construction: Studio only issues embed snippets to activated
  // bots (publish gate in customizer.html), and only admin-APPROVED ratings
  // are publicly readable (see firestore.rules -> botly_ratings).
  BotlyChatbotController.prototype._ratingsEnabled = function() {
    var r = this.config && this.config.ratings;
    if (!r) return true;
    return r.enabled !== false;
  };

  BotlyChatbotController.prototype._ratingStoreKey = function() {
    var id = (this.config && (this.config.botId || (this.config.company && this.config.company.name))) || 'default';
    return 'botly_rated__' + String(id).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  };

  BotlyChatbotController.prototype._ratingAfterReply = function() {
    if (!this._ratingsEnabled() || this._ratingShown) return;
    this._botMsgCount = (this._botMsgCount || 0) + 1;
    try {
      if (typeof window !== 'undefined' && window.localStorage && localStorage.getItem(this._ratingStoreKey())) return;
    } catch (e) {}
    if (this._botMsgCount >= 3 && this.messagesList && !this.messagesList.querySelector('.ins-rating-card')) {
      this._ratingShown = true;
      try { this.renderRatingCard(); } catch (e) {}
    }
  };

  BotlyChatbotController.prototype.renderRatingCard = function() {
    var self = this;
    var card = document.createElement('div');
    card.className = 'ins-msg-row bot ins-rating-row';
    card.innerHTML = '<div class="ins-msg-bubble ins-rating-card">' +
      '<div class="ins-rating-q">How was your chat experience?</div>' +
      '<div class="ins-rating-btns">' +
      '<button type="button" class="ins-thumb-btn" data-vote="up" aria-label="Good chat">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>' +
      '<span>Good</span></button>' +
      '<button type="button" class="ins-thumb-btn down" data-vote="down" aria-label="Bad chat">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 3h-4v12h4V3zM1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22L1.14 11.27c-.09.23-.14.47-.14.73v2z"/></svg>' +
      '<span>Bad</span></button>' +
      '</div></div>';
    this.messagesList.appendChild(card);
    this.scrollDown();
    var btns = card.querySelectorAll('.ins-thumb-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        self._ratingVote(card, this.getAttribute('data-vote'));
      });
    }
  };

  BotlyChatbotController.prototype._ratingVote = function(card, vote) {
    var self = this;
    var bubble = card.querySelector('.ins-rating-card');
    if (!bubble) return;
    var prompt = (vote === 'down')
      ? 'Sorry to hear that — what went wrong? (optional)'
      : 'What went well? (optional)';
    bubble.innerHTML = '<div class="ins-rating-thanks">' +
      '<span class="ins-rating-badge"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg></span>' +
      '<div class="ins-rating-q">Thank you for the rating! You can also leave a comment:</div>' +
      '<textarea class="ins-rating-comment" rows="2" maxlength="600" placeholder="' + prompt + '"></textarea>' +
      '<input class="ins-rating-name" type="text" maxlength="80" placeholder="Your name (optional)">' +
      '<button type="button" class="ins-rating-send">Send feedback</button>' +
      '<div class="ins-rating-note">The best chats may be featured on our website.</div>' +
      '</div>';
    self.scrollDown();
    var send = bubble.querySelector('.ins-rating-send');
    send.addEventListener('click', function() {
      send.disabled = true;
      send.textContent = 'Sending...';
      var comment = bubble.querySelector('.ins-rating-comment').value || '';
      var name = bubble.querySelector('.ins-rating-name').value || '';
      self._submitRating(vote, comment, name, function(ok) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(self._ratingStoreKey(), ok ? 'sent' : 'skipped');
          }
        } catch (e) {}
        bubble.innerHTML = '<div class="ins-rating-done">' +
          (ok ? 'Thanks! Your feedback was sent.' : 'Thanks! (Offline — your rating was noted on this device.)') + '</div>';
        self.scrollDown();
        try {
          if (typeof window !== 'undefined' && window.CustomEvent) {
            window.dispatchEvent(new CustomEvent('botly:rating', { detail: { vote: vote, sent: !!ok } }));
          }
        } catch (e) {}
      });
    });
  };

  BotlyChatbotController.prototype._ratingFirebaseConfig = function(cb) {
    var self = this;
    var done = function(cfg) { try { cb(cfg); } catch (e) {} };
    try {
      var override = self.config && self.config.ratings && self.config.ratings.firebaseConfig;
      if (override && override.apiKey && override.projectId) { done(override); return; }
      var w = (typeof window !== 'undefined') ? window.BOTLY_FIREBASE_CONFIG : null;
      if (w && w.apiKey && String(w.apiKey).indexOf('YOUR_') === -1 && w.projectId) { done(w); return; }
    } catch (e) {}
    // Customer embeds carry no Firebase config: fetch Botly's public web config
    // (CORS-open *.js on botlypro.online). Security is enforced by Firestore rules.
    var url = (self.config && self.config.ratings && self.config.ratings.configUrl) ||
      'https://www.botlypro.online/demo/firebase-config.js';
    function grab(t, k) {
      var i = t.indexOf(k);
      if (i === -1) return '';
      var q1 = t.indexOf('"', i);
      if (q1 === -1) return '';
      var q2 = t.indexOf('"', q1 + 1);
      return q2 === -1 ? '' : t.slice(q1 + 1, q2);
    }
    if (typeof fetch === 'undefined') { done(null); return; }
    fetch(url, { mode: 'cors' }).then(function(r) { return r.text(); }).then(function(t) {
      var cfg = {
        apiKey: grab(t, 'apiKey'),
        authDomain: grab(t, 'authDomain'),
        projectId: grab(t, 'projectId'),
        storageBucket: grab(t, 'storageBucket'),
        messagingSenderId: grab(t, 'messagingSenderId'),
        appId: grab(t, 'appId')
      };
      done((cfg.apiKey && cfg.apiKey.indexOf('YOUR_') === -1 && cfg.projectId) ? cfg : null);
    }).catch(function() { done(null); });
  };

  BotlyChatbotController.prototype._ratingEnsureDb = function(cb) {
    var self = this;
    function ready() {
      try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          self._ratingFirebaseConfig(function(cfg) {
            if (!cfg) { cb(null); return; }
            try {
              if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
              cb(firebase.firestore());
            } catch (e) {
              try { cb(firebase.firestore()); } catch (e2) { cb(null); }
            }
          });
        } else { cb(null); }
      } catch (e) { cb(null); }
    }
    if (typeof firebase !== 'undefined' && firebase.firestore) { ready(); return; }
    function load(src, next) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = next;
      s.onerror = function() { cb(null); };
      document.head.appendChild(s);
    }
    var appSrc = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js';
    var fsSrc = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js';
    if (typeof firebase === 'undefined') {
      load(appSrc, function() { load(fsSrc, ready); });
    } else {
      load(fsSrc, ready);
    }
  };

  BotlyChatbotController.prototype._submitRating = function(vote, comment, name, done) {
    var self = this;
    var bot = (self.config && self.config.bot) || {};
    var company = (self.config && self.config.company) || {};
    self._ratingEnsureDb(function(db) {
      if (!db) { done(false); return; }
      var payload = {
        botId: String((self.config && self.config.botId) || 'bot_default').slice(0, 120),
        botName: String(bot.name || company.name || 'Chatbot').slice(0, 120),
        company: String(company.name || '').slice(0, 120),
        rating: vote,
        comment: String(comment || '').slice(0, 600),
        name: String(name || '').slice(0, 80),
        pageUrl: (typeof location !== 'undefined' ? String(location.href).slice(0, 300) : ''),
        approved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      try {
        db.collection('botly_ratings').add(payload).then(function() { done(true); }).catch(function() { done(false); });
      } catch (e) { done(false); }
    });
  };

  // Public Singleton Instance
  var instance = null;""",
        1,
    ),
    (
        "P87 honor followUpDynamics.enabled=false",
        """    function generateFollowUpQuestion(item, mem, cfg, saasMode) {
      cfg = cfg || config || {};""",
        """    function generateFollowUpQuestion(item, mem, cfg, saasMode) {
      cfg = cfg || config || {};
      if (cfg.followUpDynamics && cfg.followUpDynamics.enabled === false) return null;""",
        1,
    ),
    (
        "P88 honor disableFaqQuickReplies to skip per-answer chips",
        """      if (isSaasMode) {
        var activeGoals = config.goals || (config.goal ? [config.goal] : ['lead_generation']);""",
        """      if (isSaasMode && !(config && config.disableFaqQuickReplies)) {
        var activeGoals = config.goals || (config.goal ? [config.goal] : ['lead_generation']);""",
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
