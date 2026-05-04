import { FIELD_RADIUS } from '../game/Physics.js';
import { useGameStore } from '../store/useGameStore.js';
import { getFieldPlan } from '../utils/fielding.js';

export default function FieldRadar() {
  const fieldPlanKey = useGameStore((state) => state.fieldPlan);
  const lastOutcome = useGameStore((state) => state.lastOutcome);
  const freeHit = useGameStore((state) => state.freeHit);
  const plan = getFieldPlan(fieldPlanKey);
  const shot = lastOutcome?.shot;

  return (
    <div className="field-radar" aria-label={`${plan.label} radar`}>
      <div className="field-radar-header">
        <span>{plan.shortLabel}</span>
        <span>{freeHit ? 'Free hit' : plan.intent}</span>
      </div>
      <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="43" ry="39" className="field-radar-boundary" />
        <rect x="46.5" y="36" width="7" height="28" rx="1.5" className="field-radar-pitch" />
        <line x1="42" y1="64" x2="58" y2="64" className="field-radar-crease" />
        <line x1="42" y1="36" x2="58" y2="36" className="field-radar-crease" />
        {plan.positions.map((fielder) => {
          const x = 50 + (fielder.x / FIELD_RADIUS) * 39;
          const y = 50 - (fielder.z / FIELD_RADIUS) * 35;

          return (
            <circle
              key={fielder.id}
              cx={x}
              cy={y}
              r={fielder.close ? 2.2 : 1.7}
              className={fielder.close ? 'field-radar-close-dot' : 'field-radar-dot'}
            />
          );
        })}
        {shot ? (
          <circle
            cx={50 + (shot.x / FIELD_RADIUS) * 39}
            cy={50 - (shot.z / FIELD_RADIUS) * 35}
            r={shot.aerial ? 2.8 : 2.2}
            className={shot.aerial ? 'field-radar-shot-aerial' : 'field-radar-shot'}
          />
        ) : null}
      </svg>
    </div>
  );
}
