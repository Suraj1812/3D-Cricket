import { useGameStore } from '../store/useGameStore.js';
import { getShotModeConfig } from '../utils/shotModes.js';

export default function ResultToast() {
  const lastOutcome = useGameStore((state) => state.lastOutcome);
  const phase = useGameStore((state) => state.phase);

  if (!lastOutcome || phase === 'start') {
    return null;
  }

  const mode = getShotModeConfig(lastOutcome.mode);
  const tone = lastOutcome.wicket
    ? 'border-red-300/40 bg-red-950/65 text-red-50'
    : lastOutcome.runs >= 4
      ? 'border-amber-200/50 bg-amber-400/20 text-amber-50'
      : 'border-white/15 bg-slate-950/62 text-white';

  return (
    <div className="pointer-events-none absolute right-4 top-28 z-20 hidden w-56 sm:block">
      <div className={`hud-pop rounded-lg border px-4 py-3 shadow-panel backdrop-blur-xl ${tone}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black leading-tight">{lastOutcome.label}</p>
            <p className="mt-1 text-xs font-semibold text-white/75">
              {mode.label} {lastOutcome.accuracy ? `- ${lastOutcome.accuracy}%` : ''}
            </p>
          </div>
          <span className="rounded bg-white/15 px-2 py-1 text-xs font-black">{lastOutcome.runs}R</span>
        </div>
      </div>
    </div>
  );
}
