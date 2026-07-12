import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useDashboardData } from '../hooks/useDashboardData';
import ReadinessDial from '../components/ReadinessDial/ReadinessDial';
import './DashboardPage.css';

/* ── Tier logic (kept exactly as in the legacy app) ── */
function getReadinessTier(score) {
  if (score >= 85) return { label: 'Interview ready 🎯', color: '#2dd4a0' };
  if (score >= 75) return { label: 'Strong candidate', color: '#2dd4a0' };
  if (score >= 60) return { label: 'Getting interview-ready', color: '#60cfff' };
  if (score >= 40) return { label: 'Building foundations', color: '#ffcc60' };
  return { label: 'Just getting started', color: '#666666' };
}

/* ── Avatar dropdown ── */
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

/* ── Score Trend Chart (recharts port) ── */
function ScoreTrendSection({ trendData }) {
  if (!trendData || trendData.length < 2) {
    return (
      <div className="dash-card dash-chart-container">
        <div className="dash-chart-title">
          <i className="fa-solid fa-chart-line" style={{ color: '#4fc3f7' }} /> Score Trend
        </div>
        <div className="dash-chart-empty">
          <i className="fa-solid fa-chart-line" style={{ fontSize: 28, opacity: 0.2 }} />
          <div>Complete at least 3 sessions to see your score trend</div>
        </div>
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

  // Populate interview date from profile data
  useEffect(() => {
    if (data?.profile?.interview_date) {
      setInterviewDate(data.profile.interview_date);
    }
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
    // Navigate to session page with the setup hash
    navigate('/#setup');
    window.location.href = '/#setup';
  }, [navigate]);

  const handleQuickStart = useCallback((type) => {
    window.location.href = `/index-legacy.html#setup?type=${type}`;
  }, []);

  // Greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const fullName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User';
  const firstName = fullName.split(' ')[0];
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  // Readiness
  const score = data?.readinessScore ?? 0;
  const { label: tierLabel } = getReadinessTier(score);

  // Streak
  const profile = data?.profile || {};
  const currentStreak = profile.current_streak || 0;
  const longestStreak = profile.longest_streak || 0;
  const hasFreeze = profile.streak_freeze_available !== false;
  const isNewPB = currentStreak > 0 && currentStreak > longestStreak;

  // Streak warning
  const today = new Date().toISOString().split('T')[0];
  const showStreakWarning = !!(profile.last_session_date && currentStreak > 0 && profile.last_session_date < today && hour >= 18);

  // Storage warning
  const showStorageWarning = (data?.sessionCount || 0) >= 15;

  // Countdown
  let countdownText = 'No interview date set';
  let countdownColor = 'var(--text-secondary, #999)';
  if (interviewDate) {
    const interviewDt = new Date(interviewDate + 'T00:00:00');
    const todayDt = new Date(); todayDt.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((interviewDt - todayDt) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) { countdownText = 'Interview date passed'; }
    else if (diffDays <= 3) { countdownText = `⚡ ${diffDays} day${diffDays !== 1 ? 's' : ''} left — practice today`; countdownColor = '#f87171'; }
    else {
      const firstCompany = (profile.target_companies || [])[0] || 'your';
      countdownText = `${diffDays} days until your ${firstCompany} interview`;
      countdownColor = '#a78bfa';
    }
  }

  // Last session
  const lss = data?.lastSessionStats;
  let lsScoreColor = '#ef4444';
  if (lss?.avg >= 7.5) lsScoreColor = '#4ade80';
  else if (lss?.avg >= 5) lsScoreColor = '#f59e0b';

  // Suggestion
  const suggestion = data?.suggestion;

  if (loading) {
    return (
      <div className="dash-page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: 0.4 }}>
          {[280, 100, 88, 88, 200].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 12, background: '#141414' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">

      {/* ZONE 1: Header */}
      <div className="dash-header-row">
        <div>
          <p className="dash-eyebrow">WORKSPACE DASHBOARD</p>
          <h1 className="dash-greeting">{timeGreeting}, <span style={{ color: 'inherit' }}>{firstName}</span></h1>
          <p className="dash-sub">Here's your practice overview for today.</p>
        </div>
        <AvatarMenu initials={initials} onSignOut={handleSignOut} onProfile={() => navigate('/progress')} />
      </div>

      {/* ZONE 1.5: Start Interview CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <button className="btn-start-interview" onClick={handleStartInterview} id="dash-start-btn">
          <i className="fa-solid fa-circle-play" style={{ fontSize: 48 }} />
          <div style={{ flex: 1 }}>
            <div className="cta-title">START NEW INTERVIEW</div>
            <div className="cta-sub">Behavioral, technical, DSA or system design.</div>
          </div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: 24, opacity: 0.7 }} />
        </button>
      </div>

      {/* Quick-start chips */}
      <div className="quickstart-chips">
        <button className="quickstart-chip" onClick={() => handleQuickStart('behavioral')}>💬 Behavioral</button>
        <button className="quickstart-chip" onClick={() => handleQuickStart('technical')}>💻 Technical</button>
        <button className="quickstart-chip" onClick={() => handleQuickStart('system_design')}>🏗️ System Design</button>
        <button className="quickstart-chip" onClick={() => handleQuickStart('hr')}>🤝 HR</button>
      </div>

      {/* Warning banners */}
      {showStreakWarning && (
        <div className="dash-warning streak">
          <i className="fa-solid fa-bolt" style={{ fontSize: 16, color: '#f87171' }} />
          <span>⚡ Your {currentStreak}-day streak ends at midnight. Practice now to keep it alive.</span>
        </div>
      )}
      {showStorageWarning && (
        <div className="dash-warning storage">
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 16 }} />
          <span>Your storage is getting full. Older sessions may be automatically cleaned up.</span>
        </div>
      )}

      {/* ZONE 2: Widgets row */}
      <div className="dash-widgets-row">

        {/* D.02: Readiness Dial — hero element replacing the boxed card */}
        <div className="dash-card dash-readiness-widget" onClick={() => navigate('/progress')} role="button" aria-label="View readiness details" id="dash-readiness-widget">
          <ReadinessDial score={score} tierLabel={tierLabel} />
          <a className="dash-readiness-link" href="/progress" onClick={e => { e.preventDefault(); navigate('/progress'); }}>
            Interview Readiness <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
          </a>
        </div>

        {/* Streak widget */}
        <div className="dash-card dash-streak-widget" id="dash-streak-widget">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40, textShadow: '0 0 20px rgba(245,158,11,0.5)' }}>🔥</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }} id="dash-streak-count">
                {currentStreak === 0 ? '0 day streak' : `${currentStreak} day streak`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary, #999)', marginTop: 4 }} id="dash-streak-sub">
                {currentStreak === 0 ? 'Start your streak today →' : `Longest: ${longestStreak} days 🔥`}
              </div>
              {hasFreeze && (
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.15)', padding: '2px 8px', borderRadius: 12, display: 'inline-block' }}>
                  <i className="fa-solid fa-snowflake" style={{ marginRight: 4 }} /> Freeze available
                </div>
              )}
            </div>
          </div>
          {isNewPB && (
            <div style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              🎉 New personal best!
            </div>
          )}
        </div>

        {/* Countdown widget */}
        <div className="dash-card dash-countdown-widget" id="dash-countdown-widget">
          <i className="fa-solid fa-calendar-day" style={{ fontSize: 24, color: '#a78bfa' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: countdownColor }}>{countdownText}</div>
            <input
              type="date"
              className="dash-countdown-input"
              value={interviewDate}
              onChange={e => handleSaveInterviewDate(e.target.value)}
              id="dash-interview-date"
            />
          </div>
        </div>
      </div>

      {/* ZONE 3: Stats Row */}
      <div className="dash-stats-row">
        <div className="dash-card dash-stat-card">
          <div className="dash-stat-value" id="dash-sessions-count">{data?.sessionCount ?? '—'}</div>
          <div className="dash-stat-label">Sessions Completed</div>
        </div>
        <div className="dash-card dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#4fc3f7' }} id="dash-avg-score">
            {data?.sessionCount ? data.avgScore.toFixed(1) : '—'}
          </div>
          <div className="dash-stat-label">Average Score</div>
        </div>
        <div className="dash-card dash-stat-card">
          <div className="dash-stat-value" style={{ color: '#4ade80' }} id="dash-best-score">
            {data?.sessionCount ? data.bestScore.toFixed(1) : '—'}
          </div>
          <div className="dash-stat-label">Best Score</div>
        </div>
        <div className="dash-card dash-stat-card">
          <div className="dash-stat-value" id="dash-hours">{data?.hoursStr ?? '0'}</div>
          <div className="dash-stat-label">Hours Practiced</div>
        </div>
      </div>

      {/* ZONE 4: Score Trend */}
      <ScoreTrendSection trendData={data?.trendData} />

      {/* ZONE 5: Two-column */}
      <div className="dash-two-col">

        {/* Smart Suggestion */}
        <div className="dash-card dash-suggestion-card" id="dash-suggestion-card">
          {suggestion ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ fontSize: 28, minWidth: 36, textAlign: 'center' }}>{suggestion.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="dash-suggestion-label">Smart Suggestion</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary, #999)', lineHeight: 1.5 }}>{suggestion.text}</div>
                <button
                  id="dash-suggestion-btn"
                  onClick={() => handleQuickStart(suggestion.type)}
                  style={{
                    marginTop: 12, padding: '8px 16px', fontSize: 12,
                    background: 'linear-gradient(135deg, var(--accent-ember, #ff7a45), var(--accent-blue, #4fc3f7))',
                    border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Start this session <i className="fa-solid fa-arrow-right" style={{ marginLeft: 4 }} />
                </button>
              </div>
            </div>
          ) : (
            <div className="dash-empty-state">
              <i className="fa-solid fa-lightbulb" style={{ fontSize: 24, opacity: 0.2 }} />
              <div>No suggestion yet — complete a session first.</div>
            </div>
          )}
        </div>

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
              <i className="fa-solid fa-folder-open" style={{ fontSize: 24, opacity: 0.2 }} />
              <div>No sessions yet — start your first one!</div>
              <button
                onClick={handleStartInterview}
                style={{ marginTop: 8, padding: '8px 20px', fontSize: 13, background: 'transparent', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
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
