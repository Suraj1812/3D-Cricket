import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { SHOT_MODE_LIST } from '../utils/shotModes.js';

export function useShotInput() {
  const playShot = useGameStore((state) => state.playShot);
  const setShotMode = useGameStore((state) => state.setShotMode);

  useEffect(() => {
    function handleKeyDown(event) {
      const modeIndex = ['Digit1', 'Digit2', 'Digit3'].indexOf(event.code);

      if (modeIndex !== -1) {
        event.preventDefault();
        setShotMode(SHOT_MODE_LIST[modeIndex].id);
        return;
      }

      if (event.code !== 'Space' && event.code !== 'Enter') {
        return;
      }

      event.preventDefault();
      playShot();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playShot, setShotMode]);
}
