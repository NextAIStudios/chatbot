/**
 * Backend API Connector
 * Attaches the chatbot to custom backend REST APIs, webhooks, or RAG endpoints.
 */

export class BackendConnector {
  constructor(apiConfig = {}) {
    this.config = {
      enabled: false,
      mode: 'hybrid', // 'hybrid' | 'api_only' | 'local_only'
      endpoint: '',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      authBearer: '',
      payloadTemplate: '{"message": "{{message}}", "sessionId": "{{sessionId}}", "company": "{{companyName}}"}',
      responsePath: 'reply',
      timeoutMs: 8000,
      mockServer: false,
      ...apiConfig
    };
  }

  updateConfig(newConfig = {}) {
    this.config = { ...this.config, ...newConfig };
  }

  isEnabled() {
    return !!(this.config.enabled && (this.config.endpoint || this.config.mockServer));
  }

  getMode() {
    return this.config.mode || 'hybrid';
  }

  /**
   * Interpolate template string with context variables
   */
  renderPayload(templateStr, context = {}) {
    if (!templateStr) {
      return JSON.stringify({
        message: context.message || '',
        sessionId: context.sessionId || 'session_' + Date.now(),
        company: context.companyName || 'Insurance Company'
      });
    }

    const safeMessage = JSON.stringify(context.message || '').slice(1, -1);
    const safeSession = JSON.stringify(context.sessionId || 'session_default').slice(1, -1);
    const safeCompany = JSON.stringify(context.companyName || 'Insurance Company').slice(1, -1);
    const safeUser = JSON.stringify(context.userId || 'user_anon').slice(1, -1);

    let rendered = templateStr
      .replace(/\{\{message\}\}/g, safeMessage)
      .replace(/\{\{sessionId\}\}/g, safeSession)
      .replace(/\{\{companyName\}\}/g, safeCompany)
      .replace(/\{\{userId\}\}/g, safeUser);

    try {
      JSON.parse(rendered);
      return rendered;
    } catch (e) {
      return JSON.stringify({
        message: context.message,
        sessionId: context.sessionId,
        company: context.companyName
      });
    }
  }

  /**
   * Extract nested response value using dot notation (e.g. 'choices.0.message.content' or 'data.reply')
   */
  extractResponse(data, path) {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (!path || path === 'auto') {
      return data.reply || data.response || data.answer || data.message || data.output || data.text || JSON.stringify(data);
    }

    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
      if (current === null || current === undefined) return null;
      current = current[part];
    }

    if (typeof current === 'string') return current;
    if (typeof current === 'object' && current !== null) {
      return current.content || current.text || current.reply || current.message || JSON.stringify(current);
    }
    return current !== null && current !== undefined ? String(current) : null;
  }

  /**
   * Send query to backend API
   */
  async query(messageText, context = {}) {
    if (!this.isEnabled()) {
      return { success: false, error: 'API not enabled or endpoint missing' };
    }

    // Built-in simulated mock server for instant testing
    if (this.config.mockServer || this.config.endpoint === 'mock://insurance-ai') {
      return this.simulateMockResponse(messageText, context);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs || 8000);

    const headers = { 'Content-Type': 'application/json', ...(this.config.headers || {}) };
    if (this.config.authBearer) {
      headers['Authorization'] = this.config.authBearer.startsWith('Bearer ')
        ? this.config.authBearer
        : `Bearer ${this.config.authBearer}`;
    }

    const method = (this.config.method || 'POST').toUpperCase();
    let url = this.config.endpoint;
    let body = null;

    if (method === 'GET') {
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('query', messageText);
        urlObj.searchParams.set('sessionId', context.sessionId || '');
        url = urlObj.toString();
      } catch (err) {
        // If relative or invalid URL, append query string
        url += (url.includes('?') ? '&' : '?') + 'query=' + encodeURIComponent(messageText);
      }
    } else {
      body = this.renderPayload(this.config.payloadTemplate, { message: messageText, ...context });
    }

    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          success: false,
          status: response.status,
          latencyMs,
          error: `HTTP ${response.status}: ${errorText || response.statusText}`
        };
      }

      const json = await response.json();
      const extractedReply = this.extractResponse(json, this.config.responsePath);

      return {
        success: true,
        reply: extractedReply || 'Received empty reply from backend API.',
        latencyMs,
        raw: json,
        quickReplies: json.quickReplies || json.suggestions || null,
        action: json.action || null
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isAbort = err.name === 'AbortError';
      return {
        success: false,
        latencyMs,
        error: isAbort ? `Request timed out after ${this.config.timeoutMs}ms` : err.message
      };
    }
  }

  /**
   * Live ping test connection
   */
  async testConnection(context = {}) {
    if (this.config.mockServer || this.config.endpoint === 'mock://insurance-ai') {
      return {
        ok: true,
        latencyMs: 78,
        status: 200,
        sampleReply: `Mock Backend API connection verified! 🟢 System operational. Model: ${this.config.responsePath || 'BotlyUnderwrite-v2'}`,
        raw: { status: 'healthy', version: '2.4.0', model: 'mock-insurance-ai-v2', timestamp: new Date().toISOString() }
      };
    }

    if (!this.config.endpoint) {
      return { ok: false, error: 'Endpoint URL is empty. Please enter an API URL to test.' };
    }

    const res = await this.query('ping test', { ...context, isPingTest: true });
    if (res.success) {
      return {
        ok: true,
        latencyMs: res.latencyMs,
        status: 200,
        sampleReply: res.reply,
        raw: res.raw
      };
    } else {
      return {
        ok: false,
        latencyMs: res.latencyMs,
        error: res.error,
        helpTip: (res.error && res.error.includes('Failed to fetch'))
          ? 'Make sure your API server allows Cross-Origin Resource Sharing (CORS) with the header "Access-Control-Allow-Origin: *".'
          : 'Please check your endpoint URL, HTTP method, and authorization token.'
      };
    }
  }

  /**
   * Mock simulator for testing without an external server
   */
  simulateMockResponse(messageText, context = {}) {
    const latency = Math.floor(Math.random() * 80) + 45;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          reply: `[⚡ Backend API Response] "${messageText}" was received and answered by your backend underwriting API for ${context.companyName || 'Botly Insurance'}.`,
          latencyMs: latency,
          raw: {
            status: 'success',
            backend: 'BotlyUnderwrite-API-v1',
            query: messageText,
            timestamp: new Date().toISOString()
          }
        });
      }, latency);
    });
  }
}

export default BackendConnector;
