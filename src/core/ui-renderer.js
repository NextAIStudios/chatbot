/**
 * Chatbot UI Renderer & DOM Controller
 * Handles message element creation, markdown parsing, animations, and sound effects.
 */

export class UIRenderer {
  constructor(config, onUserAction) {
    this.config = config;
    this.onUserAction = onUserAction;
    this.root = null;
    this.container = null;
    this.launcher = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.audioCtx = null;
  }

  init(containerSelector = null) {
    this.applyThemeStyles();

    if (containerSelector) {
      // Inline mode
      this.root = document.querySelector(containerSelector);
      if (this.root) {
        this.renderInlineLayout();
        return;
      }
    }

    // Default: Floating Widget Mode
    this.renderFloatingLayout();
  }

  applyThemeStyles() {
    const root = document.documentElement;
    const theme = this.config.theme || {};

    if (theme.primaryColor) root.style.setProperty('--ins-primary', theme.primaryColor);
    if (theme.primaryGradient) root.style.setProperty('--ins-primary-gradient', theme.primaryGradient);
    if (theme.primaryHover) root.style.setProperty('--ins-primary-hover', theme.primaryHover);
    if (theme.accentColor) root.style.setProperty('--ins-accent', theme.accentColor);
    if (theme.headerBg) root.style.setProperty('--ins-header-bg', theme.headerBg);
    if (theme.userBubbleBg) root.style.setProperty('--ins-user-bubble', theme.userBubbleBg);
    if (theme.fontFamily) root.style.setProperty('--ins-font', theme.fontFamily);
  }

  renderFloatingLayout() {
    const bot = this.config.bot || {};
    const company = this.config.company || {};

    // 1. Floating Launcher
    const launcher = document.createElement('button');
    launcher.className = 'ins-chatbot-launcher';
    launcher.id = 'ins-widget-launcher';
    launcher.setAttribute('aria-label', 'Open Insurance Assistant');
    launcher.innerHTML = `
      <div class="ins-launcher-teaser">💬 Need a quick quote or help?</div>
      <div class="ins-launcher-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <div class="ins-launcher-badge">1</div>
    `;

    // 2. Chat Window Container
    const container = document.createElement('div');
    container.className = 'ins-chatbot-container';
    container.id = 'ins-widget-window';
    container.innerHTML = `
      <!-- Header -->
      <div class="ins-header">
        <div class="ins-header-profile">
          <div class="ins-avatar-wrapper">
            ${this.renderLogoAvatar()}
            <span class="ins-status-dot"></span>
          </div>
          <div class="ins-profile-info">
            <span class="ins-bot-name">${this.escapeHtml(bot.name || 'Insurance Assistant')}</span>
            <span class="ins-bot-role">${this.escapeHtml(bot.title || company.name || 'Certified Advisor')}</span>
          </div>
        </div>
        <div class="ins-header-actions">
          <button class="ins-btn-icon btn-reset" title="Restart Chat">🔄</button>
          <button class="ins-btn-icon btn-close" title="Close Chat">✕</button>
        </div>
      </div>

      <!-- Messages Body -->
      <div class="ins-messages-body" id="ins-messages-list"></div>

      <!-- Input Footer -->
      <div class="ins-footer">
        <form class="ins-input-wrapper" id="ins-chat-form">
          <button type="button" class="ins-btn-mic" id="ins-mic-btn" title="Voice Input">🎙️</button>
          <input type="text" class="ins-input-text" id="ins-user-input" placeholder="Ask about coverage, quotes, claims..." autocomplete="off" />
          <button type="submit" class="ins-btn-send" id="ins-send-btn" title="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(container);

    this.launcher = launcher;
    this.container = container;
    this.messagesContainer = container.querySelector('#ins-messages-list');
    this.inputField = container.querySelector('#ins-user-input');

    this.bindEvents();
  }

  renderLogoAvatar() {
    const bot = this.config.bot || {};
    const theme = this.config.theme || {};
    const primary = theme.primaryColor || '#2563eb';
    const accent = theme.accentColor || '#10b981';

    if (bot.avatar && typeof bot.avatar === 'string' && (bot.avatar.startsWith('http') || bot.avatar.startsWith('/') || bot.avatar.startsWith('./'))) {
      return `<img src="${bot.avatar}" alt="${this.escapeHtml(bot.name || 'Bot')}" class="ins-avatar-img" />`;
    }

    return `
      <svg class="ins-avatar-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ins-avatar-bg-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${primary}"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="ins-shield-fill" x1="12" y1="9" x2="32" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#dbeafe"/>
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="14" fill="url(#ins-avatar-bg-grad)"/>
        <rect x="0.75" y="0.75" width="42.5" height="42.5" rx="13.25" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
        <path d="M22 8.5L11 13V20.5C11 28 15.7 34.8 22 36.8C28.3 34.8 33 28 33 20.5V13L22 8.5Z" fill="url(#ins-shield-fill)"/>
        <path d="M17 21.5L20.5 25L27 18" stroke="${primary}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="22" cy="13.5" r="1.5" fill="${accent}"/>
      </svg>
    `;
  }

  renderInlineLayout() {
    // Embedded inside an inline target container
    const bot = this.config.bot || {};
    const company = this.config.company || {};

    this.root.innerHTML = `
      <div class="ins-chatbot-container open" style="position: relative; bottom: auto; right: auto; width: 100%; height: 600px;">
        <div class="ins-header">
          <div class="ins-header-profile">
            <div class="ins-avatar-wrapper">
              ${this.renderLogoAvatar()}
              <span class="ins-status-dot"></span>
            </div>
            <div class="ins-profile-info">
              <span class="ins-bot-name">${this.escapeHtml(bot.name || 'Insurance Assistant')}</span>
              <span class="ins-bot-role">${this.escapeHtml(bot.title || company.name || 'Certified Advisor')}</span>
            </div>
          </div>
          <div class="ins-header-actions">
            <button class="ins-btn-icon btn-reset" title="Restart Chat">🔄</button>
          </div>
        </div>
        <div class="ins-messages-body" id="ins-messages-list"></div>
        <div class="ins-footer">
          <form class="ins-input-wrapper" id="ins-chat-form">
            <button type="button" class="ins-btn-mic" id="ins-mic-btn" title="Voice Input">🎙️</button>
            <input type="text" class="ins-input-text" id="ins-user-input" placeholder="Ask about coverage, quotes, claims..." autocomplete="off" />
            <button type="submit" class="ins-btn-send" id="ins-send-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;

    this.container = this.root.querySelector('.ins-chatbot-container');
    this.messagesContainer = this.root.querySelector('#ins-messages-list');
    this.inputField = this.root.querySelector('#ins-user-input');

    this.bindEvents();
  }

  bindEvents() {
    if (this.launcher) {
      this.launcher.addEventListener('click', () => this.toggleChat());
    }

    const closeBtn = this.container.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleChat(false));
    }

    const resetBtn = this.container.querySelector('.btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.onUserAction) this.onUserAction('RESET_CHAT');
      });
    }

    const form = this.container.querySelector('#ins-chat-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (this.inputField.value || '').trim();
        if (text) {
          this.inputField.value = '';
          if (this.onUserAction) this.onUserAction('USER_MESSAGE', text);
        }
      });
    }

    // Speech-to-text integration
    const micBtn = this.container.querySelector('#ins-mic-btn');
    if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      micBtn.addEventListener('click', () => {
        try {
          micBtn.classList.add('recording');
          recognition.start();
        } catch {
          recognition.stop();
          micBtn.classList.remove('recording');
        }
      });

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (this.inputField) this.inputField.value = transcript;
        micBtn.classList.remove('recording');
      };

      recognition.onerror = () => micBtn.classList.remove('recording');
      recognition.onend = () => micBtn.classList.remove('recording');
    }
  }

  toggleChat(forceOpen = null) {
    if (!this.container) return;
    const shouldOpen = forceOpen !== null ? forceOpen : !this.container.classList.contains('open');

    if (shouldOpen) {
      this.container.classList.add('open');
      if (this.launcher) {
        const badge = this.launcher.querySelector('.ins-launcher-badge');
        if (badge) badge.style.display = 'none';
      }
      setTimeout(() => this.inputField?.focus(), 300);
    } else {
      this.container.classList.remove('open');
    }
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/•\s/g, '•&nbsp;');
  }

  appendUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'ins-msg-row user';
    row.innerHTML = `
      <div class="ins-msg-bubble">
        ${this.escapeHtml(text)}
        <span class="ins-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `;
    this.messagesContainer.appendChild(row);
    this.scrollToBottom();
    this.playTone(600, 0.05);
  }

  appendBotMessage(text, options = {}) {
    this.removeTypingIndicator();

    const row = document.createElement('div');
    row.className = 'ins-msg-row bot';

    let extraHtml = '';

    // Quote Card
    if (options.quoteCard) {
      const q = options.quoteCard;
      extraHtml += `
        <div class="ins-quote-card">
          <div class="ins-quote-header">
            <span class="ins-quote-id">${q.quoteId}</span>
            <span class="ins-quote-badge">Pre-Approved</span>
          </div>
          <h4>${q.productName} (${q.tierName})</h4>
          <div class="ins-quote-price-box">
            <div class="ins-quote-price-annual">${q.currencySymbol}${Number(q.annualTotal).toLocaleString()}<span style="font-size:14px; font-weight:normal;">/yr</span></div>
            <div class="ins-quote-price-monthly">or ${q.currencySymbol}${q.monthlyTotal}/mo in flexible payments</div>
          </div>
          <div class="ins-quote-details">
            <div class="ins-detail-line"><span>Coverage Limit:</span> <strong>${q.coverageLimit}</strong></div>
            <div class="ins-detail-line"><span>Deductible (Excess):</span> <strong>${q.deductible}</strong></div>
            ${q.addons.length > 0 ? `<div class="ins-detail-line"><span>Riders Included:</span> <strong>${q.addons.join(', ')}</strong></div>` : ''}
          </div>
          <button class="ins-btn-primary" onclick="window.InsuranceChatbot.triggerAction('checkout_now')">
            💳 Buy Policy Now (${q.currencySymbol}${Number(q.annualTotal).toLocaleString()})
          </button>
        </div>
      `;
    }

    // In-Chat Payment Form
    if (options.rawHtml) {
      extraHtml += options.rawHtml;
    }

    // Receipt Card
    if (options.receiptHtml) {
      extraHtml += options.receiptHtml;
    }

    row.innerHTML = `
      <div class="ins-msg-bubble">
        ${this.formatMarkdown(text)}
        ${extraHtml}
        <span class="ins-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `;

    this.messagesContainer.appendChild(row);

    // If there's an active checkout card instance, attach listeners
    if (options.cardInstance && options.cardId) {
      const cardEl = row.querySelector(`#${options.cardId}`);
      if (cardEl) {
        options.cardInstance.attachListeners(cardEl);
      }
    }

    // Quick Replies
    if (options.quickReplies && options.quickReplies.length > 0) {
      const repliesContainer = document.createElement('div');
      repliesContainer.className = 'ins-quick-replies';

      options.quickReplies.forEach(qr => {
        const btn = document.createElement('button');
        btn.className = 'ins-chip-btn';
        btn.textContent = qr.label;
        btn.addEventListener('click', () => {
          if (this.onUserAction) {
            this.onUserAction('QUICK_REPLY', qr.payload || qr.label);
          }
        });
        repliesContainer.appendChild(btn);
      });

      this.messagesContainer.appendChild(repliesContainer);
    }

    this.scrollToBottom();
    this.playTone(440, 0.05);
  }

  showTypingIndicator() {
    this.removeTypingIndicator();
    const typing = document.createElement('div');
    typing.className = 'ins-msg-row bot ins-typing-indicator-row';
    typing.innerHTML = `
      <div class="ins-typing-bubble">
        <div class="ins-typing-dot"></div>
        <div class="ins-typing-dot"></div>
        <div class="ins-typing-dot"></div>
      </div>
    `;
    this.messagesContainer.appendChild(typing);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const existing = this.messagesContainer.querySelector('.ins-typing-indicator-row');
    if (existing) existing.remove();
  }

  clearMessages() {
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
    }
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  playTone(freq = 440, duration = 0.05) {
    if (!this.config.theme?.soundEffects) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio autoplay policy gracefully caught
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

export default UIRenderer;
