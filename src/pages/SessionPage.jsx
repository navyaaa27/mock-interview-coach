import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function SessionPage({ view }) {
  const location = useLocation()
  
  // Pass env variables securely to the iframe without exposing them in git
  const searchParams = new URLSearchParams(location.search);

  // If a named view was supplied via props (e.g. from /history route), inject it
  if (view) searchParams.set('view', view);

  if (import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY.includes('goes_here')) {
    searchParams.set('geminiKey', import.meta.env.VITE_GEMINI_API_KEY);
  }
  if (import.meta.env.VITE_DEEPGRAM_API_KEY) {
    searchParams.set('deepgramKey', import.meta.env.VITE_DEEPGRAM_API_KEY);
  }
  if (import.meta.env.VITE_ELEVENLABS_API_KEY) {
    searchParams.set('elevenLabsKey', import.meta.env.VITE_ELEVENLABS_API_KEY);
  }
  // P5.05 Listen for session completed event from legacy app
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SESSION_COMPLETED' && event.data?.userId) {
        import('../lib/readinessService').then(m => m.recalculateReadiness(event.data.userId));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
      <iframe 
        src={`/index-legacy.html?_cb=${Date.now()}&embedded=1&${searchParams.toString()}${location.hash}`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Legacy App"
        allow="microphone; camera"
      />
    </div>
  )
}

