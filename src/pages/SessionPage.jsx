import { useLocation } from 'react-router-dom'

export default function SessionPage() {
  const location = useLocation()
  
  // Pass env variables securely to the iframe without exposing them in git
  const searchParams = new URLSearchParams(location.search);
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    searchParams.set('geminiKey', import.meta.env.VITE_GEMINI_API_KEY);
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <iframe 
        src={`/index-legacy.html?${searchParams.toString()}${location.hash}`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Legacy App"
        allow="microphone; camera"
      />
    </div>
  )
}
