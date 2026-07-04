import React, { useState, useEffect } from 'react';
import { recalculateReadiness } from '../../lib/readinessService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';

export default function ReadinessScore() {
  const { currentUser } = useAuth();
  const [score, setScore] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [confettiFired, setConfettiFired] = useState(false);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: user } = await supabase
          .from('users')
          .select('readiness_updated_at, readiness_score_stale')
          .eq('id', currentUser.id)
          .maybeSingle();
          
        if (user?.readiness_updated_at) {
          setUpdatedAt(new Date(user.readiness_updated_at));
        } else {
          setUpdatedAt(new Date()); 
        }
        if (user?.readiness_score_stale) setIsStale(true);

        const res = await recalculateReadiness(currentUser.id, true);
        setData(res);
        if (res?.score !== undefined) setScore(res.score);
        if (!user?.readiness_updated_at) setUpdatedAt(new Date());
      } catch (err) {
        console.error('ReadinessScore load error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (currentUser?.id) loadData();
  }, [currentUser]);

  useEffect(() => {
    if (data && data.gap_analysis && !confettiFired) {
      const gap = data.gap_analysis;
      const allClosed = gap.score_gap <= 0 && gap.technical_gap <= 0 && gap.behavioral_gap <= 0 && gap.hard_sessions_gap <= 0;
      if (allClosed) {
        setConfettiFired(true);
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#2dd4a0', '#b06aff', '#60cfff']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#2dd4a0', '#b06aff', '#60cfff']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }
    }
  }, [data, confettiFired]);

  if (loading) {
    return (
      <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ color: '#888' }}>Calculating Readiness Score...</div>
      </div>
    );
  }

  if (!data) return null;

  const gap = data.gap_analysis;
  
  let label = "Just getting started";
  let color = "#666666";
  let glow = "none";

  if (score >= (gap?.threshold || 85)) {
    label = "Interview ready 🎯";
    color = "#2dd4a0";
    glow = "0 0 20px rgba(45, 212, 160, 0.4)";
  } else if (score >= 75) {
    label = "Strong candidate";
    color = "#2dd4a0";
  } else if (score >= 60) {
    label = "Getting interview-ready";
    color = "#60cfff";
  } else if (score >= 40) {
    label = "Building foundations";
    color = "#ffcc60";
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let timeAgo = "Just now";
  if (updatedAt) {
    const mins = Math.floor((new Date() - updatedAt) / 60000);
    if (mins > 0) {
      if (mins < 60) timeAgo = `${mins} minute${mins !== 1 ? 's' : ''} ago`;
      else {
        const hrs = Math.floor(mins / 60);
        timeAgo = `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
      }
    }
  }

  const renderProgressBar = (current, required, max = 10) => {
    const percent = Math.min((current / max) * 100, 100);
    const reqPercent = Math.min((required / max) * 100, 100);
    return (
      <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', position: 'relative', marginTop: '4px' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: current >= required ? '#2dd4a0' : '#ffcc60', borderRadius: '3px' }}></div>
        <div style={{ position: 'absolute', top: '-4px', bottom: '-4px', left: `${reqPercent}%`, width: '2px', background: '#fff' }}></div>
      </div>
    );
  };

  return (
    <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* P6.01 FIX 5: Stale score warning */}
      {isStale && (
        <div style={{
          width: '100%', maxWidth: '500px', marginBottom: '1.25rem',
          background: 'rgba(255, 170, 0, 0.08)', border: '1px solid rgba(255,170,0,0.35)',
          borderRadius: '10px', padding: '10px 16px',
          fontSize: '0.8rem', color: '#ffcc60', textAlign: 'center', lineHeight: '1.5'
        }}>
          ⏳ Your readiness score may be lower than expected — some session feedback is still processing. It will update automatically.
        </div>
      )}

      {/* Hero Circular Ring */}
      <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1rem' }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Ring */}
          <circle 
            cx="80" cy="80" r={radius} 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="12" 
            fill="none" 
          />
          {/* Progress Ring */}
          <circle 
            cx="80" cy="80" r={radius} 
            stroke={color} 
            strokeWidth="12" 
            fill="none" 
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1.5s ease-out',
              filter: score >= (gap?.threshold || 85) ? 'drop-shadow(0px 0px 8px rgba(45,212,160,0.5))' : 'none'
            }}
          />
          {/* Threshold Marker */}
          {gap && gap.threshold && (
            <g style={{ transform: `rotate(${(gap.threshold / 100) * 360}deg)`, transformOrigin: '80px 80px' }}>
              <polygon points="80,14 84,6 76,6" fill="#fff" />
            </g>
          )}
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', textShadow: glow }}>{score}</span>
        </div>
      </div>
      
      {gap && gap.threshold && (
        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '8px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
          {gap.company} bar: {gap.threshold}
        </div>
      )}

      <h2 style={{ margin: '0 0 8px 0', color: color, fontSize: '1.5rem', textShadow: glow }}>{label}</h2>
      <p style={{ margin: '0 0 16px 0', color: '#888', fontSize: '0.875rem' }}>Updated {timeAgo}</p>

      {/* Gap Analysis Section */}
      {gap && gap.company && (
        <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textAlign: 'center' }}>vs {gap.company}</h3>
          
          {(gap.score_gap <= 0 && gap.technical_gap <= 0 && gap.behavioral_gap <= 0 && gap.hard_sessions_gap <= 0) ? (
            <div style={{ textAlign: 'center', color: '#2dd4a0', fontWeight: 'bold', padding: '1rem', background: 'rgba(45,212,160,0.1)', borderRadius: '8px' }}>
              ✓ You meet all {gap.company} requirements. You are ready to apply.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                  <span>Technical</span>
                  <span style={{ color: '#888' }}>
                    {(gap.technical_gap > 0 ? (gap.technical_gap + " pts to close") : "✓")}
                  </span>
                </div>
                {renderProgressBar(
                  Math.max(0, gap.threshold - gap.score_gap) / 10 - (gap.technical_gap > 0 ? gap.technical_gap : 0), 
                  (Math.max(0, gap.threshold - gap.score_gap) / 10 - (gap.technical_gap > 0 ? gap.technical_gap : 0)) + gap.technical_gap
                )}
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                  Required: {(Math.max(0, gap.threshold - gap.score_gap) / 10 - (gap.technical_gap > 0 ? gap.technical_gap : 0) + gap.technical_gap).toFixed(1)}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                  <span>Behavioral</span>
                  <span style={{ color: '#888' }}>
                    {(gap.behavioral_gap > 0 ? (gap.behavioral_gap + " pts to close") : "✓")}
                  </span>
                </div>
                {renderProgressBar(
                  Math.max(0, gap.threshold - gap.score_gap) / 10 - (gap.behavioral_gap > 0 ? gap.behavioral_gap : 0),
                  (Math.max(0, gap.threshold - gap.score_gap) / 10 - (gap.behavioral_gap > 0 ? gap.behavioral_gap : 0)) + gap.behavioral_gap
                )}
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                  Required: {(Math.max(0, gap.threshold - gap.score_gap) / 10 - (gap.behavioral_gap > 0 ? gap.behavioral_gap : 0) + gap.behavioral_gap).toFixed(1)}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                  <span>Hard Sessions</span>
                  <span style={{ color: '#888' }}>
                    {gap.hard_req - Math.max(0, gap.hard_sessions_gap)} of {gap.hard_req} completed
                  </span>
                </div>
              </div>

              {gap.score_gap > 0 && (
                <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#b06aff', background: 'rgba(176,106,255,0.1)', padding: '8px', borderRadius: '8px' }}>
                  ~{gap.estimated_sessions_to_ready} more sessions to reach the {gap.company} bar
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expand Toggle */}
      <button 
        onClick={() => setExpanded(!expanded)}
        style={{ background: 'transparent', border: 'none', color: '#b06aff', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', padding: '8px 16px', borderRadius: '8px' }}
      >
        See how this is calculated {expanded ? '▴' : '▾'}
      </button>

      {/* Breakdown Breakdown */}
      {expanded && (
        <div style={{ width: '100%', maxWidth: '600px', marginTop: '1.5rem', background: '#1a1a2a', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
            <span style={{ flex: '2' }}>Signal</span>
            <span style={{ flex: '1.5', textAlign: 'left' }}>Your Value</span>
            <span style={{ flex: '1', textAlign: 'center' }}>Weight</span>
            <span style={{ flex: '1.5', textAlign: 'right' }}>Contribution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.signals.map((sig, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ flex: '2', color: '#fff', fontWeight: '500' }}>{sig.name}</span>
                <span style={{ flex: '1.5', color: '#ccc' }}>{sig.value}</span>
                <span style={{ flex: '1', color: '#888', textAlign: 'center' }}>{sig.weight}</span>
                <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{Math.round(sig.contribution)} <span style={{ color: '#666', fontSize: '0.8em' }}>/ {sig.max}</span></span>
                  <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(sig.contribution / sig.max) * 100}%`, height: '100%', background: '#b06aff' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
