import GameCanvas from './components/GameCanvas.jsx';
import ResultToast from './components/ResultToast.jsx';
import Scoreboard from './components/Scoreboard.jsx';
import TouchControls from './components/TouchControls.jsx';
import { useShotInput } from './hooks/useShotInput.js';
import { useGameAudio } from './hooks/useGameAudio.js';
import { useGameStore } from './store/useGameStore.js';
import GameOverScreen from './screens/GameOverScreen.jsx';
import StartScreen from './screens/StartScreen.jsx';

export default function App() {
  const phase = useGameStore((state) => state.phase);
  useShotInput();
  useGameAudio();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <GameCanvas />
      <Scoreboard />
      <ResultToast />
      <TouchControls />

      {phase === 'start' ? <StartScreen /> : null}
      {phase === 'gameOver' ? <GameOverScreen /> : null}
    </main>
  );
}
