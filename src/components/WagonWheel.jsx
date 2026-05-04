import { FIELD_RADIUS } from '../game/Physics.js';

export default function WagonWheel({ history }) {
  const shots = history.filter((entry) => entry.shot);

  return (
    <div className="wagon-wheel">
      <div className="wagon-wheel-header">
        <span>Wagon wheel</span>
        <span>{shots.length} shots</span>
      </div>
      <svg viewBox="0 0 100 100" role="img" aria-label="Shot map">
        <ellipse cx="50" cy="50" rx="43" ry="39" className="wagon-boundary" />
        <rect x="46.5" y="36" width="7" height="28" rx="1.5" className="wagon-pitch" />
        <circle cx="50" cy="50" r="1.8" className="wagon-striker" />
        {shots.map((entry) => {
          const endX = 50 + (entry.shot.x / FIELD_RADIUS) * 39;
          const endY = 50 - (entry.shot.z / FIELD_RADIUS) * 35;
          const isWicket = entry.wicket;
          const isBoundary = entry.boundary;
          const lineClass = isWicket ? 'wagon-line-wicket' : isBoundary ? 'wagon-line-boundary' : 'wagon-line';

          return (
            <g key={entry.id}>
              <line x1="50" y1="50" x2={endX} y2={endY} className={lineClass} />
              <circle
                cx={endX}
                cy={endY}
                r={isBoundary ? 2.6 : entry.shot.aerial ? 2.2 : 1.8}
                className={isWicket ? 'wagon-dot-wicket' : isBoundary ? 'wagon-dot-boundary' : 'wagon-dot'}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
