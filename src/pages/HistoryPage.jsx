import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHistoryData } from '../hooks/useHistoryData';
import ScoreTrendChart from '../components/charts/ScoreTrendChart';
import EmptyState from '../components/EmptyState/EmptyState';
import './HistoryPage.css';

/* ── Colour helpers ─────────────────────────────────────────────────────── */
function scoreColor(v) {
  if (v >= 7.5) return '#2dd4a0';
  if (v >= 5)   return '#f59e0b';
  return '#ef4444';
}
const TYPE_COLORS  = { behavioral: '#4fc3f7', technical: '#a78bfa', system_design: '#f59e0b', hr: '#4ade80' };
const DIFF_COLORS  = { easy: '#4ade80', medium: '#f59e0b', hard: '#ef4444' };
const TYPE_LABELS  = { behavioral: 'Behavioral', technical: 'Technical', system_design: 'System Design', hr: 'HR' };

/* ── Skeleton while loading ─────────────────────────────────────────────── */
function HistorySkeleton() {
  return (
    <div className="hist-skeleton">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div className="hist-skel-row">
        {[1,2,3,4].map(i => <div key={i} className="hist-skel-stat" />)}
      </div>
      <div className="hist-skel-bar" />
      {[1,2,3].map(i => <div key={i} className="hist-skel-card" />)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function HistoryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { sessions, profile, loading, error } = useHistoryData(currentUser?.id);

  // ── Filter state ───────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // ── Derived data ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...sessions];
    if (typeFilter !== 'all') list = list.filter(s => s.interview_type === typeFilter);
    if (diffFilter !== 'all') list = list.filter(s => s.difficulty === diffFilter);
    if (dateFilter !== 'all') {
      const now = Date.now();
      list = list.filter(s => {
        const age = now - new Date(s.created_at).getTime();
        if (dateFilter === 'week')  return age < 7  * 86400000;
        if (dateFilter === 'month') return age < 30 * 86400000;
        return true;
      });
    }
    return list;
  }, [sessions, typeFilter, diffFilter, dateFilter]);

  const stats = useMemo(() => {
    let total = 0, count = 0, best = 0;
    sessions.forEach(s => {
      if (s.avgOverall > 0) { total += s.avgOverall; count++; }
      if (s.avgOverall > best) best = s.avgOverall;
    });
    return {
      totalSessions: sessions.length,
      avgScore: count > 0 ? (total / count).toFixed(1) : '—',
      bestScore: best > 0 ? best.toFixed(1) : '—',
      streak: profile?.current_streak || 0,
    };
  }, [sessions, profile]);

  // ScoreTrendChart expects { date, overall, type }
  const trendData = useMemo(() => {
    return [...filtered].reverse().map(s => ({
      date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overall: Number(s.avgOverall.toFixed(1)),
      type: s.interview_type,
    }));
  }, [filtered]);

  // ── Loading / Error / Empty ────────────────────────────────────────────
  if (loading) return <div className="hist-page"><HistorySkeleton /></div>;
  if (error)   return <div className="hist-page"><p style={{ color: '#f87171' }}>Error loading history.</p></div>;
  if (sessions.length === 0) {
    return (
      <div className="hist-page">
        <h1 className="hist-heading">Session History</h1>
        <EmptyState message="Your interview history starts the moment you finish your first one." />
      </div>
    );
  }

  return (
    <div className="hist-page">
      {/* ── Page title ─────────────────────────────────────────────────── */}
      <h1 className="hist-heading">Session History</h1>

      {/* ── SECTION 1: Summary bar ─────────────────────────────────────── */}
      <div className="hist-stats-row">
        <div className="hist-stat-card">
          <div className="hist-stat-label">Total Sessions</div>
          <div className="hist-stat-value">{stats.totalSessions}</div>
        </div>
        <div className="hist-stat-card">
          <div className="hist-stat-label">Average Score</div>
          <div className="hist-stat-value">{stats.avgScore}</div>
        </div>
        <div className="hist-stat-card">
          <div className="hist-stat-label">Best Score</div>
          <div className="hist-stat-value" style={{ color: '#2dd4a0' }}>{stats.bestScore}</div>
        </div>
        <div className="hist-stat-card">
          <div className="hist-stat-label">Current Streak</div>
          <div className="hist-stat-value" style={{ color: '#f59e0b' }}>
            {stats.streak} <i className="fa-solid fa-fire" style={{ fontSize: 18 }} />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Filter bar ──────────────────────────────────────── */}
      <div className="hist-filter-row">
        <select className="hist-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="behavioral">Behavioral</option>
          <option value="technical">Technical</option>
          <option value="system_design">System Design</option>
          <option value="hr">HR</option>
        </select>
        <select className="hist-select" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select className="hist-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* ── SECTION 3: Session cards ───────────────────────────────────── */}
      <div className="hist-session-list">
        {filtered.length === 0 ? (
          <div className="hist-no-match">No sessions match your filters.</div>
        ) : (
          filtered.map(s => {
            const date   = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const sc     = scoreColor(s.avgOverall);
            const tColor = TYPE_COLORS[s.interview_type]  || '#4fc3f7';
            const dColor = DIFF_COLORS[s.difficulty]       || '#4ade80';
            const company = s.target_company || 'General';

            return (
              <div key={s.id} className="hist-card">
                {/* Left — date / duration / chips */}
                <div className="hist-card-left">
                  <div className="hist-card-date">{date}</div>
                  <div className="hist-card-dur"><i className="fa-regular fa-clock" /> {s.durationStr}</div>
                  <div className="hist-chip-row">
                    <span className="hist-chip" style={{ color: tColor, background: `${tColor}18` }}>
                      {TYPE_LABELS[s.interview_type] || s.interview_type}
                    </span>
                    <span className="hist-chip" style={{ color: dColor, background: `${dColor}18` }}>
                      {s.difficulty}
                    </span>
                  </div>
                </div>

                {/* Centre — company, role, sub-scores */}
                <div className="hist-card-centre">
                  <div className="hist-card-company">{company}</div>
                  <div className="hist-card-role">{s.job_role || 'Software Engineer'}</div>
                  <div className="hist-sub-scores">
                    <span><strong>C</strong> {s.avgClarity.toFixed(1)}</span>
                    <span><strong>D</strong> {s.avgDepth.toFixed(1)}</span>
                    <span><strong>S</strong> {s.avgStructure.toFixed(1)}</span>
                  </div>
                </div>

                {/* Score ring */}
                <div className="hist-card-score" style={{ '--ring': sc }}>
                  {s.avgOverall.toFixed(1)}
                </div>

                {/* Right — buttons & difficulty progression */}
                <div className="hist-card-right">
                  <button className="hist-btn" onClick={() => navigate(`/replay/${s.id}`)}>
                    View Report <i className="fa-solid fa-arrow-right" />
                  </button>
                  <button className="hist-btn blue" onClick={() => navigate(`/replay/${s.id}`)}>
                    <i className="fa-solid fa-play" style={{ marginRight: 4 }} /> Replay
                  </button>
                  {s.difficulty_history?.length > 0 && (
                    <div className="hist-diff-prog">
                      {s.difficulty_history.map((d, i) => {
                        const dc = DIFF_COLORS[d] || '#4fc3f7';
                        return (
                          <React.Fragment key={i}>
                            {i > 0 && <i className="fa-solid fa-caret-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }} />}
                            <span className="hist-chip-tiny" style={{ color: dc, background: `${dc}18` }}>{d}</span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── SECTION 4: Score trend chart ────────────────────────────────── */}
      {trendData.length >= 2 && (
        <div className="hist-chart-wrap">
          <ScoreTrendChart data={trendData} />
        </div>
      )}
    </div>
  );
}
