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
        cueRef.current.style.transform = `translateX(${progress * 100}%)`;
        cueRef.current.style.opacity = state.ballState === 'released' || inWindow ? '1' : '0.42';
      }

      if (liveZoneRef.current) {
        liveZoneRef.current.style.opacity = inWindow ? '1' : '0.58';
      }

      if (labelRef.current) {
        if (inWindow && distanceFromIdeal < 0.12) {
          labelRef.current.textContent = 'Perfect lane';
        } else if (inWindow) {
          labelRef.current.textContent = z < HIT_ZONE.idealZ ? 'Early lane' : 'Late lane';
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
    <div className="w-full max-w-md">
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-slate-200">
        <span>Timing</span>
        <span ref={labelRef}>Ready</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-slate-950/70 ring-1 ring-white/15">
        <div className="absolute inset-y-0 left-[43%] w-[15%] bg-amber-300/90 blur-[1px]" ref={liveZoneRef} />
        <div className="absolute inset-y-0 left-[30%] w-[13%] bg-emerald-300/45" />
        <div className="absolute inset-y-0 left-[58%] w-[13%] bg-sky-300/45" />
        <div
          ref={cueRef}
          className="absolute -left-1 top-1/2 h-5 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]"
        />
      </div>
    </div>
  );
}
