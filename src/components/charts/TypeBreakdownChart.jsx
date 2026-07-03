import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell
} from 'recharts';

const TYPE_COLORS = {
  'behavioral': '#60cfff',
  'technical': '#b06aff',
  'system design': '#ffcc60',
  'hr': '#2dd4a0'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: '#1a1a2a', border: '1px solid #2a2a4a', padding: '10px', color: '#e8e8e8', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontWeight: 'bold', textTransform: 'capitalize' }}>{data.type}</p>
        <p style={{ margin: 0 }}>Average Score: {data.avg}</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>Based on {data.sessions} session(s)</p>
      </div>
    );
  }
  return null;
};

export default function TypeBreakdownChart({ data }) {
  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Performance by Interview Type</h2>
      </div>
      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
            <XAxis dataKey="type" stroke="#888" tick={{ fill: '#888', fontSize: 12, textTransform: 'capitalize' }} />
            <YAxis domain={[0, 10]} stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <ReferenceLine y={7.5} stroke="#aaa" strokeDasharray="3 3" />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => {
                const color = TYPE_COLORS[entry.type.toLowerCase()] || '#60cfff';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
