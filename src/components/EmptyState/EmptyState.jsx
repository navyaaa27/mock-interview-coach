import './EmptyState.css';

/**
 * Shared voiced empty-state component.
 *
 * Voiced messages used across the app:
 * - Dashboard no sessions:    "Your interview history starts the moment you finish your first one."
 * - Score trend (< sessions): "Three sessions in and the pattern starts to show. You're not there yet."
 * - History page (no data):   "Your interview history starts the moment you finish your first one."
 * - Progress charts:          "Three sessions in and the pattern starts to show. You're not there yet."
 * - Study plan not generated: "No plan yet — generate one and Alex will map out exactly what to practice and when."
 */
export default function EmptyState({ message, dashed = true }) {
  return (
    <div className={`empty-state${dashed ? ' dashed' : ''}`}>
      <p>{message}</p>
    </div>
  );
}
