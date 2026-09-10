# Connecting Chatbot to a Backend API & Database

This guide explains how the chatbot communicates with a backend server that stores insurance data, policies, FAQs, and records.

---

## 🔄 How the End-to-End Flow Works

```
┌─────────────────┐       1. User types question       ┌────────────────────────┐
│  Website User   │ ─────────────────────────────────> │ Chatbot Widget         │
└─────────────────┘                                    └───────────┬────────────┘
                                                                   │ 2. HTTP POST JSON
                                                                   │    {"message": "..."}
                                                                   ▼
┌─────────────────┐    4. Returns Answer JSON          ┌────────────────────────┐
│ Chatbot Widget  │ <───────────────────────────────── │ Your Backend API       │
└────────┬────────┘    {"reply": "Extracted answer"}   │ (Node.js / Python / Go)│
         │                                             └───────────┬────────────┘
         │ 5. Renders typing animation                             │ 3. Queries DB,
         ▼    & displays message bubble                            │    RAG Vector Store,
┌─────────────────┐                                                ▼    or Microservice
│  Website User   │                                    ┌────────────────────────┐
└─────────────────┘                                    │ Database / Policy Store│
                                                       │ (Postgres, Pinecone...)│
                                                       └────────────────────────┘
```

---

## 1. What the Chatbot Sends to Your Backend

When a visitor asks a question, the chatbot automatically makes a standard HTTP request (default `POST`):

```http
POST /api/chat HTTP/1.1
Host: api.yourinsurance.com
Content-Type: application/json
Authorization: Bearer sk-your-token-here

{
  "message": "Which hospitals are in your network?",
  "sessionId": "session_982xla",
  "company": "AegisGuard Insurance"
}
```

---

## 2. What Your Backend Responds With

Your backend searches your database, vector store, or CMS and returns a simple JSON object:

```json
{
  "reply": "🏥 We are partnered with over 4,500 accredited hospitals nationwide, including Nairobi Hospital, Aga Khan, and MP Shah with 100% direct billing.",
  "quickReplies": [
    { "label": "🚗 Get Quote", "payload": "intent_quote_auto" },
    { "label": "📑 File Claim", "payload": "intent_claim" }
  ]
}
```

> **Note**: You can name the field whatever you like (e.g. `answer`, `response`, `data.output`, or `choices[0].message.content`). Just specify the path in the chatbot configuration: `responsePath: "answer"`.

---

## 3. How to Connect the Chatbot Widget

In your website's `<script>` tag:

```javascript
InsuranceChatbot.init({
  company: {
    name: "My Insurance Carrier"
  },
  // 🔌 Point to your backend API endpoint:
  api: {
    enabled: true,
    mode: "hybrid", // "hybrid" = queries API first, falls back to local KB if offline
    endpoint: "https://api.yourinsurance.com/v1/chat",
    method: "POST",
    authBearer: "sk-production-api-key",
    responsePath: "reply" // JSON field containing the answer
  }
});
```

---

## 4. Try the Included Reference Backend

Run either the Node.js or Python backend server included in this repository:

### Option A: Node.js (Zero Dependencies)
```bash
node examples/backend-api/server.js
```

### Option B: Python (Zero Dependencies)
```bash
python3 examples/backend-api/server.py
```

Then in the Customizer Studio (`http://localhost:8080/demo/customizer.html`):
1. Enable **Backend API Integration**.
2. Set Endpoint URL to: `http://localhost:5000/api/chat`
3. Click **⚡ Test API Connection** (verifies HTTP 200 OK).
4. Type any question in chat (e.g. *"Which hospitals are in your network?"* or *"Can I choose my own garage?"*) and see the answer extracted live from the backend!
