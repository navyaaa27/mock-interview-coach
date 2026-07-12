import './StatStrip.css';

export default function StatStrip({ sessionsCompleted, avgScore, bestScore, hoursPracticed }) {
  const cells = [
    {
      val: sessionsCompleted ?? 0,
      label: 'Sessions completed',
      dim: !sessionsCompleted,
    },
    {
      val: avgScore ? Number(avgScore).toFixed(1) : '—',
      label: 'Average score',
      dim: !avgScore,
    },
    {
      val: bestScore ? Number(bestScore).toFixed(1) : '—',
      label: 'Best score',
      dim: !bestScore,
    },
    {
      val: hoursPracticed ?? 0,
      label: 'Hours practiced',
      dim: !hoursPracticed,
    },
  ];

  return (
    <div className="stat-strip" role="list" aria-label="Practice statistics">
      {cells.map((c, i) => (
        <div key={i} className="stat-cell" role="listitem">
          <div className={`stat-val${c.dim ? ' dim' : ''}`} id={`stat-cell-${i}`}>
            {c.val}
          </div>
          <div className="stat-name">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
