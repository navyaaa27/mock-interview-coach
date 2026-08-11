import { useEffect, useRef } from 'react';
import './ReadinessDial.css';

export default function ReadinessDial({ score = 0, tierLabel = 'Just getting started' }) {
  const circleRef = useRef(null);
  const circumference = 2 * Math.PI * 90; // r=90
  const safeScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));

  useEffect(() => {
    const offset = circumference - (safeScore / 100) * circumference;
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = circumference;
      requestAnimationFrame(() => {
        circleRef.current.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1)';
        circleRef.current.style.strokeDashoffset = offset;
      });
    }
  }, [safeScore, circumference]);

  return (
    <div className="dial-wrap">
      <div className="dial-pulse"></div>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-ember)" />
            <stop offset="100%" stopColor="var(--accent-blue)" />
          </linearGradient>
        </defs>
        <circle className="dial-track" cx="100" cy="100" r="90" />
        <circle 
          className="dial-progress" 
          cx="100" cy="100" r="90" 
          strokeDasharray={circumference} 
          strokeDashoffset={circumference} 
          ref={circleRef} 
          transform="rotate(-90 100 100)" 
        />
      </svg>
      <div className="dial-center">
        <div className="dial-num">{safeScore}</div>
        <div className="dial-label">
          Readiness<br />score
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>
        {tierLabel}
      </div>
    </div>
  );
}
