import { Link } from 'react-router-dom'
import './AuthLayout.css'

export default function AuthLayout({ children }) {

  return (
    <div className="auth-layout">
      {/* Fixed Background - components removed per user request */}
      <div className="auth-background">
      </div>

      {/* Scrolling Content */}
      <div className="auth-content-scroll">
        <nav className="auth-nav">
          <div className="logo"><i className="fa-solid fa-microphone-lines"></i> <span>Coach</span></div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/">Pricing</Link>
          </div>
        </nav>

        <div className="auth-hero">

          
          <div className="auth-card-wrapper">
            {children}
          </div>
        </div>

        <section className="auth-feature-section">
           {/* Section 1 */}
           <div className="feature-block">
             <div className="feature-content">
               <span className="feature-badge">Advanced MediaPipe Technology</span>
               <h2>Real-time facial &<br/>eye tracking</h2>
               <p>Our intelligent system uses advanced Face Mesh technology to track your eye contact, expressions, and engagement level in real-time, giving you unparalleled insights into your non-verbal communication.</p>
               <ul className="feature-checks">
                 <li><i className="fa-solid fa-check"></i> 468 facial landmarks tracked</li>
                 <li><i className="fa-solid fa-check"></i> Eye contact & engagement scoring</li>
               </ul>
             </div>
             <div className="feature-graphic glass-panel">
               <div className="fake-ui-item"><i className="fa-solid fa-eye"></i> <div><strong>Eye Contact Analysis</strong><span>Measures where you look during answers</span></div></div>
               <div className="fake-ui-item"><i className="fa-solid fa-face-smile"></i> <div><strong>Expression Tracking</strong><span>Evaluates your confidence and posture</span></div></div>
               <div className="fake-ui-item"><i className="fa-solid fa-chart-line"></i> <div><strong>Real-time Analytics</strong><span>Instant processing with MediaPipe</span></div></div>
             </div>
           </div>

           {/* Section 2 */}
           <div className="feature-block reverse">
             <div className="feature-content">
               <span className="feature-badge">Review & Improve</span>
               <h2>Session replays &<br/>detailed feedback</h2>
               <p>Don't just practice blindly. Watch full session replays, review your question breakdowns, and get an honest assessment of your Key Strengths and Areas to Improve from Alex, your AI reviewer.</p>
               <ul className="feature-checks">
                 <li><i className="fa-solid fa-check"></i> Full video session replay</li>
                 <li><i className="fa-solid fa-check"></i> Question-by-question breakdown</li>
               </ul>
             </div>
             <div className="feature-graphic glass-panel">
                <div className="skill-bar"><span>Overall Score</span><div className="bar"><div style={{width: '85%', background: '#10b981'}}></div></div></div>
                <div className="skill-bar"><span>Eye Contact</span><div className="bar"><div style={{width: '92%', background: '#8b5cf6'}}></div></div></div>
                <div className="skill-bar"><span>Confidence</span><div className="bar"><div style={{width: '78%', background: '#3b82f6'}}></div></div></div>
                <div className="skill-bar"><span>Technical Accuracy</span><div className="bar"><div style={{width: '88%', background: '#f59e0b'}}></div></div></div>
             </div>
           </div>

           {/* Section 3 */}
           <div className="feature-grid-section">
             <div className="grid-header">
               <span className="feature-badge">Track your growth</span>
               <h2>Practice makes perfect</h2>
               <p>Monitor your progress over time with visual history trends.<br/>Configure your sessions to target exactly what you need to work on.</p>
             </div>
             <div className="feature-grid">
               <div className="grid-item">
                 <i className="fa-solid fa-chart-area" style={{color: '#10b981'}}></i>
                 <h3>Score Progression</h3>
                 <p>Visualize your improvement over multiple interviews using interactive charts and historical data.</p>
               </div>
               <div className="grid-item">
                 <i className="fa-solid fa-building" style={{color: '#3b82f6'}}></i>
                 <h3>FAANG-Level Questions</h3>
                 <p>Practice with rigorous, real-world questions asked by top tech companies like Meta, Amazon, Netflix, and Google.</p>
               </div>
               <div className="grid-item">
                 <i className="fa-solid fa-arrow-trend-up" style={{color: '#f59e0b'}}></i>
                 <h3>Key Strengths</h3>
                 <p>Identify what you are doing right so you can double down on your best interview qualities.</p>
               </div>
               <div className="grid-item">
                 <i className="fa-solid fa-screwdriver-wrench" style={{color: '#8b5cf6'}}></i>
                 <h3>Areas to Improve</h3>
                 <p>Get actionable, targeted advice on the specific technical and behavioral areas you struggle with.</p>
               </div>
             </div>
           </div>
        </section>
      </div>
    </div>
  )
}
