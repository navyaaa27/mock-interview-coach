import React, { useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export default function SessionPage() {
  const location = useLocation()
  
  // BUG 6 FIX: Freeze the cache-buster on mount with useRef.
  // Previously Date.now() was recalculated on every React render, causing the iframe
  // to reload and lose all interview state (questions, recording, session) mid-session.
  const cbRef = useRef(Date.now())

  // Build the iframe src once and memoize it so re-renders never touch it.
  const iframeSrc = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)

    // Pass env variables securely to the iframe without exposing them in git.
    // BUG 17 FIX: Simplified check \u2014 removed the fragile 'goes_here' string guard.
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      searchParams.set('geminiKey', import.meta.env.VITE_GEMINI_API_KEY)
    }
    if (import.meta.env.VITE_DEEPGRAM_API_KEY) {
      searchParams.set('deepgramKey', import.meta.env.VITE_DEEPGRAM_API_KEY)
    }
    if (import.meta.env.VITE_ELEVENLABS_API_KEY) {
      searchParams.set('elevenLabsKey', import.meta.env.VITE_ELEVENLABS_API_KEY)
    }

    return `/index-legacy.html?_cb=${cbRef.current}&embedded=1&${searchParams.toString()}${location.hash}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps: build URL once on mount. Parent re-renders will NOT reload the iframe.

  // P5.05 Listen for session completed event from legacy app
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SESSION_COMPLETED' && event.data?.userId) {
        import('../lib/readinessService').then(m => m.recalculateReadiness(event.data.userId))
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
      <iframe
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Legacy App"
        allow="microphone; camera"
      />
    </div>
  )
}
