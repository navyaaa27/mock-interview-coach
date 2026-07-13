# Mock Interview Coach

> **AI-powered mock interviews** — face-to-face with a voice AI interviewer, scored by Gemini 2.5 Flash, transcribed by Deepgram, and spoken by ElevenLabs.

A browser-based interview simulator that puts you in a realistic interview with an AI interviewer named Alex. You answer out loud, Alex scores every answer using the **Gemini 2.5 Flash API**, and you get detailed feedback on Clarity, Depth, and Structure — plus a model answer for every question.

---

## AI Stack

| What | Which AI | Used for |
|---|---|---|
| Answer scoring & feedback | **Google Gemini 2.5 Flash** | Scores each answer 1–10 across Clarity, Depth, and Structure. Returns strengths, improvements, and a model answer. |
| Interviewer voice | **ElevenLabs TTS** | Speaks questions out loud in a realistic voice so it feels like a real interview. |
| Your speech → text | **Deepgram** | Real-time transcription of your verbal answers during the session. |
| Study plan generation | **Claude API (Anthropic)** | Generates a personalised week-by-week study plan targeting your weak areas. |
| Eye contact tracking | **MediaPipe Face Mesh** | Detects face landmarks to calculate your eye contact % during video interviews. |

---

## Features

- **AI Interviewer (Alex)** — asks questions, adapts difficulty, and responds to your answers in real time
- **Per-answer AI Scoring** — Gemini scores every answer on Clarity, Depth, and Structure with specific, actionable feedback
- **Model Answers** — see exactly how a strong candidate would have answered each question
- **Company Profiles** — interviews adapt to the style of Google, Amazon, Stripe, and other top companies
- **Interview Readiness Score** — a 0–100 score across 6 signals shown on the dashboard
- **AI Study Plan** — Claude generates a personalised week-by-week practice schedule based on your weak areas
- **Video Replay** — re-watch your answers side-by-side with AI coaching notes
- **Progress Analytics** — trend charts for score, delivery (WPM, filler words, eye contact %), and weak areas

---

## Tech Stack

- **Frontend**: Hybrid React + Vite (analytics, dashboard) + Vanilla JS (interview session engine)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Storage)
- **Charts**: Recharts (React) · Chart.js (legacy)
- **AI APIs**: Gemini 2.5 Flash · ElevenLabs · Deepgram · Claude
- **Computer Vision**: MediaPipe Face Mesh

---

## Setup

```bash
git clone https://github.com/navyaaa27/mock-interview-coach.git
cd mock-interview-coach
npm install
```

Create a `.env` file at the root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_DEEPGRAM_API_KEY=your_deepgram_key
VITE_CLAUDE_API_KEY=your_claude_key
```

```bash
npm run dev
```

---

## Security

Never commit `.env`. The Supabase `anonKey` in the frontend is safe for client-side use **only if** proper Row Level Security (RLS) policies are active on your database.
