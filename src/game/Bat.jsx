import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { easeOutCubic } from '../utils/math.js';
import { gameRefs } from '../utils/gameRefs.js';

export default function Bat() {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
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

    const shotMode = useGameStore.getState().shotMode;
    const pose = getShotPose(shotMode);
    swingProgress.current = Math.min(1, swingProgress.current + delta * pose.speed);
    const swing = easeOutCubic(swingProgress.current);
    const ready = 1 - swing;
    const impact = Math.sin(Math.min(1, swingProgress.current) * Math.PI);

    groupRef.current.position.copy(gameRefs.batsman.position);
    groupRef.current.rotation.set(impact * pose.bodyLean, Math.PI + impact * pose.bodyTurn, impact * pose.bodyRoll);

    if (bodyRef.current) {
      bodyRef.current.rotation.x = ready * -0.08 + impact * pose.bodyLean;
      bodyRef.current.rotation.z = impact * pose.bodyRoll;
    }

    batRef.current.rotation.set(
      pose.readyRotation[0] + swing * pose.swingRotation[0],
      pose.readyRotation[1] + swing * pose.swingRotation[1],
      pose.readyRotation[2] + swing * pose.swingRotation[2],
    );
    batRef.current.position.set(
      pose.readyPosition[0] + swing * pose.swingPosition[0],
      pose.readyPosition[1] + ready * 0.08 + impact * pose.lift,
      pose.readyPosition[2] + swing * pose.swingPosition[2],
    );
  });

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      <mesh ref={bodyRef} position={[0, 1.16, 0]} castShadow>
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

function getShotPose(shotMode) {
  const poses = {
    defensive: {
      speed: 6.2,
      bodyLean: -0.05,
      bodyTurn: 0.05,
      bodyRoll: -0.03,
      lift: -0.03,
      readyPosition: [0.4, 1.02, -0.2],
      swingPosition: [-0.1, -0.02, -0.08],
      readyRotation: [-1.05, -0.42, 0.2],
      swingRotation: [0.72, 0.32, -0.54],
    },
    drive: {
      speed: 4.8,
      bodyLean: -0.08,
      bodyTurn: 0.08,
      bodyRoll: -0.05,
      lift: 0.02,
      readyPosition: [0.44, 0.97, -0.24],
      swingPosition: [-0.28, 0, -0.26],
      readyRotation: [-0.88, -0.52, 0.28],
      swingRotation: [1.48, 1.05, -1.35],
    },
    loft: {
      speed: 4.35,
      bodyLean: -0.12,
      bodyTurn: 0.12,
      bodyRoll: -0.08,
      lift: 0.16,
      readyPosition: [0.48, 1.0, -0.28],
      swingPosition: [-0.34, 0, -0.32],
      readyRotation: [-1.0, -0.6, 0.38],
      swingRotation: [1.75, 1.2, -1.68],
    },
    sweep: {
      speed: 5.15,
      bodyLean: -0.2,
      bodyTurn: -0.24,
      bodyRoll: -0.18,
      lift: -0.08,
      readyPosition: [0.44, 0.78, -0.16],
      swingPosition: [-0.34, 0, -0.42],
      readyRotation: [-0.45, -0.85, 0.74],
      swingRotation: [0.68, 1.75, -1.95],
    },
    pull: {
      speed: 4.65,
      bodyLean: 0.08,
      bodyTurn: -0.18,
      bodyRoll: 0.06,
      lift: 0.08,
      readyPosition: [0.5, 1.08, -0.16],
      swingPosition: [-0.5, 0, -0.12],
      readyRotation: [-1.32, -0.3, 0.42],
      swingRotation: [1.35, 1.55, -1.22],
    },
  };

  return poses[shotMode] ?? poses.drive;
}
