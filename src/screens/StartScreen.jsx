import { useGameStore } from '../store/useGameStore.js';

export default function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const targetScore = useGameStore((state) => state.targetScore);
  const maxBalls = useGameStore((state) => state.maxBalls);

  return (
    <div className="absolute inset-0 z-30 grid place-items-center px-4">
      <div className="glass-panel screen-enter w-full max-w-md rounded-lg p-6 text-center">
        <p className="text-sm font-bold uppercase text-amber-200">One-over chase</p>
        <h1 className="mt-2 text-4xl font-black text-white">3D Cricket</h1>
        <div className="mt-5 grid grid-cols-3 gap-2 text-left text-xs font-bold text-slate-200">
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Target</span>
            <span className="mt-1 block text-xl font-black text-white">{targetScore}</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Balls</span>
            <span className="mt-1 block text-xl font-black text-white">{maxBalls}</span>
          </div>
          <div className="rounded-md bg-white/10 p-3">
            <span className="block text-slate-400">Mode</span>
            <span className="mt-1 block text-xl font-black text-white">Pro</span>
          </div>
        </div>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-amber-300 px-5 py-3 text-base font-black text-slate-950 shadow-panel transition hover:bg-amber-200 active:scale-95"
          onClick={startGame}
        >
          Start Match
        </button>
      </div>
    </div>
  );
}
