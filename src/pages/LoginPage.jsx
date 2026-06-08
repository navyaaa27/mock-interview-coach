import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout/AuthLayout'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    })
  }

  return (
    <AuthLayout orbHue={0}>
      <div className="auth-card" style={{ display: 'block', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2>Welcome back to <span>Coach</span></h2>
          <p className="subtitle">Sign in to continue your interview prep.</p>
        </div>

        {error && <div className="alert alert-error" style={{ display: 'block' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-envelope"></i>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-lock"></i>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Sign In'}
          </button>
        </form>

        <div className="divider">or</div>

        <button onClick={handleGoogleLogin} className="btn btn-google">
          <i className="fa-brands fa-google"></i> Continue with Google
        </button>

        <div className="footer-links" style={{ textAlign: 'center', marginTop: '30px' }}>
          <span>Don't have an account? <Link to="/signup">Sign up</Link></span>
        </div>
      </div>
    </AuthLayout>
  )
}
