import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { easeOutCubic } from '../utils/math.js';
import { gameRefs } from '../utils/gameRefs.js';

export default function Bat() {
  const groupRef = useRef(null);
  const batRef = useRef(null);
  const swingProgress = useRef(1);
  const swingRequestId = useGameStore((state) => state.swingRequestId);

  useEffect(() => {
    if (swingRequestId > 0) {
      swingProgress.current = 0;
    }
  }, [swingRequestId]);

  useFrame((_, delta) => {
    if (!batRef.current || !groupRef.current) {
      return;
    }

    swingProgress.current = Math.min(1, swingProgress.current + delta * 4.8);
    const swing = easeOutCubic(swingProgress.current);
    const ready = 1 - swing;

    groupRef.current.position.copy(gameRefs.batsman.position);
    batRef.current.rotation.set(
      -0.88 + swing * 1.48,
      -0.52 + swing * 1.05,
      0.28 - swing * 1.35,
    );
    batRef.current.position.set(0.44 - swing * 0.28, 0.97 + ready * 0.08, -0.24 - swing * 0.26);
  });

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 1.16, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.72, 8, 16]} />
        <meshStandardMaterial color="#fcf7ed" roughness={0.68} />
      </mesh>

      <mesh position={[0, 1.86, 0]} castShadow>
        <sphereGeometry args={[0.2, 18, 18]} />
        <meshStandardMaterial color="#9b6248" roughness={0.52} />
      </mesh>

      <mesh position={[0, 2.08, 0]} castShadow>
        <boxGeometry args={[0.42, 0.12, 0.28]} />
        <meshStandardMaterial color="#1b3f77" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.93, -0.18]} castShadow>
        <boxGeometry args={[0.36, 0.18, 0.035]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.83, -0.22]} castShadow>
        <boxGeometry args={[0.42, 0.025, 0.035]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.42} />
      </mesh>

      <mesh position={[0.31, 1.2, -0.06]} rotation={[0.5, 0, -0.22]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 12]} />
        <meshStandardMaterial color="#9b6248" roughness={0.52} />
      </mesh>
      <mesh position={[0.39, 1.04, -0.18]} castShadow>
        <sphereGeometry args={[0.095, 12, 12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} />
      </mesh>

      <mesh position={[-0.23, 1.17, -0.02]} rotation={[0.25, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 8, 12]} />
        <meshStandardMaterial color="#9b6248" roughness={0.52} />
      </mesh>

      <mesh position={[0.15, 0.47, 0.03]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 8, 12]} />
        <meshStandardMaterial color="#fcf7ed" roughness={0.72} />
      </mesh>
      <mesh position={[0.16, 0.55, -0.08]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      <mesh position={[-0.15, 0.47, -0.03]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 8, 12]} />
        <meshStandardMaterial color="#fcf7ed" roughness={0.72} />
      </mesh>
      <mesh position={[-0.16, 0.55, -0.08]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[0.16, 0.08, 0.02]} castShadow>
        <boxGeometry args={[0.24, 0.08, 0.42]} />
        <meshStandardMaterial color="#0f172a" roughness={0.65} />
      </mesh>
      <mesh position={[-0.16, 0.08, -0.02]} castShadow>
        <boxGeometry args={[0.24, 0.08, 0.42]} />
        <meshStandardMaterial color="#0f172a" roughness={0.65} />
      </mesh>

      <group ref={batRef} position={[0.44, 1.04, -0.24]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.14, 0.62, 0.08]} />
          <meshStandardMaterial color="#7b4a2f" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.76, 0]} castShadow>
          <boxGeometry args={[0.34, 0.92, 0.1]} />
          <meshStandardMaterial color="#d4a65f" roughness={0.64} />
        </mesh>
      </group>
    </group>
  );
}
