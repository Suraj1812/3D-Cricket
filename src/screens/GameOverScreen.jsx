import { formatOvers } from '../utils/scoring.js';
import { useGameStore } from '../store/useGameStore.js';
import WagonWheel from '../components/WagonWheel.jsx';

export default function GameOverScreen() {
  const score = useGameStore((state) => state.score);
  const batsmanRuns = useGameStore((state) => state.batsmanRuns);
  const batters = useGameStore((state) => state.batters);
  const balls = useGameStore((state) => state.balls);
  const maxBalls = useGameStore((state) => state.maxBalls);
  const wickets = useGameStore((state) => state.wickets);
  const targetScore = useGameStore((state) => state.targetScore);
  const boundaryCount = useGameStore((state) => state.boundaryCount);
  const fieldingSaves = useGameStore((state) => state.fieldingSaves);
  const catches = useGameStore((state) => state.catches);
  const dotBalls = useGameStore((state) => state.dotBalls);
  const extras = useGameStore((state) => state.extras);
  const wides = useGameStore((state) => state.wides);
  const noBalls = useGameStore((state) => state.noBalls);
  const momentum = useGameStore((state) => state.momentum);
  const bestShot = useGameStore((state) => state.bestShot);
  const matchResult = useGameStore((state) => state.matchResult);
  const history = useGameStore((state) => state.history);
  const restartGame = useGameStore((state) => state.restartGame);
  const title = matchResult === 'won' ? 'Chase Complete' : matchResult === 'allOut' ? 'All Out' : 'Match Complete';
  const legalHistory = history.filter((entry) => entry.legal !== false);

  return (
    <div className="absolute inset-0 z-30 grid place-items-center px-4">
      <div className="glass-panel screen-enter max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-lg p-6 text-center">
        <p className="text-sm font-bold uppercase text-emerald-200">{title}</p>
        <h2 className="mt-2 text-5xl font-black text-white">{score}</h2>
        <p className="mt-2 text-sm font-semibold text-slate-200">
          {wickets} wickets, {formatOvers(balls)} overs, target {targetScore}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-left text-xs font-bold text-slate-200">
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Bat runs</span>
            <span className="mt-1 block text-xl font-black text-white">{batsmanRuns}</span>
          </div>
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
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Dots</span>
            <span className="mt-1 block text-xl font-black text-white">{dotBalls}</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Catches</span>
            <span className="mt-1 block text-xl font-black text-white">{catches}</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Saves</span>
            <span className="mt-1 block text-xl font-black text-white">{fieldingSaves}</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Extras</span>
            <span className="mt-1 block text-xl font-black text-white">{extras}</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Wides/NB</span>
            <span className="mt-1 block text-xl font-black text-white">
              {wides}/{noBalls}
            </span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Flow</span>
            <span className="mt-1 block text-xl font-black text-white">{momentum}</span>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/10 p-3 text-left">
          <div className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-300">
            <span>Batting card</span>
            <span>{batsmanRuns} bat runs</span>
          </div>
          <div className="grid gap-1.5">
            {batters.slice(0, 3).map((batter, index) => (
              <div key={batter.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded bg-slate-950/25 px-2 py-1.5 text-xs font-bold text-slate-100">
                <span className="truncate">
                  {batter.name}
                  {index < 2 && !batter.out ? <span className="text-amber-200"> *</span> : null}
                </span>
                <span className="font-black text-white">
                  {batter.runs}({batter.balls})
                </span>
                <span className="text-[0.64rem] font-black uppercase text-slate-400">
                  {batter.out ? batter.dismissal : `${batter.fours}x4 ${batter.sixes}x6`}
                </span>
              </div>
            ))}
          </div>
        </div>
        <WagonWheel history={history} />
        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {Array.from({ length: maxBalls }, (_, index) => {
            const entry = legalHistory[index];

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
                {entry ? (entry.wicket ? entry.wicketType?.slice(0, 1) ?? 'W' : entry.runs) : index + 1}
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
