/**
 * Optional LLM Connector (Gemini, OpenAI, or Custom Webhook)
 * Enhances conversational depth when an API key is provided.
 */

export class LLMConnector {
  constructor(config = {}) {
    this.config = config;
  }

  isConfigured() {
    return Boolean(this.config.nlp?.apiKey || this.config.nlp?.endpointUrl);
  }

  async askLLM(userPrompt, conversationHistory = []) {
    if (!this.isConfigured()) return null;

    const provider = this.config.nlp?.llmProvider || 'gemini';
    const apiKey = this.config.nlp?.apiKey;
    const systemPrompt = `You are ${this.config.bot?.name || 'Botly AI'}, an expert licensed insurance advisor representing ${this.config.company?.name || 'Botly Insurance'}.
Company Tagline: ${this.config.company?.tagline || ''}
Support Phone: ${this.config.company?.supportPhone || ''}
Support Email: ${this.config.company?.supportEmail || ''}
Keep your tone warm, professional, reassuring, and concise. Explain insurance terms clearly. When asked to buy or get a quote, guide the user to proceed in the chat.`;

    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...conversationHistory.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: userPrompt }] }
        ];

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch (err) {
      console.warn('LLM Connector error:', err);
      return null;
    }

    return null;
  }
}

export default LLMConnector;
