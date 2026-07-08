import { Link } from 'react-router-dom'
import './AuthLayout.css'

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-background">
        <iframe 
          src="https://upbeat-wqebwq4g.peachweb.site"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Immersive 3D Background"
        />
      </div>
      <div className="auth-content-scroll">
        <div className="auth-hero">
          <div className="auth-card-wrapper">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
