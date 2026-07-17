import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Radar from '../components/Radar/Radar'

export default function SessionPage() {
  const location = useLocation()
  
  // Pass env variables securely to the iframe without exposing them in git
  const searchParams = new URLSearchParams(location.search);

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
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Background Radar Component */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <Radar 
          speed={1} 
          scale={0.5} 
          ringCount={10} 
          spokeCount={10} 
          ringThickness={0.05} 
          spokeThickness={0.01} 
          sweepSpeed={1} 
          sweepWidth={2} 
          sweepLobes={1} 
          color="#3f06a0" 
          backgroundColor="#000000" 
          falloff={2} 
          brightness={1} 
          enableMouseInteraction={true} 
          mouseInfluence={0.1} 
        />
      </div>

      <iframe 
        src={`/index-legacy.html?_cb=${Date.now()}&embedded=1&${searchParams.toString()}${location.hash}`} 
        style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 1 }}
        title="Legacy App"
        allow="microphone; camera"
      />
    </div>
  )
}

