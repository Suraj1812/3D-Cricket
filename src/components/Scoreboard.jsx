import { formatDeliveryCount, formatOvers, getRequiredRuns, getRunRate } from '../utils/scoring.js';
import { useGameStore } from '../store/useGameStore.js';
import { getShotModeConfig } from '../utils/shotModes.js';

export default function Scoreboard() {
  const score = useGameStore((state) => state.score);
  const balls = useGameStore((state) => state.balls);
  const wickets = useGameStore((state) => state.wickets);
  const maxBalls = useGameStore((state) => state.maxBalls);
  const maxWickets = useGameStore((state) => state.maxWickets);
  const targetScore = useGameStore((state) => state.targetScore);
  const message = useGameStore((state) => state.message);
  const lastTiming = useGameStore((state) => state.lastTiming);
  const lastRuns = useGameStore((state) => state.lastRuns);
  const phase = useGameStore((state) => state.phase);
  const history = useGameStore((state) => state.history);
  const boundaryCount = useGameStore((state) => state.boundaryCount);
  const shotMode = useGameStore((state) => state.shotMode);
  const deliveryInfo = useGameStore((state) => state.deliveryInfo);
  const pitchCondition = useGameStore((state) => state.pitchCondition);
  const selectedMode = getShotModeConfig(shotMode);
  const requiredRuns = getRequiredRuns(score, targetScore);
  const ballMarkers = Array.from({ length: maxBalls }, (_, index) => history[index] ?? null);

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="glass-panel rounded-lg px-4 py-3 sm:min-w-44">
          <p className="text-xs font-semibold uppercase text-slate-300">Score</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-black leading-none text-white">{score}</span>
            <span className="pb-1 text-sm font-semibold text-emerald-200">
              /{wickets} in {formatOvers(balls)}
            </span>
          </div>
          <div className="mt-3 flex gap-2 text-xs font-bold text-slate-100">
            <span className="rounded bg-white/12 px-2 py-1">Target {targetScore}</span>
            <span className="rounded bg-white/12 px-2 py-1">{requiredRuns} need</span>
          </div>
        </div>

        <div className="glass-panel min-w-0 flex-1 rounded-lg px-4 py-3 text-center">
          <p className="truncate text-sm font-bold text-white">{phase === 'playing' ? message : '3D Cricket'}</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-200">
            <span className="rounded bg-white/12 px-2 py-1">Balls {formatDeliveryCount(balls, maxBalls)}</span>
            <span className="rounded bg-white/12 px-2 py-1">Wkts {wickets}/{maxWickets}</span>
            <span className="rounded bg-white/12 px-2 py-1">{lastRuns === null ? '-' : `${lastRuns}R`}</span>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {ballMarkers.map((entry, index) => (
              <span
                key={index}
                className={`h-7 rounded-md text-center text-xs font-black leading-7 ${
                  entry?.wicket
                    ? 'bg-red-500 text-white'
                    : entry?.runs >= 4
                      ? 'bg-amber-300 text-slate-950'
                      : entry
                        ? 'bg-white text-slate-950'
                        : 'bg-white/12 text-slate-300'
                }`}
              >
                {entry ? (entry.wicket ? 'W' : entry.runs) : index + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-panel hidden rounded-lg px-4 py-3 text-sm font-semibold text-slate-100 md:block md:min-w-48">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-300">Shot</span>
            <span className="font-black text-white">{selectedMode.label}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-300">Rate</span>
            <span className="font-black text-white">{getRunRate(score, balls)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-300">Boundaries</span>
            <span className="font-black text-white">{boundaryCount}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-300">Ball</span>
            <span className="max-w-24 truncate font-black text-white">{deliveryInfo?.name ?? lastTiming ?? 'Ready'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-300">Pitch</span>
            <span className="font-black capitalize text-white">{deliveryInfo?.surface ?? pitchCondition}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
