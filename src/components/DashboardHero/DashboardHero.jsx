import ReadinessDial from '../ReadinessDial/ReadinessDial';
import './DashboardHero.css';

/* ── Time-of-day helper ── */
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/* ── Coach-voice narrative copy ── */
function getNarrativeCopy(readinessScore) {
  if (readinessScore === 0) {
    return "You haven't stepped into the room yet. That's fine — everyone starts at zero.";
  }
  if (readinessScore < 40) {
    return `${readinessScore} isn't a verdict — it's just where today starts. Behavioral rounds are the fastest way to move it.`;
  }
  if (readinessScore < 60) {
    return `You're building real foundations. A few more sessions and this stops feeling like practice.`;
  }
  if (readinessScore < 75) {
    return `You're getting close. The gap left is smaller than it feels.`;
  }
  if (readinessScore < 85) {
    return `You're a strong candidate right now. Keep the pressure on the areas still holding you back.`;
  }
  return `You're interview-ready. The only thing left to practice is staying calm in the room.`;
}

const TYPE_LABELS = ['Behavioral', 'Technical', 'System Design', 'HR'];
const TYPE_KEYS   = ['behavioral', 'technical', 'system_design', 'hr'];

export default function DashboardHero({
  user = {},
  profile = {},
  onStartInterview,
  onSelectType,
  selectedType = 'Behavioral',
  interviewDate,
  onDateChange,
}) {
  const timeOfDay = getTimeOfDay();
  const greeting  = `Good ${timeOfDay}`;
  const firstName = (profile.full_name || user.email || 'there').split(' ')[0];

  const readinessScore = user.readiness_score ?? 0;
  const tierLabel      = getTierLabel(readinessScore);

  /* Countdown text */
  let countdownText  = null;
  let countdownColor = 'var(--text-tertiary)';
  if (interviewDate) {
    const dt   = new Date(interviewDate + 'T00:00:00');
    const now  = new Date(); now.setHours(0, 0, 0, 0);
    const days = Math.ceil((dt - now) / 86400000);
    if (days < 0)       { countdownText = 'Interview date passed'; }
    else if (days <= 3) { countdownText = `⚡ ${days}d left`; countdownColor = '#f87171'; }
    else                { countdownText = `${days} days to interview`; countdownColor = 'var(--accent-blue)'; }
  }

  return (
    <div className="hero">
      {/* LEFT — Readiness Dial */}
      <ReadinessDial score={readinessScore} tierLabel={tierLabel} />

      {/* RIGHT — Narrative */}
      <div className="hero-narrative">
        <p className="eyebrow">Workspace dashboard</p>

        <h1>
          <span className="italic">The room is ready when you are</span>
          <br />
          <span className="name">{greeting},</span>{' '}{firstName}.
        </h1>

        <p className="sub">{getNarrativeCopy(readinessScore, profile)}</p>

        {/* Primary CTA — signature gradient border (1 of 4 allowed uses) */}
        <div className="hero-cta-border">
          <button className="hero-cta" onClick={onStartInterview} id="dash-start-btn">
            <span className="play-icon" aria-hidden="true">
              <svg width="7" height="8" viewBox="0 0 7 8" fill="none">
                <path d="M0 0L7 4L0 8V0Z" fill="white" />
              </svg>
            </span>
            Start new interview
          </button>
        </div>

        {/* Interview-type tabs */}
        <div className="type-tabs" role="tablist" aria-label="Interview type">
          {TYPE_LABELS.map((label, i) => (
            <button
              key={label}
              role="tab"
              aria-selected={selectedType === TYPE_KEYS[i]}
              className={`type-tab${selectedType === TYPE_KEYS[i] ? ' selected' : ''}`}
              onClick={() => onSelectType && onSelectType(TYPE_KEYS[i])}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Inline stat strip — streak + countdown */}
        <div className="inline-strip">
          <div className="inline-stat">
            <span className="flame-dot" aria-hidden="true" />
            <strong>{user.current_streak ?? 0}-day streak</strong>
            &nbsp;·&nbsp; longest {user.longest_streak ?? 0}
          </div>

          {countdownText && (
            <div className="inline-countdown" style={{ color: countdownColor }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <rect x="1" y="2" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3.5 1v2M7.5 1v2M1 5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {countdownText}
            </div>
          )}

          {/* Interview date picker — compact, no label */}
          <input
            type="date"
            id="dash-interview-date"
            value={interviewDate || ''}
            onChange={e => onDateChange && onDateChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-hairline-dashed)',
              color: 'var(--text-tertiary)',
              fontSize: 11,
              padding: '2px 0',
              cursor: 'pointer',
              colorScheme: 'dark',
              fontFamily: 'var(--font-sans)',
            }}
            title="Set your interview date"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Tier label (kept from getReadinessTier) ── */
function getTierLabel(score) {
  if (score >= 85) return 'Interview ready 🎯';
  if (score >= 75) return 'Strong candidate';
  if (score >= 60) return 'Getting interview-ready';
  if (score >= 40) return 'Building foundations';
  return 'Just getting started';
}
