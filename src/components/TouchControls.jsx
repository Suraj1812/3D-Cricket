import { useGameStore } from '../store/useGameStore.js';
import { SHOT_MODE_LIST } from '../utils/shotModes.js';
import { SHOT_PLACEMENT_LIST } from '../utils/shotPlacement.js';
import TimingMeter from './TimingMeter.jsx';

const SHOT_ICONS = {
  defensive: '▣',
  drive: '↟',
  loft: '⌃',
  sweep: '↶',
  pull: '⤴',
};

const PLACEMENT_ICONS = {
  leg: '↙',
  straight: '↑',
  off: '↗',
};

export default function TouchControls() {
  const phase = useGameStore((state) => state.phase);
  const playShot = useGameStore((state) => state.playShot);
  const shotMode = useGameStore((state) => state.shotMode);
  const shotPlacement = useGameStore((state) => state.shotPlacement);
  const setShotMode = useGameStore((state) => state.setShotMode);
  const setShotPlacement = useGameStore((state) => state.setShotPlacement);
  const deliveryInfo = useGameStore((state) => state.deliveryInfo);

  if (phase !== 'playing') {
    return null;
  }

  return (
    <div className="game-controls pointer-events-none absolute inset-x-0 bottom-0 z-20">
      <div className="control-layout mx-auto grid w-full max-w-7xl items-end gap-3">
        <div className="control-stack pointer-events-auto min-w-0">
          <div className="shot-icon-row" aria-label="Shot selection">
            {SHOT_MODE_LIST.map((mode) => (
              <button
                type="button"
                key={mode.id}
                className={`shot-icon-button ${shotMode === mode.id ? 'shot-icon-button-active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setShotMode(mode.id);
                }}
                aria-label={mode.label}
                title={mode.label}
              >
                <span className="shot-icon" aria-hidden="true">{SHOT_ICONS[mode.id] ?? '•'}</span>
                <span className="shot-caption">{mode.shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="placement-icon-row" aria-label="Shot placement">
            {SHOT_PLACEMENT_LIST.map((placement) => (
              <button
                type="button"
                key={placement.id}
                className={`placement-icon-button ${shotPlacement === placement.id ? 'placement-icon-button-active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setShotPlacement(placement.id);
                }}
                aria-label={placement.label}
                title={placement.label}
              >
                <span aria-hidden="true">{PLACEMENT_ICONS[placement.id] ?? '↑'}</span>
              </button>
            ))}
          </div>

          <div className="delivery-strip compact-delivery-strip">
            <div className="delivery-meta">
              <span>{deliveryInfo?.name ?? 'Bowler'}</span>
              <span>
                {deliveryInfo?.pace
                  ? `${deliveryInfo.pace} kph - ${deliveryInfo.surface} - ${deliveryInfo.field}`
                  : 'Ready'}
              </span>
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
          title="Hit shot"
        >
          <span aria-hidden="true">●</span>
        </button>
      </div>
    </div>
  );
}
