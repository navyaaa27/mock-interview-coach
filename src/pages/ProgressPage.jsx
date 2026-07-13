import React from 'react';
import { useProgressData } from '../hooks/useProgressData';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ProgressSkeleton() {
  return (
    <div className="progress-skeleton-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
          .skel-box {
            background-color: #333; /* Dark grey */
            border-radius: 12px;
            width: 100%;
          }
        `}
      </style>
      <div className="skel-box" style={{ height: '200px' }}></div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div className="skel-box" style={{ height: '150px', flex: 1 }}></div>
        <div className="skel-box" style={{ height: '150px', flex: 1 }}></div>
      </div>
      <div className="skel-box" style={{ height: '300px' }}></div>
      <div className="skel-box" style={{ height: '250px' }}></div>
    </div>
  );
}

function ProgressEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="progress-empty-state" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      textAlign: 'center',
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        {/* Abstract Illustration Placeholder */}
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" stroke="#4F46E5" strokeWidth="4" strokeDasharray="10 10" />
          <path d="M70 120 L100 90 L130 110 L160 70" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="70" cy="120" r="6" fill="#10B981" />
          <circle cx="100" cy="90" r="6" fill="#10B981" />
          <circle cx="130" cy="110" r="6" fill="#10B981" />
          <circle cx="160" cy="70" r="6" fill="#10B981" />
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Complete 3 sessions to unlock your progress analytics</h2>
      <p style={{ color: '#9CA3AF', marginBottom: '2rem', maxWidth: '400px' }}>
        We need a bit more data to show you meaningful trends and insights about your interview performance.
      </p>
      <button 
        onClick={() => navigate('/setup')}
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 2rem',
          borderRadius: '9999px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
          transition: 'all 0.2s ease-in-out'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Start Interview →
      </button>
    </div>
  );
}

import ScoreTrendChart from '../components/charts/ScoreTrendChart';
import SkillRadarChart from '../components/charts/SkillRadarChart';
import WeakAreaChart from '../components/charts/WeakAreaChart';
import TypeBreakdownChart from '../components/charts/TypeBreakdownChart';
import DeliveryTrendChart from '../components/charts/DeliveryTrendChart';
import StudyPlan from '../components/StudyPlan/StudyPlan';
import ReadinessScore from '../components/ReadinessScore/ReadinessScore';
import EmptyState from '../components/EmptyState/EmptyState';

export default function ProgressPage() {
  const { currentUser } = useAuth();
  const { data, loading, error } = useProgressData(currentUser?.id);
  const navigate = useNavigate();

  if (loading) return <ProgressSkeleton />;
  if (error) return <div style={{ color: 'red', padding: '2rem' }}>Error loading data: {error.message}</div>;
  
  if (!data?.sessionChartData?.length || data.sessionChartData.length < 3) {
    return (
      <div className="progress-page" style={{ padding: '2rem', color: '#fff', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', margin: '0 0 2rem 0' }}>Progress Analytics</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
          <ReadinessScore />
          <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <EmptyState
              message="Three sessions in and the pattern starts to show. You're not there yet."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page" style={{ padding: '2rem', color: '#fff', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 2rem 0' }}>Progress Analytics</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', marginBottom: '2rem', alignItems: 'start' }}>
        {/* Left Column */}
        <div>
          <ReadinessScore />
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '16px', marginTop: '-1rem' }}>
            <TypeBreakdownChart data={data.typeData} />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '16px' }}>
            <ScoreTrendChart data={data.sessionChartData} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: '#111', padding: '1.5rem', borderRadius: '16px' }}>
              <SkillRadarChart data={data.sessionChartData} />
            </div>
            <div style={{ background: '#111', padding: '1.5rem', borderRadius: '16px' }}>
              <WeakAreaChart data={data.weakAreaData} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ background: '#111', padding: '1.5rem', borderRadius: '16px' }}>
          <DeliveryTrendChart data={data.sessionChartData} />
        </div>
      </div>

      <StudyPlan studyPlanData={data.studyPlan} />
    </div>
  );
}
