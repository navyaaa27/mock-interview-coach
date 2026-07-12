import './CoachCard.css';

export default function CoachCard({ suggestion, onStartSession }) {
  if (!suggestion) return null;

  return (
    <div className="coach-card" id="dash-coach-card">
      <div className="coach-label">Alex's note</div>
      <p className="coach-text">{suggestion.text}</p>
      <button
        className="coach-btn"
        id="dash-coach-start-btn"
        onClick={() => onStartSession && onStartSession(suggestion.type, suggestion.difficulty)}
      >
        Start this session →
      </button>
    </div>
  );
}
