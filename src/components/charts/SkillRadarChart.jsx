import React from 'react';
import {
  ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Legend
} from 'recharts';

export default function SkillRadarChart({ data }) {
  // Use last 5 sessions for the average
  const recentSessions = (data || []).slice(-5);
  
  const avg = (key, divisor = 1) => {
    if (!recentSessions.length) return 0;
    const sum = recentSessions.reduce((s, x) => s + (x[key] || 0), 0);
    return Math.round((sum / recentSessions.length / divisor) * 10) / 10;
  };

  const radarData = [
    { subject: 'Clarity', A: avg('clarity'), fullMark: 10 },
    { subject: 'Depth', A: avg('depth'), fullMark: 10 },
    { subject: 'Structure', A: avg('structure'), fullMark: 10 },
    { subject: 'Delivery', A: avg('pace', 25), fullMark: 10 }, // Assuming ~250 is max pace, dividing by 25 makes it 0-10
    { subject: 'Eye Contact', A: avg('eyeContact', 10), fullMark: 10 } // Eye contact is 0-100, dividing by 10 makes it 0-10
  ];

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Skill Breakdown</h2>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>Last {recentSessions.length} sessions average</p>
      </div>
      <div style={{ height: '280px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
            
            {/* Target Radar */}
            <Radar
              name="Target"
              dataKey={() => 8.0}
              stroke="#2dd4a0"
              strokeDasharray="3 3"
              fill="transparent"
            />
            
            {/* User Radar */}
            <Radar
              name="Your average"
              dataKey="A"
              stroke="#60cfff"
              fill="rgba(96,207,255,0.15)"
            />
            
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
