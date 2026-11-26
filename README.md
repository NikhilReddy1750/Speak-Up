# SpeakUp — AI-Powered Voice-Based Civic Complaint System

SpeakUp helps citizens report civic problems (potholes, garbage, broken streetlights, water leakage, drainage issues) naturally using their own voice and language (**English**, **Hindi**, and **Telugu**) instead of complex forms.

## Key Features

- **Voice-First Reporting**: Web Speech API live transcription + MediaRecorder audio capture + live audio waveform + Stop/Redo/Cancel controls + editable transcript.
- **Accessible Text Fallback**: Toggleable text input and language sample prompts for environments without a microphone or unsupported browsers.
- **AI Complaint Understanding & Clarification**: Extracts structured JSON (category, responsible department, location, title, concise description, urgency, missing fields). Asks one conversational clarification question at a time when details are missing or uncertain.
- **Location & Evidence**: Browser Geolocation API + manual locality/landmark entry + interactive map pin + explicit location confirmation + optional photo/video upload and voice notes.
- **Confirmation & Spoken Receipt**: Review summary with duplicate complaint detection, unique reference ID (`SPK-YYYY-XXXX`), and spoken confirmation in the selected language via `SpeechSynthesis` API.
- **Tracking & Honest Status Timeline**: Filterable My Complaints dashboard (`All`, `Open`, `Resolved`), vertical status timeline, reminder & share buttons, and a clearly labelled Demo Status Simulator.
- **Zero-Key Hackathon Demo Mode**: Works out of the box with deterministic local AI fallback and persistent `localStorage` seeded with 4 realistic sample complaints.

## Running Locally

```bash
npm install
npm run dev
```

This starts:
- Frontend (Vite + React + TypeScript + Tailwind CSS): `http://localhost:5173`
- Backend AI proxy server (Node): `http://localhost:3001`

## Optional External Credentials (`.env`)

Copy `.env.example` to `.env` if you want live cloud AI or Supabase persistence. **Never prefix secret API keys with `VITE_`.**

| Variable | Where Used | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Server (`server/index.mjs`) | Enables live Gemini structured JSON extraction on `/api/analyze-complaint` |
| `OPENAI_API_KEY` | Server (`server/index.mjs`) | Alternative live OpenAI JSON extraction if `GEMINI_API_KEY` is unset |
| `VITE_SUPABASE_URL` | Frontend (`src/services/storageService.ts`) | Connects to Supabase project instead of local demo storage |
| `VITE_SUPABASE_ANON_KEY` | Frontend (`src/services/storageService.ts`) | Public anon key for Supabase client |

Run `supabase/schema.sql` in your Supabase SQL Editor to create the `complaints`, `user_profiles`, and `complaint_status_history` tables.

## Running Tests

```bash
npm test
npm run build
```
