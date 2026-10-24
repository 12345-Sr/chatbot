# Deific Digital — AI Voice Receptionist (Backend API)

A standalone backend API for **Deific Digital** (IT Services, Web & App Development, AI Solutions & Digital Marketing). Designed for direct integration with company websites and mobile apps.

Features:
- **English Voice Only**: Uses natural English neural voice via ElevenLabs (with Azure & Edge TTS fallbacks). No language translation or conversion required.
- **AI Brain**: Powered by Groq's high-speed inference engine (`openai/gpt-oss-120b`).
- **Lead Capture & History**: Automatically collects customer inquiry details (name, contact, project scope) and saves conversations directly to PostgreSQL (Neon).
- **CORS Enabled**: Out of the box support for cross-origin requests from your company's website domain.

---

## API Endpoints

### 1. Conversation & Voice
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `GET` | `/` | Service health status & endpoint index | None |
| `POST` | `/web/start` | Initiates session & returns English greeting | `{"sessionId": "string"}` |
| `POST` | `/web/chat` | Sends message to AI & returns English reply | `{"sessionId": "string", "message": "string"}` |
| `POST` | `/web/tts` | Synthesizes English voice audio (MP3) | `{"text": "string"}` |
| `POST` | `/web/stt` | Transcribes microphone audio stream to text | Binary audio buffer (`audio/webm` or `audio/mp4`) |

### 2. CRM & Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads` | Returns captured customer leads from PostgreSQL |
| `GET` | `/api/conversations` | Lists recent conversation sessions |
| `GET` | `/api/messages?conversationId=ID` | Retrieves turn-by-turn message history |

---

## Website Integration Example

Call the backend from your website frontend (React, Next.js, WordPress, or vanilla JavaScript):

```javascript
const API_BASE = "http://localhost:8787"; // replace with your deployed backend URL
const sessionId = "session-" + Date.now();

// Start session
async function initChat() {
  const res = await fetch(`${API_BASE}/web/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  const data = await res.json();
  console.log("Greeting:", data.reply);
  speak(data.reply);
}

// Send user message
async function sendMessage(text) {
  const res = await fetch(`${API_BASE}/web/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message: text }),
  });
  const data = await res.json();
  console.log("AI reply:", data.reply);
  speak(data.reply);
}

// Play English voice
async function speak(text) {
  const res = await fetch(`${API_BASE}/web/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.play();
}
```

---

## Setup & Deployment

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file from `.env.example`:
   ```bash
   DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   GROQ_API_KEY=gsk_...
   ELEVENLABS_API_KEY=sk_...
   PORT=8787
   ```

3. **Database Migration**:
   ```bash
   npm run db:setup
   ```

4. **Start Backend**:
   ```bash
   npm start
   ```
