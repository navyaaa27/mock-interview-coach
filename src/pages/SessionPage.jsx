import { useLocation } from 'react-router-dom'

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
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <iframe 
        src={`/index-legacy.html?_cb=${Date.now()}&${searchParams.toString()}${location.hash}`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Legacy App"
        allow="microphone; camera"
      />
    </div>
  )
}
