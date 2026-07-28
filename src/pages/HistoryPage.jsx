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

const TYPE_COLORS = { behavioral: '#4fc3f7', technical: '#a78bfa', system_design: '#f59e0b', hr: '#4ade80' };
const DIFF_COLORS = { easy: '#4ade80', medium: '#f59e0b', hard: '#ef4444' };
const TYPE_LABELS = { behavioral: 'Behavioral', technical: 'Technical', system_design: 'System Design', hr: 'HR' };

/* ── Circular SVG score gauge ────────────────────────────────────────────── */
function ScoreGauge({ score }) {
  const color = scoreColor(score);
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const filled = (score / 10) * circ;

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="hist-gauge">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="40" cy="40" r={radius} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="40" y="45" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700" fontFamily="inherit">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

/* ── Alex's motivational note ────────────────────────────────────────────── */
function AlexNote({ sessions, stats }) {
  const best = sessions.find(s => s.avgOverall.toFixed(1) === stats.bestScore);
  const lastSess = sessions[0];

  let note = "Complete your first interview and Alex will have something to say.";

  if (sessions.length >= 1 && lastSess) {
    const dur = lastSess.durationStr;
    const scoreVal = lastSess.avgOverall.toFixed(1);
    const isBest = lastSess.id === best?.id;

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

  return (
    <div className="hist-alex-note">
      <div className="hist-alex-avatar">A</div>
      <div className="hist-alex-body">
        <div className="hist-alex-label">Alex's Note</div>
        <p className="hist-alex-text"
          dangerouslySetInnerHTML={{
            __html: note.replace(
              /(\d+\.\d+)/g,
              '<strong>$1</strong>'
            )
          }}
        />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {[1, 2, 3].map(i => <div key={i} className="hist-skel-card" />)}
      </div>
    </div>
  );
}

/* ── Filter pill ─────────────────────────────────────────────────────────── */
function FilterPill({ label, value, options, onChange }) {
  return (
    <div className="hist-filter-pill">
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span>{options.find(o => o.value === value)?.label || label} ▾</span>
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
    return sessions.reduce((best, s) => s.avgOverall > (best?.avgOverall ?? 0) ? s : best, null)?.id;
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
      <AlexNote sessions={sessions} stats={stats} />

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
            {stats.streak} <span style={{ fontSize: 20 }}>🔥</span>
          </div>
          <div className="hist-strip-label">Current Streak</div>
        </div>
      </div>

      {/* ── Filter row ───────────────────────────────────────────────── */}
      <div className="hist-filter-row">
        <FilterPill
          label="All types"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all',          label: 'All types' },
            { value: 'behavioral',   label: 'Behavioral' },
            { value: 'technical',    label: 'Technical' },
            { value: 'system_design',label: 'System Design' },
            { value: 'hr',           label: 'HR' },
          ]}
        />
        <FilterPill
          label="All difficulties"
          value={diffFilter}
          onChange={setDiffFilter}
          options={[
            { value: 'all',    label: 'All difficulties' },
            { value: 'easy',   label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard',   label: 'Hard' },
          ]}
        />
        <FilterPill
          label="All time"
          value={dateFilter}
          onChange={setDateFilter}
          options={[
            { value: 'all',   label: 'All time' },
            { value: 'week',  label: 'This week' },
            { value: 'month', label: 'This month' },
          ]}
        />
      </div>

      {/* ── Session list ─────────────────────────────────────────────── */}
      <div className="hist-list">
        {filtered.length === 0 ? (
          <div className="hist-no-match">No sessions match your filters.</div>
        ) : (
          filtered.map(s => {
            const isBest   = s.id === bestSessionId;
            const sc       = scoreColor(s.avgOverall);
            const tColor   = TYPE_COLORS[s.interview_type] || '#4fc3f7';
            const dColor   = DIFF_COLORS[s.difficulty]      || '#4ade80';
            const company  = s.target_company || 'General';
            const role     = s.job_role        || 'Other';
            const dateStr  = new Date(s.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            });

            return (
              <div key={s.id} className="hist-entry">
                {/* Left accent line */}
                <div className="hist-entry-rail">
                  <div className="hist-entry-dot" style={{ borderColor: sc }} />
                  <div className="hist-entry-line" />
                </div>

                {/* Content */}
                <div className="hist-entry-content">

                  {/* Row 1: date + best badge */}
                  <div className="hist-entry-meta">
                    <div>
                      <div className="hist-entry-date">{dateStr}</div>
                      <div className="hist-entry-dur">{s.durationStr}</div>
                    </div>
                    {isBest && (
                      <span className="hist-best-badge">Your Best Session</span>
                    )}
                  </div>

                  {/* Row 2: chips */}
                  <div className="hist-chip-row">
                    <span className="hist-chip" style={{ color: tColor, borderColor: `${tColor}44` }}>
                      {TYPE_LABELS[s.interview_type] || s.interview_type}
                    </span>
                    <span className="hist-chip" style={{ color: dColor, borderColor: `${dColor}44` }}>
                      {s.difficulty?.toUpperCase()}
                    </span>
                  </div>

                  {/* Row 3: inner card */}
                  <div className="hist-inner-card">
                    <div className="hist-inner-left">
                      <div className="hist-inner-company">{company}</div>
                      <div className="hist-inner-role" style={{ color: tColor }}>{role}</div>
                      <div className="hist-inner-subscores">
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
                          <i className="fa-solid fa-play" style={{ fontSize: 11, marginRight: 5 }} />
                          Replay
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
