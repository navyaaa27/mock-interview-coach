# Mock Interview Coach

An AI-powered, browser-based mock interview platform that simulates realistic technical and behavioral interviews using real-time video, audio, and generative AI feedback.

## Features

- **Interactive AI Interviewer (Alex)**: Ask questions, listen to your answers, and adapt the difficulty on the fly.
- **Interview Readiness Score**: A dynamically calculated 0-100 score indicating your overall preparedness based on 6 core signals, displayed natively across both the dashboard and progress views.
- **AI-Powered Study Plan**: Generates a week-by-week personalized practice schedule using the Claude API, specifically tailored to target your weak areas.
- **Progress & Analytics Hub**: A dedicated React-based hub featuring visual trend charts (Recharts) to track your delivery, weak areas, and score trajectories.
- **Real-time Video & Audio**: Uses MediaDevices API and local MediaRecorder to capture and upload your interview responses.
- **Comprehensive Feedback**: Provides detailed scores on Clarity, Depth, and Structure. Analyzes delivery metrics like Words Per Minute (WPM), Filler Words, and Eye Contact percentage.
- **Session History & Analytics**: Tracks your interview performance over time with visual trend charts.
- **Video Replay**: Re-watch your interview answers side-by-side with AI coaching feedback and model answers to learn exactly where you can improve.
- **Company Profiles**: Interviews dynamically adapt to the style of top tech companies (e.g., Google, Amazon, Stripe).

## Tech Stack

- **Frontend Architecture**: Hybrid approach combining a legacy Vanilla HTML/JS app (Dashboard & Session Engine) with a modern **React & Vite** integration for rich analytics and study planning.
- **Styling**: Custom CSS with glassmorphism, dynamic animations, and responsive design.
- **Data Visualization**: Recharts (React) and Chart.js (Legacy) for interactive data displays.
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, and Storage).
- **AI Integrations**: Gemini / Claude (for study plans and feedback), ElevenLabs (for voice), and Deepgram (for speech-to-text).
- **Video Processing**: MediaPipe Face Mesh for eye contact tracking.

## Setup Instructions

1. Clone this repository.
2. Ensure you have a Supabase project set up.
3. Configure your local Supabase database with the required SQL schemas.
4. Add your API keys (`VITE_CLAUDE_API_KEY`, Gemini, Deepgram, etc.) to a `.env` file.
5. Run `npm install` to install dependencies.
6. Run `npm run dev` to start the Vite development server.

## Security & Privacy

We strongly advise **against** committing `.env` files or any sensitive backend API keys to this repository. The `anonKey` included in the frontend is a Supabase public publishable key, which is safe for client-side use assuming proper Row Level Security (RLS) policies are active on the database.
