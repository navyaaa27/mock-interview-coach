import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// P6.02 A09: Log security events to auth_logs
async function logAuthEvent(userId, eventType, extraMeta = {}) {
  try {
    await supabase.from('auth_logs').insert({
      user_id: userId || null,
      event_type: eventType,
      user_agent: navigator.userAgent,
      ...extraMeta
    })
  } catch (_) {
    // Never block auth flow for a logging failure
  }
}

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setCurrentUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)

        if (event === 'SIGNED_IN') {
          // A07: Update last_login timestamp
          await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', session.user.id)
          // A09: Log successful login
          await logAuthEvent(session.user.id, 'login')
        }

        if (event === 'TOKEN_REFRESHED') {
          // A07: Check if last_login is older than 30 days — force re-login
          const { data: u } = await supabase.from('users').select('last_login').eq('id', session.user.id).maybeSingle()
          if (u?.last_login) {
            const daysSince = (Date.now() - new Date(u.last_login).getTime()) / (1000 * 60 * 60 * 24)
            if (daysSince > 30) {
              await logAuthEvent(session.user.id, 'forced_logout_session_expired')
              await supabase.auth.signOut()
              return
            }
          }
        }
      } else {
        setProfile(null)
        setLoading(false)
        if (event === 'SIGNED_OUT') {
          // A09: Log logout
          await logAuthEvent(null, 'logout')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ currentUser, profile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
