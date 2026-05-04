import { useEffect, useRef } from 'react';
import { HIT_ZONE } from '../game/Physics.js';
import { useGameStore } from '../store/useGameStore.js';
import { gameRefs } from '../utils/gameRefs.js';
import { clamp } from '../utils/math.js';

export default function TimingMeter() {
  const cueRef = useRef(null);
  const labelRef = useRef(null);
  const liveZoneRef = useRef(null);

  useEffect(() => {
    let animationFrame = 0;

    function tick() {
      const state = useGameStore.getState();
      const z = gameRefs.ball.position.z;
      const inWindow = state.phase === 'playing' && z >= HIT_ZONE.minZ && z <= HIT_ZONE.maxZ;
      const progress = clamp((z - HIT_ZONE.minZ) / (HIT_ZONE.maxZ - HIT_ZONE.minZ), 0, 1);
      const idealProgress = clamp((HIT_ZONE.idealZ - HIT_ZONE.minZ) / (HIT_ZONE.maxZ - HIT_ZONE.minZ), 0, 1);
      const distanceFromIdeal = Math.abs(progress - idealProgress);

      if (cueRef.current) {
        cueRef.current.style.left = `${progress * 100}%`;
        cueRef.current.style.transform = 'translate(-50%, -50%)';
        cueRef.current.style.opacity = state.ballState === 'released' || inWindow ? '1' : '0.42';
      }

      if (liveZoneRef.current) {
        liveZoneRef.current.style.opacity = inWindow ? '1' : '0.58';
      }

      if (labelRef.current) {
        if (inWindow && distanceFromIdeal < 0.12) {
          labelRef.current.textContent = 'Sweet spot';
        } else if (inWindow) {
          labelRef.current.textContent = z < HIT_ZONE.idealZ ? 'Early' : 'Late';
        } else if (state.ballState === 'runup') {
          labelRef.current.textContent = 'Run-up';
        } else {
          labelRef.current.textContent = state.message;
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    }

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="timing-meter">
      <div className="timing-meter-labels">
        <span>Timing</span>
        <span ref={labelRef}>Ready</span>
      </div>
      <div className="timing-track">
        <div className="timing-zone timing-zone-perfect" ref={liveZoneRef} />
        <div className="timing-zone timing-zone-early" />
        <div className="timing-zone timing-zone-late" />
        <div
          ref={cueRef}
          className="timing-cue"
        />
      </div>
    </div>
  );
}
