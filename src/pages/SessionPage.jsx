import { useLocation } from 'react-router-dom'

export default function SessionPage() {
  const location = useLocation()
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <iframe 
        src={`/index-legacy.html${location.search}${location.hash}`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Legacy App"
      />
    </div>
  )
}
