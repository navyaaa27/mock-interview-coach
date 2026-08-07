import './StatStrip.css';

function formatScore(val) {
  if (val === null || val === undefined || val === '—' || val === 0) return '—';
  const num = Number(val);
  return !isNaN(num) && num > 0 ? num.toFixed(1) : '—';
}

export default function StatStrip({ sessionsCompleted, avgScore, bestScore, hoursPracticed }) {
  const formattedAvg = formatScore(avgScore);
  const formattedBest = formatScore(bestScore);

  const cells = [
    {
      val: sessionsCompleted ?? 0,
      label: 'Sessions completed',
      dim: !sessionsCompleted,
    },
    {
      val: formattedAvg,
      label: 'Average score',
      dim: formattedAvg === '—',
    },
    {
      val: formattedBest,
      label: 'Best score',
      dim: formattedBest === '—',
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
