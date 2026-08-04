import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHistoryData } from '../hooks/useHistoryData';
import EmptyState from '../components/EmptyState/EmptyState';
import './HistoryPage.css';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function scoreColor(v) {
  if (v >= 7.5) return '#2dd4a0';
  if (v >= 5)   return '#f59e0b';
  return '#ef4444';
}

const TYPE_COLORS  = { behavioral: '#4fc3f7', technical: '#a78bfa', system_design: '#f59e0b', hr: '#4ade80' };
const DIFF_COLORS  = { easy: '#4ade80', medium: '#f59e0b', hard: '#ef4444' };
const TYPE_LABELS  = { behavioral: 'Behavioral', technical: 'Technical', system_design: 'System Design', hr: 'HR' };

/* ── Circular SVG score gauge ────────────────────────────────────────────── */
function ScoreGauge({ score }) {
  const color  = scoreColor(score);
  const radius = 28;
  const circ   = 2 * Math.PI * radius;
  const filled = (score / 10) * circ;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ flexShrink: 0 }}>
      <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <circle
        cx="38" cy="38" r={radius} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="44" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700" fontFamily="inherit">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

/* ── Alex's motivational note ────────────────────────────────────────────── */
function AlexNote({ sessions, bestScore }) {
  const lastSess = sessions[0];
  let note = "Complete your first interview and Alex will have something to say.";

  if (sessions.length >= 1 && lastSess) {
    const dur      = lastSess.durationStr;
    const scoreVal = lastSess.avgOverall.toFixed(1);
    const isBest   = scoreVal === bestScore;

    if (sessions.length === 1) {
      note = `First one's done. ${dur}, ${scoreVal} — that's your baseline. Everything from here is progress.`;
    } else if (isBest) {
      note = `${sessions.length} sessions in. Your last one — ${dur}, full effort — landed at ${scoreVal}, your best score yet. That's not luck. That's the session before it, and the one before that, doing their job.`;
    } else if (lastSess.avgOverall >= 7) {
      note = `${sessions.length} sessions in and you're finding your rhythm. ${scoreVal} last time out. Keep pushing — the ceiling is higher than you think.`;
    } else {
      note = `${sessions.length} sessions in. Last one clocked at ${scoreVal}. The work's happening — you just can't always see it yet. Show up again.`;
    }
  }

  // Bold the score numbers
  const parts = note.split(/(\d+\.\d+)/g);

  return (
    <div className="hist-alex-note">
      <div className="hist-alex-avatar">A</div>
      <div className="hist-alex-body">
        <div className="hist-alex-label">Alex's Note</div>
        <p className="hist-alex-text">
          {parts.map((part, i) =>
            /^\d+\.\d+$/.test(part)
              ? <strong key={i}>{part}</strong>
              : part
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Skeleton loader ─────────────────────────────────────────────────────── */
function HistorySkeleton() {
  return (
    <div className="hist-page">
      <div className="hist-skel-title" />
      <div className="hist-skel-note" />
      <div className="hist-skel-strip" />
      {[1, 2, 3].map(i => <div key={i} className="hist-skel-card" />)}
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

  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  /* ── Derived stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    let total = 0, count = 0, best = 0;
    sessions.forEach(s => {
      if (s.avgOverall > 0) { total += s.avgOverall; count++; }
      if (s.avgOverall > best) best = s.avgOverall;
    });
    return {
      totalSessions: sessions.length,
      avgScore:  count > 0 ? (total / count).toFixed(1) : '—',
      bestScore: best  > 0 ? best.toFixed(1)            : '—',
      streak:    profile?.current_streak || 0,
    };
  }, [sessions, profile]);

  /* ── Best session id ───────────────────────────────────────────────── */
  const bestSessionId = useMemo(() => {
    if (!sessions.length) return null;
    return sessions.reduce((b, s) => ((s.avgOverall || 0) > (b?.avgOverall || 0) ? s : b), null)?.id;
  }, [sessions]);

  /* ── Filtered list ─────────────────────────────────────────────────── */
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

  /* ── Guards ────────────────────────────────────────────────────────── */
  if (loading) return <HistorySkeleton />;
  if (error)   return <div className="hist-page"><p style={{ color: '#f87171' }}>Error loading history.</p></div>;
  if (sessions.length === 0) {
    return (
      <div className="hist-page">
        <h1 className="hist-title">Your training log.</h1>
        <EmptyState message="Your interview history starts the moment you finish your first one." />
      </div>
    );
  }

  return (
    <div className="hist-page">

      {/* ── Title ────────────────────────────────────────────────────── */}
      <h1 className="hist-title">Your training log.</h1>

      {/* ── Alex's Note ──────────────────────────────────────────────── */}
      <AlexNote sessions={sessions} bestScore={stats.bestScore} />

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <div className="hist-strip">
        <div className="hist-strip-item">
          <div className="hist-strip-value">{stats.totalSessions}</div>
          <div className="hist-strip-label">Total Sessions</div>
        </div>
        <div className="hist-strip-divider" />
        <div className="hist-strip-item">
          <div className="hist-strip-value">{stats.avgScore}</div>
          <div className="hist-strip-label">Average Score</div>
        </div>
        <div className="hist-strip-divider" />
        <div className="hist-strip-item">
          <div className="hist-strip-value" style={{ color: '#4fc3f7' }}>{stats.bestScore}</div>
          <div className="hist-strip-label">Best Score</div>
        </div>
        <div className="hist-strip-divider" />
        <div className="hist-strip-item">
          <div className="hist-strip-value" style={{ color: '#ff7a45' }}>
            {stats.streak}&nbsp;<span style={{ fontSize: 22, lineHeight: 1 }}>🔥</span>
          </div>
          <div className="hist-strip-label">Current Streak</div>
        </div>
      </div>

      {/* ── Filter row ───────────────────────────────────────────────── */}
      <div className="hist-filter-row">
        <select className="hist-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          <option value="behavioral">Behavioral</option>
          <option value="technical">Technical</option>
          <option value="system_design">System Design</option>
          <option value="hr">HR</option>
        </select>
        <select className="hist-filter-select" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select className="hist-filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="all">All time</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
      </div>

      {/* ── Session list ─────────────────────────────────────────────── */}
      <div className="hist-list">
        {filtered.length === 0 ? (
          <div className="hist-no-match">No sessions match your filters.</div>
        ) : (
          filtered.map(s => {
            const isBest  = s.id === bestSessionId;
            const sc      = scoreColor(s.avgOverall);
            const tColor  = TYPE_COLORS[s.interview_type] || '#4fc3f7';
            const dColor  = DIFF_COLORS[s.difficulty]      || '#4ade80';
            const company = s.target_company || 'General';
            const role    = s.job_role        || 'Other';
            const dateStr = new Date(s.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            });

            return (
              <div key={s.id} className="hist-entry">
                {/* Left timeline rail */}
                <div className="hist-rail">
                  <div className="hist-rail-dot" style={{ borderColor: sc }} />
                  <div className="hist-rail-line" />
                </div>

                {/* Entry content */}
                <div className="hist-entry-body">

                  {/* Meta: date + best badge */}
                  <div className="hist-entry-meta">
                    <div>
                      <div className="hist-entry-date">{dateStr}</div>
                      <div className="hist-entry-dur">{s.durationStr}</div>
                    </div>
                    {isBest && <span className="hist-best-badge">Your Best Session</span>}
                  </div>

                  {/* Chips */}
                  <div className="hist-chip-row">
                    <span className="hist-chip" style={{ color: tColor, borderColor: `${tColor}50` }}>
                      {TYPE_LABELS[s.interview_type] || s.interview_type}
                    </span>
                    <span className="hist-chip" style={{ color: dColor, borderColor: `${dColor}50` }}>
                      {(s.difficulty || 'easy').toUpperCase()}
                    </span>
                  </div>

                  {/* Inner card */}
                  <div className="hist-inner-card">
                    <div className="hist-inner-left">
                      <div className="hist-inner-company">{company}</div>
                      <div className="hist-inner-role" style={{ color: tColor }}>{role}</div>
                      <div className="hist-inner-scores">
                        <span>C <strong>{s.avgClarity.toFixed(1)}</strong></span>
                        <span>D <strong>{s.avgDepth.toFixed(1)}</strong></span>
                        <span>S <strong>{s.avgStructure.toFixed(1)}</strong></span>
                      </div>
                    </div>

                    <div className="hist-inner-right">
                      <ScoreGauge score={s.avgOverall} />
                      <div className="hist-inner-btns">
                        <button className="hist-btn-view" onClick={() => navigate(`/replay/${s.id}`)}>
                          View report →
                        </button>
                        <button className="hist-btn-replay" onClick={() => navigate(`/replay/${s.id}`)}>
                          ▶ Replay
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
