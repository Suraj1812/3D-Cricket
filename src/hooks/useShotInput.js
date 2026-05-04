import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { SHOT_MODE_LIST } from '../utils/shotModes.js';
import { SHOT_PLACEMENT_LIST } from '../utils/shotPlacement.js';

export function useShotInput() {
  const playShot = useGameStore((state) => state.playShot);
  const setShotMode = useGameStore((state) => state.setShotMode);
  const setShotPlacement = useGameStore((state) => state.setShotPlacement);

  useEffect(() => {
    function handleKeyDown(event) {
      const modeIndex = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(event.code);
      const placementIndex = ['KeyA', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].indexOf(event.code);

      if (modeIndex !== -1) {
        event.preventDefault();
        setShotMode(SHOT_MODE_LIST[modeIndex].id);
        return;
      }

      if (placementIndex !== -1) {
        event.preventDefault();
        setShotPlacement(SHOT_PLACEMENT_LIST[placementIndex % 3].id);
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
  }, [playShot, setShotMode, setShotPlacement]);
}
