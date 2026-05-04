import { formatOvers } from '../utils/scoring.js';
import { useGameStore } from '../store/useGameStore.js';

export default function GameOverScreen() {
  const score = useGameStore((state) => state.score);
  const balls = useGameStore((state) => state.balls);
  const wickets = useGameStore((state) => state.wickets);
  const targetScore = useGameStore((state) => state.targetScore);
  const boundaryCount = useGameStore((state) => state.boundaryCount);
  const bestShot = useGameStore((state) => state.bestShot);
  const matchResult = useGameStore((state) => state.matchResult);
  const history = useGameStore((state) => state.history);
  const restartGame = useGameStore((state) => state.restartGame);
  const title = matchResult === 'won' ? 'Chase Complete' : matchResult === 'allOut' ? 'All Out' : 'Match Complete';

  return (
    <div className="absolute inset-0 z-30 grid place-items-center px-4">
      <div className="glass-panel w-full max-w-md rounded-lg p-6 text-center">
        <p className="text-sm font-bold uppercase text-emerald-200">{title}</p>
        <h2 className="mt-2 text-5xl font-black text-white">{score}</h2>
        <p className="mt-2 text-sm font-semibold text-slate-200">
          {wickets} wickets, {formatOvers(balls)} overs, target {targetScore}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-left text-xs font-bold text-slate-200">
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Boundaries</span>
            <span className="mt-1 block text-xl font-black text-white">{boundaryCount}</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Best</span>
            <span className="mt-1 block text-xl font-black text-white">{bestShot?.runs ?? 0}R</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Needed</span>
            <span className="mt-1 block text-xl font-black text-white">{Math.max(0, targetScore - score)}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {Array.from({ length: 6 }, (_, index) => {
            const entry = history[index];

            return (
              <span
                key={index}
                className={`h-8 rounded-md text-center text-xs font-black leading-8 ${
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
            );
          })}
        </div>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-amber-300 px-5 py-3 text-base font-black text-slate-950 shadow-panel transition hover:bg-amber-200 active:scale-95"
          onClick={restartGame}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
