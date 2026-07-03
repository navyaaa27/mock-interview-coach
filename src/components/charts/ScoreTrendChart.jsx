import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';

const CustomizedDot = (props) => {
  const { cx, cy, payload } = props;
  const score = payload.overall;
  let fill = '#ff6b6b'; // red
  if (score >= 7.5) fill = '#2dd4a0'; // green
  else if (score >= 5.0) fill = '#ffcc60'; // amber
  
  return (
    <circle cx={cx} cy={cy} r={5} stroke="none" fill={fill} />
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: '#1a1a2a', border: '1px solid #2a2a4a', padding: '10px', color: '#e8e8e8', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: 0 }}>Score: {data.overall}</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Type: {data.type?.replace('_', ' ')}</p>
      </div>
    );
  }
  return null;
};

export default function ScoreTrendChart({ data }) {
  const rollingData = (data || []).map((d, i) => ({
    ...d,
    rolling: i < 2 ? d.overall :
      Math.round((data.slice(i-2, i+1).reduce((s, x) => s + x.overall, 0) / 3) * 10) / 10
  }));

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Score Trend</h2>
        <span style={{ background: '#333', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#ccc' }}>
          {data?.length || 0} sessions
        </span>
      </div>
      <div style={{ height: '280px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rollingData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
            <YAxis domain={[0, 10]} tickCount={6} stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={8.0} label={{ position: 'top', value: 'Interview Ready', fill: '#2dd4a0', fontSize: 12 }} stroke="#2dd4a0" strokeDasharray="4 4" />
            <ReferenceLine y={6.0} label={{ position: 'top', value: 'Getting there', fill: '#ffcc60', fontSize: 12 }} stroke="#ffcc60" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="rolling" stroke="#b06aff" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="overall" stroke="#60cfff" strokeWidth={2} dot={<CustomizedDot />} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
