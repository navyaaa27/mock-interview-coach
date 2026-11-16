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
           {/* Section 1: Eye Tracking - Matches Reference Image Style */}
           <div className="editorial-card-wrapper">
             <div className="editorial-card">
               {/* Left Column: Text & Numbered List */}
               <div className="editorial-left">
                 <div className="editorial-badge">
                   <span className="badge-square" style={{ background: '#f43f5e' }}></span>
                   <span>ADVANCED MEDIAPIPE TECHNOLOGY</span>
                 </div>
                 
                 <h2 className="editorial-title">
                   Real–time facial &amp; <span className="title-accent">eye</span><br/>tracking
                 </h2>
                 
                 <p className="editorial-desc">
                   Our intelligent system uses advanced Face Mesh technology to track your eye contact, expressions, and engagement level in real-time, giving you unparalleled insights into your non-verbal communication.
                 </p>
                 
                 <div className="editorial-list">
                   <div className="list-row">
                     <span className="list-num">01</span>
                     <div className="list-body">
                       <strong className="list-title">Eye Contact Analysis</strong>
                       <span className="list-sub">Measures where you look during answers</span>
                     </div>
                   </div>
                   
                   <div className="list-row">
                     <span className="list-num">02</span>
                     <div className="list-body">
                       <strong className="list-title">Expression Tracking</strong>
                       <span className="list-sub">Reads your expressions as you speak</span>
                     </div>
                   </div>
                   
                   <div className="list-row">
                     <span className="list-num">03</span>
                     <div className="list-body">
                       <strong className="list-title">Engagement Scoring</strong>
                       <span className="list-sub">Turns it all into one score per answer</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Right Column: Face Mesh SVG Graphic + 468 Stat */}
               <div className="editorial-right">
                 {/* Face Mesh Visualization */}
                 <div className="mesh-visual-container">
                   <svg className="face-mesh-svg" viewBox="0 0 400 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                     {/* Annotation pointers */}
                     <g className="mesh-annotations">
                       {/* Engagement pointer */}
                       <path d="M 60 70 L 140 70 L 175 110" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="3 3" />
                       <text x="55" y="65" fill="rgba(255,255,255,0.7)" fontSize="10" letterSpacing="2" fontWeight="700">ENGAGEMENT</text>
                       
                       {/* Gaze pointer with target reticle */}
                       <path d="M 270 170 L 320 120" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="3 3" />
                       <circle cx="320" cy="120" r="8" stroke="#f43f5e" strokeWidth="1.5" fill="none" />
                       <circle cx="320" cy="120" r="3" fill="#f43f5e" />
                       <text x="320" y="102" textAnchor="middle" fill="#f43f5e" fontSize="10" letterSpacing="2" fontWeight="700">GAZE</text>
                       
                       {/* Expression pointer */}
                       <path d="M 60 280 L 130 280 L 170 260" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="3 3" />
                       <text x="55" y="275" fill="rgba(255,255,255,0.7)" fontSize="10" letterSpacing="2" fontWeight="700">EXPRESSION</text>
                     </g>

                     {/* Face Mesh Wireframe Lines */}
                     <g className="mesh-lines" stroke="rgba(34, 211, 238, 0.28)" strokeWidth="0.8">
                       {/* Outer head contour */}
                       <polygon points="200,50 240,65 275,100 295,150 295,210 270,270 235,320 200,340 165,320 130,270 105,210 105,150 125,100 160,65" />
                       {/* Forehead & Temple grid */}
                       <polygon points="200,50 200,90 240,65" />
                       <polygon points="200,50 200,90 160,65" />
                       <polygon points="160,65 200,90 170,115 125,100" />
                       <polygon points="240,65 200,90 230,115 275,100" />
                       <polygon points="200,90 170,115 200,130 230,115" />
                       
                       {/* Eyebrows */}
                       <path d="M 140 140 Q 165 130 185 142" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
                       <path d="M 215 142 Q 235 130 260 140" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
                       
                       {/* Left Eye */}
                       <ellipse cx="162" cy="170" rx="20" ry="11" stroke="#f472b6" strokeWidth="1.2" fill="rgba(244,114,182,0.06)" />
                       <circle cx="162" cy="170" r="5" fill="#f43f5e" />
                       <circle cx="160" cy="168" r="1.5" fill="#fff" />
                       
                       {/* Right Eye */}
                       <ellipse cx="238" cy="170" rx="20" ry="11" stroke="#f472b6" strokeWidth="1.2" fill="rgba(244,114,182,0.06)" />
                       <circle cx="240" cy="170" r="5" fill="#f43f5e" />
                       <circle cx="238" cy="168" r="1.5" fill="#fff" />
                       
                       {/* Nose bridge & tip */}
                       <polygon points="200,130 190,200 200,225 210,200" />
                       <path d="M 190 225 Q 200 232 210 225" stroke="#22d3ee" strokeWidth="1.2" fill="none" />
                       
                       {/* Cheeks network */}
                       <polygon points="105,150 142,170 120,220" />
                       <polygon points="120,220 142,170 162,210" />
                       <polygon points="162,210 190,225 170,255" />
                       <polygon points="295,150 258,170 280,220" />
                       <polygon points="280,220 258,170 238,210" />
                       <polygon points="238,210 210,225 230,255" />
                       
                       {/* Mouth / Smile contour */}
                       <path d="M 160 265 Q 200 288 240 265" stroke="#c4b5fd" strokeWidth="1.6" fill="none" />
                       <path d="M 165 265 Q 200 274 235 265" stroke="#c4b5fd" strokeWidth="1" fill="none" />
                       
                       {/* Chin mesh */}
                       <polygon points="170,255 200,280 230,255 200,265" />
                       <polygon points="170,255 200,280 185,315" />
                       <polygon points="230,255 200,280 215,315" />
                       <polygon points="185,315 200,280 215,315 200,340" />
                     </g>

                     {/* Key Landmark Dots */}
                     <g className="mesh-dots" fill="#22d3ee">
                       <circle cx="200" cy="50" r="2" />
                       <circle cx="200" cy="90" r="2" />
                       <circle cx="200" cy="130" r="2" />
                       <circle cx="170" cy="115" r="2" />
                       <circle cx="230" cy="115" r="2" />
                       <circle cx="140" cy="140" r="2" />
                       <circle cx="185" cy="142" r="2" />
                       <circle cx="215" cy="142" r="2" />
                       <circle cx="260" cy="140" r="2" />
                       <circle cx="200" cy="225" r="2.5" fill="#f43f5e" />
                       <circle cx="160" cy="265" r="2" fill="#c4b5fd" />
                       <circle cx="240" cy="265" r="2" fill="#c4b5fd" />
                       <circle cx="200" cy="285" r="2" fill="#c4b5fd" />
                       <circle cx="200" cy="340" r="2.5" />
                     </g>
                   </svg>
                 </div>

                 {/* 468 Stat Callout */}
                 <div className="editorial-stat-block">
                   <div className="stat-big-num">468</div>
                   <div className="stat-big-caption">
                     FACIAL LANDMARKS<br/>TRACKED LIVE
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Section 2: Session Replays & Feedback */}
           <div className="editorial-card-wrapper">
             <div className="editorial-card reverse">
               {/* Left Column (now on right visually because of reverse): Text */}
               <div className="editorial-left">
                 <div className="editorial-badge">
                   <span className="badge-square" style={{ background: '#c4b5fd' }}></span>
                   <span>REVIEW &amp; IMPROVE</span>
                 </div>
                 
                 <h2 className="editorial-title">
                   Session replays &amp;<br/><span className="title-accent">detailed</span> feedback
                 </h2>
                 
                 <p className="editorial-desc">
                   Don't just practice blindly. Watch full session replays, review your question breakdowns, and get an honest assessment of your Key Strengths and Areas to Improve from Alex, your AI reviewer.
                 </p>
                 
                 <div className="editorial-list">
                   <div className="list-row">
                     <span className="list-num">01</span>
                     <div className="list-body">
                       <strong className="list-title">Full Video Session Replay</strong>
                       <span className="list-sub">Watch your recorded responses with synchronized telemetry</span>
                     </div>
                   </div>
                   
                   <div className="list-row">
                     <span className="list-num">02</span>
                     <div className="list-body">
                       <strong className="list-title">Question-by-Question Breakdown</strong>
                       <span className="list-sub">In-depth clarity, structure, and technical evaluation</span>
                     </div>
                   </div>
                   
                   <div className="list-row">
                     <span className="list-num">03</span>
                     <div className="list-body">
                       <strong className="list-title">Honest AI Coach Assessment</strong>
                       <span className="list-sub">Concrete action items to raise your score each round</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Right Column: Skill Bars + 4.2x Stat */}
               <div className="editorial-right">
                 <div className="analytics-visual-box">
                   <div className="analytic-row">
                     <div className="analytic-meta">
                       <span className="analytic-name">Overall Score</span>
                       <span className="analytic-val" style={{ color: '#10b981' }}>85%</span>
                     </div>
                     <div className="analytic-track">
                       <div className="analytic-fill" style={{ width: '85%', background: 'linear-gradient(90deg, #22d3ee, #10b981)' }}></div>
                     </div>
                   </div>

                   <div className="analytic-row">
                     <div className="analytic-meta">
                       <span className="analytic-name">Eye Contact</span>
                       <span className="analytic-val" style={{ color: '#c4b5fd' }}>92%</span>
                     </div>
                     <div className="analytic-track">
                       <div className="analytic-fill" style={{ width: '92%', background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)' }}></div>
                     </div>
                   </div>

                   <div className="analytic-row">
                     <div className="analytic-meta">
                       <span className="analytic-name">Confidence</span>
                       <span className="analytic-val" style={{ color: '#38bdf8' }}>78%</span>
                     </div>
                     <div className="analytic-track">
                       <div className="analytic-fill" style={{ width: '78%', background: 'linear-gradient(90deg, #3b82f6, #38bdf8)' }}></div>
                     </div>
                   </div>

                   <div className="analytic-row">
                     <div className="analytic-meta">
                       <span className="analytic-name">Technical Accuracy</span>
                       <span className="analytic-val" style={{ color: '#f59e0b' }}>88%</span>
                     </div>
                     <div className="analytic-track">
                       <div className="analytic-fill" style={{ width: '88%', background: 'linear-gradient(90deg, #f472b6, #f59e0b)' }}></div>
                     </div>
                   </div>
                 </div>

                 {/* Stat Callout */}
                 <div className="editorial-stat-block">
                   <div className="stat-big-num">4.2<span style={{ fontSize: '42px', fontStyle: 'italic', color: '#c4b5fd' }}>x</span></div>
                   <div className="stat-big-caption">
                     FASTER READINESS<br/>WITH REPLAY AUDITS
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Section 3: Practice Grid */}
           <div className="feature-grid-section">
             <div className="grid-header">
               <div className="editorial-badge" style={{ justifyContent: 'center' }}>
                 <span className="badge-square" style={{ background: '#f472b6' }}></span>
                 <span>TRACK YOUR GROWTH</span>
               </div>
               <h2>Practice makes <span className="title-accent">perfect</span></h2>
               <p>Monitor your progress over time with visual history trends.<br/>Configure your sessions to target exactly what you need to work on.</p>
             </div>
             
             <div className="feature-grid">
               <div className="grid-item">
                 <div className="grid-item-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                   <i className="fa-solid fa-chart-area"></i>
                 </div>
                 <h3>Score Progression</h3>
                 <p>Visualize your improvement over multiple interviews using interactive charts and historical data.</p>
               </div>
               
               <div className="grid-item">
                 <div className="grid-item-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                   <i className="fa-solid fa-building"></i>
                 </div>
                 <h3>FAANG-Level Questions</h3>
                 <p>Practice with rigorous, real-world questions asked by top tech companies like Meta, Amazon, Netflix, and Google.</p>
               </div>
               
               <div className="grid-item">
                 <div className="grid-item-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                   <i className="fa-solid fa-arrow-trend-up"></i>
                 </div>
                 <h3>Key Strengths</h3>
                 <p>Identify what you are doing right so you can double down on your best interview qualities.</p>
               </div>
               
               <div className="grid-item">
                 <div className="grid-item-icon" style={{ background: 'rgba(196, 181, 253, 0.12)', color: '#c4b5fd', border: '1px solid rgba(196, 181, 253, 0.25)' }}>
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
