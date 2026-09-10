#!/usr/bin/env python3
"""
Insurance Chatbot Backend API Server (Python Reference Implementation)

Stores insurance policy knowledge in a backend database/store and provides
a REST API endpoint for the chatbot widget to extract answers in real-time.
Zero dependencies (uses standard library http.server).

Run with: python3 examples/backend-api/server.py
Listens on: http://localhost:5000/api/chat
"""

import json
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = 5000

# 1. BACKEND DATA STORE (Database / RAG / Policy Store)
BACKEND_DATABASE = [
    {
        "id": "kb_001",
        "topic": "hospital_network",
        "keywords": ["hospital", "clinic", "doctor", "network", "provider", "admitted"],
        "answer": "🏥 **Backend Hospital Network:** We are partnered with over 4,500 accredited facilities nationwide. Tier-1 hospitals (Nairobi Hospital, Aga Khan, MP Shah) have 100% direct billing with zero cash deposit required upon admission."
    },
    {
        "id": "kb_002",
        "topic": "maternity_waiting",
        "keywords": ["maternity", "pregnancy", "delivery", "baby", "waiting period", "c-section"],
        "answer": "👶 **Maternity Underwriting Policy:** Maternity benefit carries a 10-month waiting period from inception. Normal delivery limit is KSh 350,000; Caesarean Section is up to KSh 500,000. Newborn is automatically covered for 30 days."
    },
    {
        "id": "kb_003",
        "topic": "preferred_garage",
        "keywords": ["mechanic", "garage", "repair", "panel beater", "fix car", "body shop"],
        "answer": "🚗 **Automotive Repair Guidelines:** You can select ANY certified garage nationwide! With our Direct Network garages, you also receive a lifetime warranty and a free courtesy replacement car for up to 10 days."
    },
    {
        "id": "kb_004",
        "topic": "corporate_fleet",
        "keywords": ["fleet", "corporate", "group", "company vehicles", "trucks", "business insurance"],
        "answer": "🏢 **Corporate Fleet Coverage:** Fleet policies starting from 3+ vehicles qualify for a 25% volume discount, free GPS tracking installation, and unified monthly invoicing."
    }
]

def search_backend(query_text):
    tokens = [w.lower() for w in re.findall(r'\b\w{3,}\b', query_text)]
    best_item = None
    highest_score = 0

    for item in BACKEND_DATABASE:
        score = 0
        for token in tokens:
            if any(token in kw or kw in token for kw in item["keywords"]):
                score += 2
            if token in item["answer"].lower():
                score += 1
        if score > highest_score:
            highest_score = score
            best_item = item

    return best_item

class ChatbotApiHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ('/', '/health'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "items": len(BACKEND_DATABASE)}).encode())
            return

        if parsed.path.startswith('/api/chat'):
            params = parse_qs(parsed.query)
            query = params.get('query', [''])[0]
            self.process_query(query)
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/chat'):
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body) if body else {}
                query = data.get('message') or data.get('query') or ''
            except Exception:
                query = ''
            self.process_query(query)
            return

        self.send_response(404)
        self.end_headers()

    def process_query(self, query):
        print(f"[API] Received query: '{query}'")

        if 'ping' in query.lower():
            response_payload = {
                "reply": f"Python Backend API is online! Serving {len(BACKEND_DATABASE)} insurance policy items.",
                "status": "ready"
            }
        else:
            match = search_backend(query)
            if match:
                response_payload = {
                    "reply": match["answer"],
                    "quickReplies": [
                        {"label": "🚗 Get Quote", "payload": "intent_quote_auto"},
                        {"label": "📑 File Claim", "payload": "intent_claim"}
                    ],
                    "extractedId": match["id"]
                }
            else:
                response_payload = {
                    "reply": f"We searched our insurance database for '{query}'. Please speak with a licensed underwriter for detailed schedules.",
                    "quickReplies": [
                        {"label": "📞 Call Advisor", "payload": "intent_agent_handover"}
                    ]
                }

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(response_payload).encode())

def run():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, ChatbotApiHandler)
    print("=" * 60)
    print(f"🚀 Python Backend API server running on http://localhost:{PORT}")
    print(f"📡 Chatbot Endpoint: http://localhost:{PORT}/api/chat")
    print(f"💾 {len(BACKEND_DATABASE)} policy records loaded in memory")
    print("=" * 60)
    httpd.serve_forever()

if __name__ == '__main__':
    run()
