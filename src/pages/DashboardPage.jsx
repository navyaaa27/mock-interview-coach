import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useDashboardData } from '../hooks/useDashboardData';
import DashboardHero from '../components/DashboardHero/DashboardHero';
import StatStrip from '../components/StatStrip/StatStrip';
import CoachCard from '../components/CoachCard/CoachCard';
import EmptyState from '../components/EmptyState/EmptyState';
import './DashboardPage.css';

/* ── Tier logic (kept exactly as in the legacy app) ── */
function getReadinessTier(score) {
  if (score >= 85) return { label: 'Interview ready 🎯', color: '#2dd4a0' };
  if (score >= 75) return { label: 'Strong candidate', color: '#2dd4a0' };
  if (score >= 60) return { label: 'Getting interview-ready', color: '#60cfff' };
  if (score >= 40) return { label: 'Building foundations', color: '#ffcc60' };
  return { label: 'Just getting started', color: '#666666' };
}

/* ── Avatar dropdown (kept for sign-out access) ── */
function AvatarMenu({ initials, onSignOut, onProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className="dash-avatar" onClick={() => setOpen(o => !o)} role="button" aria-label="User menu">
        {initials}
      </div>
      {open && (
        <div className="dash-avatar-dropdown">
          <button onClick={() => { setOpen(false); onProfile(); }}>
            <i className="fa-solid fa-user-gear" /> Profile Settings
          </button>
          <button className="danger" onClick={() => { setOpen(false); onSignOut(); }}>
            <i className="fa-solid fa-right-from-bracket" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Score Trend Chart ── */
function ScoreTrendSection({ trendData }) {
  if (!trendData || trendData.length < 2) {
    return (
      <div className="dash-card dash-chart-container">
        <div className="dash-chart-title">
          <i className="fa-solid fa-chart-line" style={{ color: '#4fc3f7' }} /> Score Trend
        </div>
        <EmptyState
          message="Three sessions in and the pattern starts to show. You're not there yet."
        />
      </div>
    );
  }

  const withRolling = trendData.map((d, i) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rolling: i >= 2 ? (trendData[i].avg + trendData[i - 1].avg + trendData[i - 2].avg) / 3 : null,
  }));

  return (
    <div className="dash-card dash-chart-container">
      <div className="dash-chart-title">
        <i className="fa-solid fa-chart-line" style={{ color: '#4fc3f7' }} /> Score Trend
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={withRolling} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'rgba(0,0,0,0.85)', border: 'none', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#4fc3f7' }}
            formatter={(v, name) => [v ? v.toFixed(1) : '—', name]}
          />
          <Line type="monotone" dataKey="avg" stroke="#4fc3f7" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#4fc3f7', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Score" />
          <Line type="monotone" dataKey="rolling" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="3-Session Avg" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Main DashboardPage ── */
export default function DashboardPage() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useDashboardData(currentUser?.id);

  const [interviewDate, setInterviewDate] = useState('');
  const [selectedType, setSelectedType] = useState('behavioral');

  useEffect(() => {
    if (data?.profile?.interview_date) setInterviewDate(data.profile.interview_date);
  }, [data]);

  const handleSaveInterviewDate = useCallback(async (value) => {
    setInterviewDate(value);
    await supabase.from('profiles').update({ interview_date: value || null }).eq('user_id', currentUser.id);
  }, [currentUser]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  const handleStartInterview = useCallback(() => {
    // Navigate to the legacy session setup — stays as-is per the port spec
    window.location.href = `/?type=${selectedType}#setup`;
  }, [selectedType]);

  const handleQuickStart = useCallback((type) => {
    window.location.href = `/?type=${type}#setup`;
  }, []);

  // User identifiers
  const fullName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  // Data
  const score   = data?.readinessScore ?? 0;
  const profile = data?.profile || {};

  // Storage warning
  const showStorageWarning = (data?.sessionCount || 0) >= 15;

  // Last session
  const lss = data?.lastSessionStats;
  let lsScoreColor = '#ef4444';
  if (lss?.avg >= 7.5) lsScoreColor = '#4ade80';
  else if (lss?.avg >= 5) lsScoreColor = '#f59e0b';

  // Suggestion
  const suggestion = data?.suggestion;

  // Skeleton while loading
  if (loading) {
    return (
      <div className="dash-page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity: 0.35 }}>
          <div style={{ height: 260, borderRadius: 12, background: '#141414' }} />
          <div style={{ height: 88,  borderRadius: 12, background: '#141414' }} />
          <div style={{ height: 200, borderRadius: 12, background: '#141414' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">

      {/* Top-right avatar (sign-out access) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <AvatarMenu
          initials={initials}
          onSignOut={handleSignOut}
          onProfile={() => navigate('/progress')}
        />
      </div>

      {/* D.03 — Hero: dial + narrative + CTA + type tabs + inline strip */}
      <DashboardHero
        user={{
          readiness_score: score,
          current_streak:  profile.current_streak  ?? 0,
          longest_streak:  profile.longest_streak  ?? 0,
          email:           currentUser?.email,
        }}
        profile={{
          full_name:        fullName,
          target_companies: profile.target_companies || [],
        }}
        onStartInterview={handleStartInterview}
        onSelectType={type => { setSelectedType(type); }}
        selectedType={selectedType}
        interviewDate={interviewDate}
        onDateChange={handleSaveInterviewDate}
      />

      {/* Storage warning (only when near limit) */}
      {showStorageWarning && (
        <div className="dash-warning storage" style={{ marginBottom: 24 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 16 }} />
          <span>Your storage is getting full. Older sessions may be automatically cleaned up.</span>
        </div>
      )}

      {/* D.03 — StatStrip: one connected row, hairline-divided */}
      <StatStrip
        sessionsCompleted={data?.sessionCount}
        avgScore={data?.sessionCount ? data.avgScore : null}
        bestScore={data?.sessionCount ? data.bestScore : null}
        hoursPracticed={data?.hoursStr}
      />

      {/* Score Trend Chart */}
      <ScoreTrendSection trendData={data?.trendData} />

      {/* Two-column: Suggestion + Last Session */}
      <div className="dash-two-col">

        {/* D.04 — CoachCard replaces generic Smart Suggestion box */}
        <CoachCard
          suggestion={suggestion}
          onStartSession={(type, difficulty) => handleQuickStart(type)}
        />

        {/* Last Session Summary */}
        <div className="dash-card dash-last-session-card" id="dash-last-session-card">
          {lss ? (
            <>
              <div className="dash-last-session-header">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #666)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Last Session</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {(lss.session.interview_type || 'behavioral').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #999)', marginTop: 2 }}>
                    {new Date(lss.session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="dash-last-session-score" style={{ border: `3px solid ${lsScoreColor}44`, color: lsScoreColor }}>
                  {lss.avg.toFixed(1)}
                </div>
              </div>
              {lss.improvements.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #999)', lineHeight: 1.6, marginBottom: 14 }}>
                  {lss.improvements.map((imp, i) => (
                    <span key={i} style={{ display: 'inline-block', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '2px 8px', borderRadius: 8, fontSize: 11, marginRight: 4 }}>
                      ↑ {imp}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="dash-action-btn" onClick={() => navigate(`/session/${lss.session.id}`)}>
                  View Report <i className="fa-solid fa-arrow-right" />
                </button>
                <button className="dash-action-btn blue" onClick={() => navigate(`/?replay=${lss.session.id}`)}>
                  <i className="fa-solid fa-play" style={{ marginRight: 4 }} /> Replay
                </button>
              </div>
            </>
          ) : (
            <div className="dash-empty-state">
              <EmptyState
                message="Your interview history starts the moment you finish your first one."
              />
              <button
                onClick={handleStartInterview}
                style={{ marginTop: 16, padding: '8px 20px', fontSize: 13, background: 'transparent', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Start Interview →
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
