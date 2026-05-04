import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RUNUP_DURATION } from './Physics.js';
import { useGameStore } from '../store/useGameStore.js';
import { easeInOutCubic, lerp } from '../utils/math.js';
import { gameRefs } from '../utils/gameRefs.js';

export default function Bowler() {
  const groupRef = useRef(null);
  const armRef = useRef(null);
  const legRef = useRef(null);
  const runTime = useRef(0);
  const deliveryId = useGameStore((state) => state.deliveryId);
  const phase = useGameStore((state) => state.phase);

  useEffect(() => {
    runTime.current = 0;
  }, [deliveryId]);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const state = useGameStore.getState();
    const isRunning = state.phase === 'playing' && state.ballState === 'runup';

    if (isRunning) {
      runTime.current = Math.min(RUNUP_DURATION, runTime.current + delta);
    }

    const progress = easeInOutCubic(runTime.current / RUNUP_DURATION);
    const z = phase === 'playing' ? lerp(-23.5, -13.55, progress) : -18.5;
    const stride = Math.sin(runTime.current * 16);

    groupRef.current.position.set(0, 0, z);
    groupRef.current.rotation.y = Math.PI;
    gameRefs.bowler.position.copy(groupRef.current.position);

    if (armRef.current) {
      const releaseWindup = progress > 0.72 ? (progress - 0.72) / 0.28 : 0;
      armRef.current.rotation.x = -0.35 - releaseWindup * 2.25 + stride * 0.18;
    }

    if (legRef.current) {
      legRef.current.rotation.x = stride * 0.42;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.33, 0.68, 8, 16]} />
        <meshStandardMaterial color="#2755a4" roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.38, -0.31]} castShadow>
        <boxGeometry args={[0.46, 0.08, 0.05]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.58} />
      </mesh>

      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.2, 18, 18]} />
        <meshStandardMaterial color="#8f553e" roughness={0.54} />
      </mesh>

      <mesh ref={armRef} position={[0.37, 1.44, 0]} rotation={[0, 0, 0.24]} castShadow>
        <capsuleGeometry args={[0.07, 0.62, 8, 12]} />
        <meshStandardMaterial color="#8f553e" roughness={0.54} />
      </mesh>
      <mesh position={[0.46, 1.1, -0.04]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#b21d2b" roughness={0.45} />
      </mesh>

      <mesh position={[-0.36, 1.34, 0]} rotation={[0.18, 0, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.55, 8, 12]} />
        <meshStandardMaterial color="#8f553e" roughness={0.54} />
      </mesh>

      <mesh ref={legRef} position={[0.16, 0.48, 0.02]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 8, 12]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.7} />
      </mesh>
      <mesh position={[0.16, 0.08, 0.08]} castShadow>
        <boxGeometry args={[0.24, 0.08, 0.42]} />
        <meshStandardMaterial color="#111827" roughness={0.68} />
      </mesh>

      <mesh position={[-0.17, 0.48, -0.03]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 8, 12]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.7} />
      </mesh>
      <mesh position={[-0.17, 0.08, -0.08]} castShadow>
        <boxGeometry args={[0.24, 0.08, 0.42]} />
        <meshStandardMaterial color="#111827" roughness={0.68} />
      </mesh>
    </group>
  );
}
