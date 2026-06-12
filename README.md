# Visa Processing System (Medicodio)

An automated Visa Application Processing and Review System featuring high-fidelity UX/UI, automated document parsing, LLM-powered verification pipelines, and AI outbound calling capabilities.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, TanStack Router
- **Backend**: Node.js, Express
- **Database**: Supabase
- **Integrations**: Gemini API (document parsing/verification), OpenAI, Twilio (telephony), ElevenLabs (AI voice agent calls)

## Prerequisites
- Node.js (v18 or higher recommended)
- Supabase project set up

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` are provided for core features to work.*

3. **Initialize Database Schema**:
   Run the schema defined in `supabase_schema.sql` inside the Supabase SQL editor.

4. **Run the Development Server**:
   Start both the frontend and backend server concurrently:
   ```bash
   npm run dev
   ```
    - Frontend runs on: `http://localhost:8080`
    - Backend API runs on: `http://localhost:4000`

## Features & Intelligent Automation

### 1. Dual-Pipeline Client-Side OCR (QuickSnip)
- Implements canvas rotation sweeps (0°, 90°, 180°, 270°) to resolve sideways uploads.
- Grayscale contrast correction and nearest-neighbor canvas upscaling for low-res scans.

### 2. Multi-Agent Verification & Auto-Scoring
- **Validator Agent**: Parses OCR files for category cues and matches identity signatures.
- **Consistency Agent**: Cross-checks dates of birth, passport IDs, and SEVIS numbers across different uploads.
- **Decider Agent**: Forms consensus recommendation (`approve`, `deny`, `needs_info`).
- **Auto-Pipeline triggers**: Automatically triggers the verification pipeline for happy-path test cases once primary documents are uploaded.
- **Score Formulation**: Averaging completion rate, validator score, and consistency verification checks:
  $$\text{Score} = \text{Math.round}\left(\frac{\text{DocsReceived} + \text{IdentityScore} + \text{ConsistencyScore}}{3}\right)$$
