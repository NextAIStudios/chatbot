/**
 * Insurance Chatbot Backend API Server (Node.js Reference Implementation)
 * 
 * Stores custom insurance data in a backend database/store and provides
 * a REST API endpoint that the chatbot calls to extract answers in real time.
 * Zero external dependencies (uses native Node.js http module).
 * 
 * Run with: node examples/backend-api/server.js
 * Listens on: http://localhost:5000/api/chat
 */

import http from 'http';
import { URL } from 'url';

const PORT = process.env.PORT || 5000;

// 1. BACKEND DATA STORE (Database / Repository / CMS / Vector DB)
// In a real application, this could be PostgreSQL, MongoDB, Pinecone, or an internal microservice.
const BACKEND_DATABASE = [
  {
    id: 'kb_001',
    topic: 'hospital_network',
    keywords: ['hospital', 'clinic', 'doctor', 'network', 'provider', 'admitted'],
    answer: '🏥 **Backend Hospital Network:** We are partnered with over 4,500 accredited facilities nationwide. Tier-1 hospitals (Nairobi Hospital, Aga Khan, MP Shah) have 100% direct billing with zero out-of-pocket cash deposit required upon admission.'
  },
  {
    id: 'kb_002',
    topic: 'maternity_waiting',
    keywords: ['maternity', 'pregnancy', 'delivery', 'baby', 'waiting period', 'c-section'],
    answer: '👶 **Maternity Underwriting Policy:** Maternity benefit carries a 10-month waiting period from the date of inception. Limits: Normal delivery up to KSh 350,000, Caesarean Section up to KSh 500,000. Newborn is automatically covered for 30 days.'
  },
  {
    id: 'kb_003',
    topic: 'preferred_garage',
    keywords: ['mechanic', 'garage', 'repair', 'panel beater', 'fix car', 'body shop'],
    answer: '🚗 **Automotive Repair Guidelines:** You can select ANY certified garage nationwide! If you choose our Direct Network garages, you also receive a lifetime repair warranty and a free courtesy replacement vehicle for up to 10 days.'
  },
  {
    id: 'kb_004',
    topic: 'corporate_fleet',
    keywords: ['fleet', 'corporate', 'group', 'company vehicles', 'trucks', 'business insurance'],
    answer: '🏢 **Corporate Fleet Coverage:** Fleet policies starting from 3+ vehicles qualify for a 25% volume discount, free GPS telematics installation, and unified monthly invoicing with Dedicated Account Underwriter access.'
  },
  {
    id: 'kb_005',
    topic: 'travel_evacuation',
    keywords: ['travel', 'flight', 'international', 'abroad', 'evacuation', 'luggage', 'delay'],
    answer: '✈️ **GlobeTrek Emergency Assistance:** International medical evacuation is covered up to $1,000,000 with 24/7 multilingual SOS dispatch. Baggage delays exceeding 6 hours are reimbursed $300 immediately.'
  }
];

// 2. SEARCH & EXTRACTION ENGINE
function searchBackendData(query) {
  const qLower = (query || '').toLowerCase();
  const tokens = qLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);

  let bestMatch = null;
  let highestScore = 0;

  for (const item of BACKEND_DATABASE) {
    let score = 0;
    for (const token of tokens) {
      if (item.keywords.some(k => k.includes(token) || token.includes(k))) {
        score += 2;
      }
      if (item.answer.toLowerCase().includes(token)) {
        score += 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

// 3. HTTP SERVER & API ENDPOINT
const server = http.createServer((req, res) => {
  // Enable CORS so browser chatbot can query this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', databaseItems: BACKEND_DATABASE.length }));
    return;
  }

  // Main Chat Query Endpoint: POST /api/chat
  if (req.url.startsWith('/api/chat')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let queryText = '';
      let sessionId = 'session_anon';
      let company = 'Insurance Company';

      try {
        if (req.method === 'POST') {
          const parsed = JSON.parse(body || '{}');
          queryText = parsed.message || parsed.query || '';
          sessionId = parsed.sessionId || sessionId;
          company = parsed.company || company;
        } else if (req.method === 'GET') {
          const urlObj = new URL(req.url, `http://${req.headers.host}`);
          queryText = urlObj.searchParams.get('query') || '';
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }

      console.log(`[API Request] Query: "${queryText}" (Session: ${sessionId})`);

      // 1. Check for ping test
      if (queryText.toLowerCase().includes('ping')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          reply: `Backend API is online and ready! Connected to database with ${BACKEND_DATABASE.length} policy schemas.`,
          status: 'ready'
        }));
        return;
      }

      // 2. Extract answer from backend database
      const match = searchBackendData(queryText);

      let replyMessage;
      let quickReplies = null;

      if (match) {
        replyMessage = match.answer;
        quickReplies = [
          { label: '🚗 Get Instant Quote', payload: 'intent_quote_auto' },
          { label: '📑 File a Claim', payload: 'intent_claim' },
          { label: '📞 Speak with Underwriter', payload: 'intent_agent_handover' }
        ];
      } else {
        replyMessage = `I searched our underwriting database for "${queryText}". For specific custom policy schedules, please connect with a live underwriter or request an instant quote below.`;
        quickReplies = [
          { label: '🚗 Calculate Quote', payload: 'intent_quote' },
          { label: '📞 Call Advisor', payload: 'intent_agent_handover' }
        ];
      }

      // Send JSON response back to chatbot widget
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        reply: replyMessage,
        quickReplies: quickReplies,
        extractedFromId: match ? match.id : null,
        timestamp: new Date().toISOString()
      }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Insurance Backend API is running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint for chatbot: http://localhost:${PORT}/api/chat`);
  console.log(`💾 Database items loaded: ${BACKEND_DATABASE.length} policies`);
  console.log(`======================================================\n`);
});
