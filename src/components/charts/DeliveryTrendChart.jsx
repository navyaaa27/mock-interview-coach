import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, CartesianGrid, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1a2a', border: '1px solid #2a2a4a', padding: '10px', color: '#e8e8e8', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Session {label}</p>
        <p style={{ margin: 0, color: '#ffcc60' }}>Pace: {payload[0]?.value} WPM</p>
        <p style={{ margin: 0, color: '#2dd4a0' }}>Eye Contact: {payload[1]?.value}%</p>
      </div>
    );
  }
  return null;
};

export default function DeliveryTrendChart({ data }) {
  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Delivery Over Time</h2>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>Pace and Eye Contact Trends</p>
      </div>
      <div style={{ height: '240px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="session" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
            
            {/* Left Y-Axis for Pace */}
            <YAxis yAxisId="left" domain={[0, 250]} stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
            
            {/* Right Y-Axis for Eye Contact */}
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference Area on the left axis for Ideal Pace */}
            <ReferenceArea yAxisId="left" y1={130} y2={170} fill="rgba(45,212,160,0.06)" strokeOpacity={0} />
            
            {/* Need to position label manually or using ReferenceLine if ReferenceArea label is clunky, but standard Recharts ReferenceArea supports label */}
            <ReferenceArea yAxisId="left" y1={130} y2={170} fill="none" label={{ position: 'insideTopLeft', value: 'Ideal pace', fill: '#2dd4a0', fontSize: 12, opacity: 0.5 }} />

            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line yAxisId="left" name="Pace (WPM)" type="monotone" dataKey="pace" stroke="#ffcc60" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line yAxisId="right" name="Eye Contact (%)" type="monotone" dataKey="eyeContact" stroke="#2dd4a0" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
