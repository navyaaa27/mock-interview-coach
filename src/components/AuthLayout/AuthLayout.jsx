import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScroll } from 'framer-motion'
import Orb from '../Orb/Orb'
import CSSPeachWorld from '../CSSPeachWorld/CSSPeachWorld'
import './AuthLayout.css'

export default function AuthLayout({ children, orbHue = 0 }) {
  const { scrollYProgress } = useScroll();

  return (
    <div className="auth-layout">
      {/* Fixed Background */}
      <div className="auth-background">
        <CSSPeachWorld scrollYProgress={scrollYProgress} />
        <div className="bg-layer" style={{ opacity: 1 }}>
          <Orb hue={orbHue} hoverIntensity={5} rotateOnHover forceHoverState={false} />
        </div>
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
          <div className="hero-text">
            <div className="hero-badge"><i className="fa-solid fa-video"></i> Realistic AI Video & Voice Interviews</div>
            <h1>Ace your next<br/>interview!</h1>
            <p>Talk face-to-face with our AI in a realistic video and voice chat interview. Get cutting-edge feedback with real-time eye tracking and deep performance analytics.</p>
          </div>
          
          <div className="auth-card-wrapper">
            {children}
          </div>
        </div>

        <section className="auth-feature-section">
           {/* Section 1: Eye Tracking */}
           <div className="feature-block">
             <div className="feature-content">
               <span className="feature-badge"><span className="badge-dot" style={{background: '#22d3ee'}}></span> Advanced MediaPipe Technology</span>
               <h2>Real-time facial &<br/><span className="accent-word">eye tracking</span></h2>
               <p>Our intelligent system uses advanced Face Mesh technology to track your eye contact, expressions, and engagement level in real-time, giving you unparalleled insights into your non-verbal communication.</p>
               <div className="feature-numbered-list">
                 <div className="numbered-item">
                   <span className="item-number">01</span>
                   <div className="item-text">
                     <strong>Eye Contact Analysis</strong>
                     <span>Measures where you look during answers</span>
                   </div>
                 </div>
                 <div className="numbered-item">
                   <span className="item-number">02</span>
                   <div className="item-text">
                     <strong>Expression Tracking</strong>
                     <span>Reads your expressions as you speak</span>
                   </div>
                 </div>
                 <div className="numbered-item">
                   <span className="item-number">03</span>
                   <div className="item-text">
                     <strong>Engagement Scoring</strong>
                     <span>Turns it all into one score per answer</span>
                   </div>
                 </div>
               </div>
             </div>
             <div className="feature-graphic feature-visual-panel">
               <div className="visual-labels">
                 <span className="visual-tag tag-top">ENGAGEMENT</span>
                 <span className="visual-tag tag-right">GAZE <span className="tag-icon">◎</span></span>
                 <span className="visual-tag tag-bottom">EXPRESSION</span>
               </div>
               <div className="visual-face-mesh">
                 <i className="fa-solid fa-head-side-cough" style={{fontSize: '120px', opacity: 0.15, color: '#22d3ee'}}></i>
               </div>
               <div className="stat-callout">
                 <span className="stat-number">468</span>
                 <span className="stat-label">FACIAL LANDMARKS<br/>TRACKED LIVE</span>
               </div>
             </div>
           </div>

           {/* Section 2: Session Replays */}
           <div className="feature-block reverse">
             <div className="feature-content">
               <span className="feature-badge"><span className="badge-dot" style={{background: '#c4b5fd'}}></span> Review & Improve</span>
               <h2>Session replays &<br/><span className="accent-word">detailed feedback</span></h2>
               <p>Don't just practice blindly. Watch full session replays, review your question breakdowns, and get an honest assessment of your Key Strengths and Areas to Improve from Alex, your AI reviewer.</p>
               <div className="feature-numbered-list">
                 <div className="numbered-item">
                   <span className="item-number">01</span>
                   <div className="item-text">
                     <strong>Full Video Replay</strong>
                     <span>Watch your complete interview session back</span>
                   </div>
                 </div>
                 <div className="numbered-item">
                   <span className="item-number">02</span>
                   <div className="item-text">
                     <strong>Question Breakdown</strong>
                     <span>See scoring per question with AI analysis</span>
                   </div>
                 </div>
                 <div className="numbered-item">
                   <span className="item-number">03</span>
                   <div className="item-text">
                     <strong>AI Reviewer Insights</strong>
                     <span>Get strengths and areas to improve from Alex</span>
                   </div>
                 </div>
               </div>
             </div>
             <div className="feature-graphic feature-visual-panel">
               <div className="visual-score-bars">
                 <div className="score-row">
                   <span className="score-label">Overall Score</span>
                   <div className="score-bar"><div className="score-fill" style={{width: '85%', background: 'linear-gradient(90deg, #22d3ee, #10b981)'}}></div></div>
                   <span className="score-pct">85%</span>
                 </div>
                 <div className="score-row">
                   <span className="score-label">Eye Contact</span>
                   <div className="score-bar"><div className="score-fill" style={{width: '92%', background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)'}}></div></div>
                   <span className="score-pct">92%</span>
                 </div>
                 <div className="score-row">
                   <span className="score-label">Confidence</span>
                   <div className="score-bar"><div className="score-fill" style={{width: '78%', background: 'linear-gradient(90deg, #3b82f6, #22d3ee)'}}></div></div>
                   <span className="score-pct">78%</span>
                 </div>
                 <div className="score-row">
                   <span className="score-label">Technical</span>
                   <div className="score-bar"><div className="score-fill" style={{width: '88%', background: 'linear-gradient(90deg, #f472b6, #f59e0b)'}}></div></div>
                   <span className="score-pct">88%</span>
                 </div>
               </div>
               <div className="stat-callout">
                 <span className="stat-number">4.2<span className="stat-unit">x</span></span>
                 <span className="stat-label">FASTER IMPROVEMENT<br/>WITH REPLAYS</span>
               </div>
             </div>
           </div>

           {/* Section 3: Practice Grid */}
           <div className="feature-grid-section">
             <div className="grid-header">
               <span className="feature-badge"><span className="badge-dot" style={{background: '#f472b6'}}></span> Track your growth</span>
               <h2>Practice makes <span className="accent-word">perfect</span></h2>
               <p>Monitor your progress over time with visual history trends.<br/>Configure your sessions to target exactly what you need to work on.</p>
             </div>
             <div className="feature-grid">
               <div className="grid-item">
                 <div className="grid-item-icon" style={{background: 'rgba(16, 185, 129, 0.15)', color: '#10b981'}}>
                   <i className="fa-solid fa-chart-area"></i>
                 </div>
                 <h3>Score Progression</h3>
                 <p>Visualize your improvement over multiple interviews using interactive charts and historical data.</p>
               </div>
               <div className="grid-item">
                 <div className="grid-item-icon" style={{background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6'}}>
                   <i className="fa-solid fa-building"></i>
                 </div>
                 <h3>FAANG-Level Questions</h3>
                 <p>Practice with rigorous, real-world questions asked by top tech companies like Meta, Amazon, Netflix, and Google.</p>
               </div>
               <div className="grid-item">
                 <div className="grid-item-icon" style={{background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b'}}>
                   <i className="fa-solid fa-arrow-trend-up"></i>
                 </div>
                 <h3>Key Strengths</h3>
                 <p>Identify what you are doing right so you can double down on your best interview qualities.</p>
               </div>
               <div className="grid-item">
                 <div className="grid-item-icon" style={{background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6'}}>
                   <i className="fa-solid fa-screwdriver-wrench"></i>
                 </div>
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
