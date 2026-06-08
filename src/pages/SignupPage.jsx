import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout/AuthLayout'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    })
  }

  return (
    <AuthLayout orbHue={0}>
      <div className="auth-card" style={{ display: 'block', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2>Create an account</h2>
          <p className="subtitle">Start your interview prep journey today.</p>
        </div>

        {error && <div className="alert alert-error" style={{ display: 'block' }}>{error}</div>}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>First Name</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-user"></i>
              <input 
                type="text" 
                placeholder="John" 
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required 
              />
            </div>
          </div>
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
                minLength={6}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Create Account'}
          </button>
        </form>

        <div className="divider">or</div>

        <button onClick={handleGoogleSignup} className="btn btn-google">
          <i className="fa-brands fa-google"></i> Sign up with Google
        </button>

        <div className="footer-links" style={{ textAlign: 'center', marginTop: '30px' }}>
          <span>Already have an account? <Link to="/login">Log in</Link></span>
        </div>
      </div>
    </AuthLayout>
  )
}
