import React, { useState, useEffect } from 'react';
import { recalculateReadiness } from '../../lib/readinessService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ReadinessScore() {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Fetch the last updated time from DB
      const { data: user } = await supabase
        .from('users')
        .select('readiness_updated_at')
        .eq('id', currentUser.id)
        .maybeSingle();
        
      if (user?.readiness_updated_at) {
        setUpdatedAt(new Date(user.readiness_updated_at));
      } else {
        setUpdatedAt(new Date()); // fallback
      }

      // Calculate score and breakdown on the fly (without saving to DB)
      const res = await recalculateReadiness(currentUser.id, false);
      setData(res);
      setLoading(false);
    }
    if (currentUser?.id) loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ color: '#888' }}>Calculating Readiness Score...</div>
      </div>
    );
  }

  if (!data) return null;

  const score = data.score;
  let label = "Just getting started";
  let color = "#666666";
  let glow = "none";

  if (score >= 85) {
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

  // Circular progress math
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

  return (
    <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
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
              filter: score >= 85 ? 'drop-shadow(0px 0px 8px rgba(45,212,160,0.5))' : 'none'
            }}
          />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', textShadow: glow }}>{score}</span>
        </div>
      </div>

      <h2 style={{ margin: '0 0 8px 0', color: color, fontSize: '1.5rem', textShadow: glow }}>{label}</h2>
      <p style={{ margin: '0 0 16px 0', color: '#888', fontSize: '0.875rem' }}>Updated {timeAgo}</p>

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
