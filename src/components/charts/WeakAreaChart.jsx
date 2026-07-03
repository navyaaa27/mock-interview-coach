import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList
} from 'recharts';

const COLORS = [
  '#ff6b6b', '#ff786a', '#ff8669', '#ff9368', 
  '#ffa167', '#ffae66', '#ffbc65', '#ffcc60'
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: '#1a1a2a', border: '1px solid #2a2a4a', padding: '10px', color: '#e8e8e8', borderRadius: '4px' }}>
        <p style={{ margin: 0 }}>{data.name}</p>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Flagged: {data.count} times</p>
      </div>
    );
  }
  return null;
};

export default function WeakAreaChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Most Flagged Weak Areas</h2>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>Across your last 10 sessions</p>
        </div>
        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#2dd4a0', fontSize: '1.1rem', fontWeight: 'bold' }}>No weak areas flagged yet 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Most Flagged Weak Areas</h2>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>Across your last 10 sessions</p>
      </div>
      <div style={{ height: '240px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} width={120} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList dataKey="count" position="right" fill="#888" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
