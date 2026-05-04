import { useGameStore } from '../store/useGameStore.js';
import { SHOT_MODE_LIST } from '../utils/shotModes.js';
import TimingMeter from './TimingMeter.jsx';

export default function TouchControls() {
  const phase = useGameStore((state) => state.phase);
  const playShot = useGameStore((state) => state.playShot);
  const shotMode = useGameStore((state) => state.shotMode);
  const setShotMode = useGameStore((state) => state.setShotMode);
  const deliveryInfo = useGameStore((state) => state.deliveryInfo);

  if (phase !== 'playing') {
    return null;
  }

  return (
    <div className="game-controls pointer-events-none absolute inset-x-0 bottom-0 z-20">
      <div className="control-layout mx-auto grid w-full max-w-7xl items-end gap-3">
        <div className="control-stack pointer-events-auto min-w-0">
          <div className="shot-strip grid grid-cols-5 gap-1">
            {SHOT_MODE_LIST.map((mode) => (
              <button
                type="button"
                key={mode.id}
                className={`shot-mode-button ${
                  shotMode === mode.id
                    ? 'shot-mode-button-active'
                    : 'text-slate-100 hover:bg-white/10'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  setShotMode(mode.id);
                }}
              >
                <span className="hidden sm:inline">{mode.label}</span>
                <span className="sm:hidden">{mode.shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="delivery-strip">
            <div className="delivery-meta">
              <span>{deliveryInfo?.name ?? 'Bowler'}</span>
              <span>{deliveryInfo?.pace ? `${deliveryInfo.pace} kph - ${deliveryInfo.surface}` : 'Ready'}</span>
            </div>
            <TimingMeter />
          </div>
        </div>

        <button
          type="button"
          className="hit-button pointer-events-auto"
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            playShot();
          }}
          aria-label="Hit shot"
        >
          HIT
        </button>
      </div>
    </div>
  );
}
