import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RUNUP_DURATION } from './Physics.js';
import { useGameStore } from '../store/useGameStore.js';
import { clamp, easeInOutCubic, easeOutCubic, lerp } from '../utils/math.js';
import { gameRefs } from '../utils/gameRefs.js';

export default function Bowler() {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const headRef = useRef(null);
  const armRef = useRef(null);
  const offArmRef = useRef(null);
  const legRef = useRef(null);
  const trailLegRef = useRef(null);
  const runTime = useRef(0);
  const reactionProgress = useRef(1);
  const deliveryId = useGameStore((state) => state.deliveryId);
  const phase = useGameStore((state) => state.phase);
  const celebrationEventId = useGameStore((state) => state.celebrationEventId);

  useEffect(() => {
    runTime.current = 0;
  }, [deliveryId]);

  useEffect(() => {
    if (celebrationEventId > 0) {
      reactionProgress.current = 0;
    }
  }, [celebrationEventId]);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const state = useGameStore.getState();
    const isActiveDelivery = state.phase === 'playing' && state.ballState !== 'settled';
    const celebration = state.celebration;

    if (isActiveDelivery) {
      runTime.current = Math.min(RUNUP_DURATION + 0.72, runTime.current + delta);
    }

    reactionProgress.current = Math.min(1, reactionProgress.current + delta * 1.9);
    const progress = easeInOutCubic(runTime.current / RUNUP_DURATION);
    const followThrough = Math.max(0, Math.min(1, (runTime.current - RUNUP_DURATION) / 0.62));
    const z = phase === 'playing' ? lerp(-23.5, -13.55, progress) + followThrough * 1.65 : -18.5;
    const stride = Math.sin(runTime.current * 16);
    const strideLift = Math.abs(stride) * 0.08;
    const releaseWindup = progress > 0.72 ? (progress - 0.72) / 0.28 : 0;
    const landingJolt = Math.sin(followThrough * Math.PI) * 0.08;
    const reaction = Math.sin(clamp(reactionProgress.current, 0, 1) * Math.PI);
    const wicketJoy = celebration?.fielding && celebration.type === 'wicket' ? reaction * celebration.intensity : 0;
    const frustration = celebration?.type === 'boundary' ? reaction * 0.45 : 0;
    const appeal = state.lastOutcome?.wicketType === 'LBW' ? easeOutCubic(clamp(reactionProgress.current * 1.2, 0, 1)) : 0;

    groupRef.current.position.set(Math.sin(runTime.current * 5.3) * 0.04 * progress, strideLift - landingJolt + wicketJoy * 0.12, z);
    groupRef.current.rotation.y = Math.PI + followThrough * 0.18 + stride * 0.018 + wicketJoy * 0.24 - frustration * 0.12;
    groupRef.current.rotation.x = -followThrough * 0.05 - releaseWindup * 0.04 - wicketJoy * 0.08 + frustration * 0.05;
    gameRefs.bowler.position.copy(groupRef.current.position);

    if (bodyRef.current) {
      bodyRef.current.rotation.x = -releaseWindup * 0.1 + followThrough * 0.12 - wicketJoy * 0.1 + frustration * 0.09;
      bodyRef.current.rotation.z = stride * 0.035 - followThrough * 0.08 + wicketJoy * 0.08;
    }

    if (headRef.current) {
      headRef.current.rotation.x = releaseWindup * 0.12 - followThrough * 0.08 - wicketJoy * 0.14 + frustration * 0.12;
      headRef.current.rotation.z = stride * 0.035 + frustration * 0.08;
    }

    if (armRef.current) {
      armRef.current.rotation.x = -0.35 - releaseWindup * 2.45 + stride * 0.18 + followThrough * 1.25 - wicketJoy * 1.35 - appeal * 0.6;
      armRef.current.rotation.z = 0.24 - followThrough * 0.5 - wicketJoy * 0.16 + frustration * 0.22;
    }

    if (offArmRef.current) {
      offArmRef.current.rotation.x = 0.18 + releaseWindup * 0.42 - stride * 0.16 - followThrough * 0.64 - wicketJoy * 1.1 - appeal * 0.6;
      offArmRef.current.rotation.z = -0.18 + releaseWindup * 0.42 + wicketJoy * 0.18 - frustration * 0.2;
    }

    if (legRef.current) {
      legRef.current.rotation.x = stride * 0.46 - followThrough * 0.42;
    }

    if (trailLegRef.current) {
      trailLegRef.current.rotation.x = -stride * 0.42 + followThrough * 0.34;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.33, 0.68, 8, 16]} />
        <meshStandardMaterial color="#2755a4" roughness={0.62} />
      </mesh>
      <mesh position={[-0.12, 1.42, -0.31]} castShadow>
        <sphereGeometry args={[0.052, 12, 12]} />
        <meshStandardMaterial color="#facc15" roughness={0.48} metalness={0.08} />
      </mesh>
      <mesh position={[0.14, 1.3, -0.32]} castShadow>
        <boxGeometry args={[0.22, 0.035, 0.025]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.56} />
      </mesh>
      <mesh position={[0, 1.38, -0.31]} castShadow>
        <boxGeometry args={[0.46, 0.08, 0.05]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.58} />
      </mesh>

      <mesh ref={headRef} position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.2, 18, 18]} />
        <meshStandardMaterial color="#8f553e" roughness={0.54} />
      </mesh>
      <mesh position={[0, 1.99, 0]} castShadow>
        <boxGeometry args={[0.42, 0.08, 0.28]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.58} />
      </mesh>

      <mesh ref={armRef} position={[0.37, 1.44, 0]} rotation={[0, 0, 0.24]} castShadow>
        <capsuleGeometry args={[0.07, 0.62, 8, 12]} />
        <meshStandardMaterial color="#8f553e" roughness={0.54} />
      </mesh>
      <mesh position={[0.46, 1.1, -0.04]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#b21d2b" roughness={0.45} />
      </mesh>

      <mesh ref={offArmRef} position={[-0.36, 1.34, 0]} rotation={[0.18, 0, -0.18]} castShadow>
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

      <mesh ref={trailLegRef} position={[-0.17, 0.48, -0.03]} castShadow>
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
