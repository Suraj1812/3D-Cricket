import { formatDeliveryCount, formatOvers, getRequiredRuns, getRunRate } from '../utils/scoring.js';
import { useGameStore } from '../store/useGameStore.js';
import { getShotModeConfig } from '../utils/shotModes.js';
import { getFieldPlan } from '../utils/fielding.js';

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
  const fieldingSaves = useGameStore((state) => state.fieldingSaves);
  const dotBalls = useGameStore((state) => state.dotBalls);
  const fieldPlan = useGameStore((state) => state.fieldPlan);
  const shotMode = useGameStore((state) => state.shotMode);
  const deliveryInfo = useGameStore((state) => state.deliveryInfo);
  const pitchCondition = useGameStore((state) => state.pitchCondition);
  const selectedMode = getShotModeConfig(shotMode);
  const selectedField = getFieldPlan(fieldPlan);
  const requiredRuns = getRequiredRuns(score, targetScore);
  const ballMarkers = Array.from({ length: maxBalls }, (_, index) => history[index] ?? null);

  return (
    <div className="scoreboard-shell pointer-events-none absolute left-0 right-0 top-0 z-20">
      <div className="scoreboard-row mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="broadcast-panel rounded-lg px-3 py-2.5 sm:min-w-40">
          <p className="text-[0.65rem] font-semibold uppercase text-slate-300">Score</p>
          <div className="mt-0.5 flex items-end gap-2">
            <span className="text-3xl font-black leading-none text-white sm:text-4xl">{score}</span>
            <span className="pb-1 text-sm font-semibold text-emerald-200">
              /{wickets} in {formatOvers(balls)}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5 text-[0.68rem] font-bold text-slate-100">
            <span className="rounded bg-white/12 px-2 py-1">Target {targetScore}</span>
            <span className="rounded bg-white/12 px-2 py-1">{requiredRuns} need</span>
          </div>
        </div>

        <div className="broadcast-panel min-w-0 flex-1 rounded-lg px-3 py-2.5 text-center">
          <p className="truncate text-sm font-bold text-white">{phase === 'playing' ? message : '3D Cricket'}</p>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[0.68rem] font-semibold text-slate-200">
            <span className="rounded bg-white/12 px-2 py-1">Balls {formatDeliveryCount(balls, maxBalls)}</span>
            <span className="rounded bg-white/12 px-2 py-1">Wkts {wickets}/{maxWickets}</span>
            <span className="rounded bg-white/12 px-2 py-1">{lastRuns === null ? '-' : `${lastRuns}R`}</span>
            <span className="hidden rounded bg-white/12 px-2 py-1 sm:inline">{deliveryInfo?.field ?? selectedField.shortLabel}</span>
          </div>
          <div className="mt-2 grid grid-cols-6 gap-1">
            {ballMarkers.map((entry, index) => (
              <span
                key={index}
                className={`h-6 rounded text-center text-[0.68rem] font-black leading-6 ${
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

        <div className="broadcast-panel hidden rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-100 md:block md:min-w-44">
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
            <span className="text-slate-300">Dots</span>
            <span className="font-black text-white">{dotBalls}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-300">Field</span>
            <span className="font-black text-white">{deliveryInfo?.field ?? selectedField.shortLabel}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-300">Saves</span>
            <span className="font-black text-white">{fieldingSaves}</span>
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
