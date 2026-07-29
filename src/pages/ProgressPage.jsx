import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressData } from '../hooks/useProgressData';
import { useAuth } from '../context/AuthContext';
import ScoreTrendChart from '../components/charts/ScoreTrendChart';
import SkillRadarChart from '../components/charts/SkillRadarChart';
import WeakAreaChart from '../components/charts/WeakAreaChart';
import TypeBreakdownChart from '../components/charts/TypeBreakdownChart';
import DeliveryTrendChart from '../components/charts/DeliveryTrendChart';
import StudyPlan from '../components/StudyPlan/StudyPlan';
import ReadinessScore from '../components/ReadinessScore/ReadinessScore';
import './ProgressPage.css';


/* ── Alex insight note ───────────────────────────────────────────────────── */
function AlexInsight({ data }) {
  const sessions = data?.sessionChartData || [];
  const n = sessions.length;

  let note = "Finish a few sessions and Alex will start connecting the dots.";

  if (n >= 1) {
    const latest  = sessions[sessions.length - 1];
    const best    = sessions.reduce((b, s) => s.overall > b.overall ? s : b, sessions[0]);
    const avg     = (sessions.reduce((s, d) => s + d.overall, 0) / n).toFixed(1);
    const trend   = n >= 3
      ? sessions.slice(-3).reduce((s, d) => s + d.overall, 0) / 3
      : null;
    const improving = trend !== null && trend > Number(avg);

    if (n === 1) {
      note = `One session down. You scored ${latest.overall.toFixed(1)}. That's the first data point — come back to make it a line.`;
    } else if (n === 2) {
      note = `Two sessions in. Average sitting at ${avg}. Not enough to call it a trend yet — one more and the picture starts to form.`;
    } else if (improving) {
      note = `${n} sessions. Last three are trending up. Average ${avg}, best at ${best.overall.toFixed(1)}. That's not noise — that's a pattern. Keep the streak alive.`;
    } else if (latest.overall >= 8) {
      note = `${n} sessions in. Your last score — ${latest.overall.toFixed(1)} — is your clearest signal yet. The work is compounding. Don't stop now.`;
    } else {
      note = `${n} sessions. Average at ${avg}, best at ${best.overall.toFixed(1)}. The gap between those two numbers is your opportunity. Keep showing up.`;
    }
  }

  const parts = note.split(/(\d+\.\d+|\d+)/g);

  return (
    <div className="prog-note">
      <div className="prog-note-avatar">A</div>
      <div className="prog-note-body">
        <div className="prog-note-label">Alex's Note</div>
        <p className="prog-note-text">
          {parts.map((part, i) =>
            /^[\d.]+$/.test(part) && part.length > 0
              ? <strong key={i}>{part}</strong>
              : part
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function ProgressSkeleton() {
  return (
    <div className="prog-page">
      <div className="prog-skel-title" />
      <div className="prog-skel-note" />
      <div className="prog-skel-strip" />
      <div className="prog-row prog-row-2col">
        <div className="prog-skel-card" style={{ height: 260 }} />
        <div className="prog-skel-card" style={{ height: 260 }} />
      </div>
      <div className="prog-skel-card" style={{ height: 200, marginBottom: 20 }} />
      <div className="prog-row prog-row-2col">
        <div className="prog-skel-card" style={{ height: 200 }} />
        <div className="prog-skel-card" style={{ height: 200 }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function ProgressPage() {
  const { currentUser } = useAuth();
  const { data, loading, error } = useProgressData(currentUser?.id);
  const navigate = useNavigate();


  /* ── Guards ──────────────────────────────────────────────────────────── */
  if (loading) return <ProgressSkeleton />;
  if (error)   return <div className="prog-page"><p style={{ color: '#f87171' }}>Error loading data: {error.message}</p></div>;

  const sessions  = data?.sessionChartData || [];
  const hasData   = sessions.length >= 1;
  const hasCharts = sessions.length >= 3;

  /* ── Derived strip stats (safe — only runs after data loads) ─────────── */
  const n       = sessions.length;
  const avg     = n > 0 ? (sessions.reduce((s, d) => s + d.overall, 0) / n).toFixed(1) : '—';
  const bestVal = n > 0 ? Math.max(...sessions.map(s => s.overall || 0)) : 0;
  const best    = bestVal > 0 ? bestVal.toFixed(1) : '—';
  const streak  = data?.user?.current_streak || 0;

  return (
    <div className="prog-page">

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <h1 className="prog-title">Your progress, mapped.</h1>

      {/* ── Alex's insight note ────────────────────────────────────────── */}
      <AlexInsight data={data} />

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <div className="prog-strip">
        <div className="prog-strip-item">
          <div className="prog-strip-value">{n}</div>
          <div className="prog-strip-label">Sessions</div>
        </div>
        <div className="prog-strip-divider" />
        <div className="prog-strip-item">
          <div className="prog-strip-value">{avg}</div>
          <div className="prog-strip-label">Average Score</div>
        </div>
        <div className="prog-strip-divider" />
        <div className="prog-strip-item">
          <div className="prog-strip-value" style={{ color: '#4fc3f7' }}>{best}</div>
          <div className="prog-strip-label">Best Score</div>
        </div>
        <div className="prog-strip-divider" />
        <div className="prog-strip-item">
          <div className="prog-strip-value" style={{ color: '#ff7a45' }}>
            {streak}&nbsp;<span style={{ fontSize: 22, lineHeight: 1 }}>🔥</span>
          </div>
          <div className="prog-strip-label">Current Streak</div>
        </div>
      </div>

      {/* ── Readiness + Type Breakdown ─────────────────────────────────── */}
      <div className="prog-row prog-row-2col" style={{ marginBottom: 20 }}>
        <div className="prog-card">
          <div className="prog-section-label">
            <i className="fa-solid fa-bullseye" style={{ color: '#ff7a45' }} /> Readiness Score
          </div>
          <ReadinessScore />
        </div>
        <div className="prog-card">
          <div className="prog-section-label">
            <i className="fa-solid fa-chart-pie" style={{ color: '#a78bfa' }} /> By Interview Type
          </div>
          {hasData ? (
            <TypeBreakdownChart data={data.typeData} />
          ) : (
            <div className="prog-empty-card">
              <i className="fa-solid fa-chart-pie" />
              Complete sessions to see type breakdown.
            </div>
          )}
        </div>
      </div>

      {/* ── Score Trend ────────────────────────────────────────────────── */}
      <div className="prog-row prog-row-1col" style={{ marginBottom: 20 }}>
        <div className="prog-card">
          <div className="prog-section-label">
            <i className="fa-solid fa-chart-line" style={{ color: '#4fc3f7' }} /> Score Trend
          </div>
          {hasCharts ? (
            <ScoreTrendChart data={data.sessionChartData} />
          ) : (
            <div className="prog-empty-card" style={{ height: 160 }}>
              <i className="fa-solid fa-chart-line" />
              Three sessions in and the pattern starts to show. You're not there yet.
              <button className="prog-start-btn" onClick={() => navigate('/session')}>
                Start Interview →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Skill Radar + Weak Areas ───────────────────────────────────── */}
      <div className="prog-row prog-row-2col" style={{ marginBottom: 20 }}>
        <div className="prog-card">
          <div className="prog-section-label">
            <i className="fa-solid fa-star" style={{ color: '#2dd4a0' }} /> Skill Profile
          </div>
          {hasCharts ? (
            <SkillRadarChart data={data.sessionChartData} />
          ) : (
            <div className="prog-empty-card" style={{ height: 180 }}>
              <i className="fa-solid fa-star" />
              Needs 3+ sessions to render.
            </div>
          )}
        </div>
        <div className="prog-card">
          <div className="prog-section-label">
            <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f59e0b' }} /> Areas to Strengthen
          </div>
          {data?.weakAreaData?.length > 0 ? (
            <WeakAreaChart data={data.weakAreaData} />
          ) : (
            <div className="prog-empty-card" style={{ height: 180 }}>
              <i className="fa-solid fa-triangle-exclamation" />
              No weak areas identified yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Delivery Trend ─────────────────────────────────────────────── */}
      <div className="prog-row prog-row-1col" style={{ marginBottom: 20 }}>
        <div className="prog-card">
          <div className="prog-section-label">
            <i className="fa-solid fa-waveform-lines" style={{ color: '#f59e0b' }} /> Delivery Trend
          </div>
          {hasCharts ? (
            <DeliveryTrendChart data={data.sessionChartData} />
          ) : (
            <div className="prog-empty-card" style={{ height: 140 }}>
              <i className="fa-solid fa-waveform-lines" />
              Delivery metrics unlock after 3 sessions.
            </div>
          )}
        </div>
      </div>

      {/* ── Study Plan ─────────────────────────────────────────────────── */}
      <div className="prog-row prog-row-1col prog-study-wrap">
        <div className="prog-card">
          <div className="prog-section-label">
            <i className="fa-solid fa-book-open" style={{ color: '#a78bfa' }} /> Study Plan
          </div>
          <StudyPlan studyPlanData={data?.studyPlan} />
        </div>
      </div>

    </div>
  );
}
