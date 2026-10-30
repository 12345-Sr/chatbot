# Deific Digital — AI Voice Receptionist (Backend API)

A standalone backend API for **Deific Digital** (IT Services, Web & App Development, AI Solutions & Digital Marketing). Designed for direct integration with company websites and mobile apps.

Features:
- **English Voice Only**: Uses natural English neural voice via ElevenLabs (with Azure & Edge TTS fallbacks). No language translation or conversion required.
- **AI Brain**: Powered by Groq's high-speed inference engine (`openai/gpt-oss-120b`).
- **Lead Capture & History**: Automatically collects customer inquiry details (name, contact, project scope) and saves conversations directly to PostgreSQL (Neon).
- **CORS Enabled**: Out of the box support for cross-origin requests from your company's website domain.


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
