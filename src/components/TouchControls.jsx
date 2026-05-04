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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-5 sm:pb-7">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3">
        <div className="glass-panel pointer-events-auto grid w-full max-w-lg grid-cols-5 gap-1.5 rounded-lg p-1.5">
          {SHOT_MODE_LIST.map((mode) => (
            <button
              type="button"
              key={mode.id}
              className={`min-h-10 rounded-md px-2 py-2 text-xs font-black transition sm:text-sm ${
                shotMode === mode.id
                  ? 'bg-white text-slate-950'
                  : 'bg-white/8 text-slate-100 hover:bg-white/14'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                setShotMode(mode.id);
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="glass-panel flex w-full max-w-lg flex-col items-center rounded-lg px-4 py-3">
          <div className="mb-3 flex w-full items-center justify-between gap-3 text-xs font-bold uppercase text-slate-200">
            <span>{deliveryInfo?.name ?? 'Bowler'}</span>
            <span>{deliveryInfo?.pace ? `${deliveryInfo.pace} kph - ${deliveryInfo.surface}` : 'Ready'}</span>
          </div>
          <TimingMeter />
        </div>

        <button
          type="button"
          className="pointer-events-auto h-20 w-20 rounded-full border border-white/50 bg-amber-300 text-base font-black text-slate-950 shadow-panel transition hover:bg-amber-200 active:scale-95 sm:h-24 sm:w-24 sm:text-lg"
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
