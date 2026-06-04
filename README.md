# Mock Interview Coach

An AI-powered, browser-based mock interview platform that simulates realistic technical and behavioral interviews using real-time video, audio, and generative AI feedback.

## Features

- **Interactive AI Interviewer (Alex)**: Ask questions, listen to your answers, and adapt the difficulty on the fly.
- **Real-time Video & Audio**: Uses MediaDevices API and local MediaRecorder to capture and upload your interview responses.
- **Comprehensive Feedback**: Provides detailed scores on Clarity, Depth, and Structure. Analyzes delivery metrics like Words Per Minute (WPM), Filler Words, and Eye Contact percentage.
- **Session History & Analytics**: Tracks your interview performance over time with visual trend charts.
- **Video Replay**: Re-watch your interview answers side-by-side with AI coaching feedback and model answers to learn exactly where you can improve.
- **Company Profiles**: Interviews dynamically adapt to the style of top tech companies (e.g., Google, Amazon, Stripe).

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (No complex build step, just drop it in and run!)
- **UI/UX**: Custom CSS with glassmorphism, dynamic animations, and responsive design.
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, and Storage).
- **Video Processing**: MediaPipe Face Mesh for eye contact tracking.
- **Charts**: Chart.js for data visualization.

## Setup Instructions

1. Clone this repository.
2. Ensure you have a Supabase project set up.
3. Configure your local Supabase database with the provided SQL schemas (`query.sql` and `add_company_fit.sql`).
4. Serve `index.html` locally using any standard web server (e.g., `npx serve` or Live Server in VSCode).
5. (Note: API Keys for generative AI functions must be configured within your Supabase Edge Functions / Backend, ensuring no sensitive secrets are committed to the frontend repository.)

## Security & Privacy

We strongly advise **against** committing `.env` files or any sensitive backend API keys (like OpenAI or Gemini keys) to this repository. The `anonKey` included in the frontend is a Supabase public publishable key, which is safe for client-side use assuming proper Row Level Security (RLS) policies are active on the database.
