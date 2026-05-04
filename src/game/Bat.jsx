import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { clamp, easeInOutCubic, easeOutCubic } from '../utils/math.js';
import { gameRefs } from '../utils/gameRefs.js';
import { getRunnerPose } from '../utils/playerMotion.js';

export default function Bat() {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const headRef = useRef(null);
  const batRef = useRef(null);
  const topArmRef = useRef(null);
  const bottomArmRef = useRef(null);
  const frontLegRef = useRef(null);
  const backLegRef = useRef(null);
  const frontPadRef = useRef(null);
  const backPadRef = useRef(null);
  const badgeRef = useRef(null);
  const swingProgress = useRef(1);
  const runProgress = useRef(1);
  const reactionProgress = useRef(1);
  const idleTime = useRef(0);
  const swingRequestId = useGameStore((state) => state.swingRequestId);
  const runningEventId = useGameStore((state) => state.runningEventId);
  const celebrationEventId = useGameStore((state) => state.celebrationEventId);

  useEffect(() => {
    if (swingRequestId > 0) {
      swingProgress.current = 0;
    }
  }, [swingRequestId]);

  useEffect(() => {
    if (runningEventId > 0) {
      runProgress.current = 0;
    }
  }, [runningEventId]);

  useEffect(() => {
    if (celebrationEventId > 0) {
      reactionProgress.current = 0;
    }
  }, [celebrationEventId]);

  useFrame((_, delta) => {
    if (!batRef.current || !groupRef.current) {
      return;
    }

    idleTime.current += delta;

    const state = useGameStore.getState();
    const shotMode = state.shotMode;
    const runningEvent = state.runningEvent;
    const celebration = state.celebration;
    const pose = getShotPose(shotMode);
    swingProgress.current = Math.min(1, swingProgress.current + delta * pose.speed);
    runProgress.current = Math.min(1, runProgress.current + delta * (0.82 + (runningEvent?.urgency ?? 0.5) * 0.82) / Math.max(1, (runningEvent?.runs ?? 1) * 0.72));
    reactionProgress.current = Math.min(1, reactionProgress.current + delta * 1.9);
    const progress = swingProgress.current;
    const anticipation = Math.sin(clamp(progress / 0.24, 0, 1) * Math.PI);
    const swing = easeOutCubic(clamp((progress - 0.14) / 0.46, 0, 1));
    const follow = easeOutCubic(clamp((progress - 0.56) / 0.44, 0, 1));
    const settle = easeInOutCubic(clamp((progress - 0.76) / 0.24, 0, 1));
    const ready = 1 - swing;
    const impact = Math.sin(clamp((progress - 0.1) / 0.74, 0, 1) * Math.PI);
    const breathing = progress >= 1 ? Math.sin(idleTime.current * 1.8) * 0.012 : 0;
    const isRunning = runningEvent && runProgress.current < 1;
    const reaction = Math.sin(clamp(reactionProgress.current, 0, 1) * Math.PI);
    const boundaryJoy = celebration?.batting && (celebration.type === 'boundary' || celebration.type === 'win') ? reaction * celebration.intensity : 0;

    if (isRunning) {
      const runPose = getRunnerPose(runProgress.current, runningEvent.runs, 'striker', runningEvent.urgency, runningEvent.hesitation);

      groupRef.current.position.set(runPose.x, runPose.pump * 0.035, runPose.z);
      groupRef.current.rotation.set(runPose.lean, runPose.facing + runPose.turning, -runPose.stride * 0.035);
      gameRefs.batsman.position.set(runPose.x, 0, runPose.z);

      if (bodyRef.current) {
        bodyRef.current.rotation.x = -Math.abs(runPose.lean) * 0.75;
        bodyRef.current.rotation.z = -runPose.stride * 0.08;
      }

      if (headRef.current) {
        headRef.current.rotation.x = -0.08 - runPose.speed * 0.08;
        headRef.current.rotation.y = runPose.stride * 0.04;
      }

      if (topArmRef.current) {
        topArmRef.current.rotation.x = -0.25 + runPose.stride * 0.78;
        topArmRef.current.rotation.z = -0.12;
      }

      if (bottomArmRef.current) {
        bottomArmRef.current.rotation.x = -0.2 - runPose.stride * 0.72;
        bottomArmRef.current.rotation.z = 0.12;
      }

      if (frontLegRef.current && backLegRef.current) {
        frontLegRef.current.rotation.x = runPose.stride * 0.62;
        backLegRef.current.rotation.x = -runPose.stride * 0.62;
      }
    } else {
      gameRefs.batsman.position.set(0, 0, 6.4);
      groupRef.current.position.copy(gameRefs.batsman.position);
      groupRef.current.position.y += breathing + boundaryJoy * 0.06;
      groupRef.current.rotation.set(
        anticipation * pose.bodyCoil + impact * pose.bodyLean + follow * pose.followLean * (1 - settle) - boundaryJoy * 0.05,
        Math.PI - anticipation * pose.bodyTurn * 0.34 + impact * pose.bodyTurn + follow * pose.followTurn * (1 - settle),
        impact * pose.bodyRoll + follow * pose.followRoll * (1 - settle) + boundaryJoy * 0.05,
      );

      if (bodyRef.current) {
        bodyRef.current.rotation.x = ready * -0.08 + anticipation * pose.bodyCoil + impact * pose.bodyLean - boundaryJoy * 0.08;
        bodyRef.current.rotation.z = impact * pose.bodyRoll + follow * pose.followRoll * 0.5 + boundaryJoy * 0.04;
      }

      if (headRef.current) {
        headRef.current.rotation.x = -anticipation * 0.06 + boundaryJoy * 0.1;
        headRef.current.rotation.y = impact * pose.bodyTurn * 0.18;
      }
    }

    if (badgeRef.current) {
      badgeRef.current.scale.setScalar(1 + boundaryJoy * 0.12);
    }

    batRef.current.rotation.set(
      isRunning
        ? -1.1 + Math.sin(runProgress.current * Math.PI * 12) * 0.18
        : pose.readyRotation[0] + anticipation * pose.anticipationRotation[0] + swing * pose.swingRotation[0] + follow * pose.followRotation[0] * (1 - settle) - boundaryJoy * 1.2,
      isRunning
        ? -0.28
        : pose.readyRotation[1] + anticipation * pose.anticipationRotation[1] + swing * pose.swingRotation[1] + follow * pose.followRotation[1] * (1 - settle),
      isRunning
        ? 0.34
        : pose.readyRotation[2] + anticipation * pose.anticipationRotation[2] + swing * pose.swingRotation[2] + follow * pose.followRotation[2] * (1 - settle) - boundaryJoy * 0.35,
    );
    batRef.current.position.set(
      isRunning
        ? 0.42
        : pose.readyPosition[0] + anticipation * pose.anticipationPosition[0] + swing * pose.swingPosition[0] + follow * pose.followPosition[0] * (1 - settle),
      isRunning
        ? 0.9
        : pose.readyPosition[1] + ready * 0.08 + anticipation * pose.anticipationPosition[1] + impact * pose.lift + follow * pose.followPosition[1] * (1 - settle) + boundaryJoy * 0.22,
      isRunning
        ? -0.22
        : pose.readyPosition[2] + anticipation * pose.anticipationPosition[2] + swing * pose.swingPosition[2] + follow * pose.followPosition[2] * (1 - settle),
    );

    if (!isRunning && topArmRef.current && bottomArmRef.current) {
      topArmRef.current.rotation.x = 0.5 + anticipation * 0.18 + impact * 0.2 - boundaryJoy * 0.55;
      topArmRef.current.rotation.z = -0.22 - boundaryJoy * 0.18;
      bottomArmRef.current.rotation.x = 0.25 + impact * 0.18 - boundaryJoy * 0.42;
      bottomArmRef.current.rotation.z = 0.2 + boundaryJoy * 0.1;
    }

    if (!isRunning && frontLegRef.current && backLegRef.current) {
      frontLegRef.current.rotation.x = -impact * 0.12 + boundaryJoy * 0.06;
      backLegRef.current.rotation.x = impact * 0.08 - boundaryJoy * 0.05;
    }

    if (frontPadRef.current && backPadRef.current) {
      frontPadRef.current.rotation.x = frontLegRef.current?.rotation.x ?? 0;
      backPadRef.current.rotation.x = backLegRef.current?.rotation.x ?? 0;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      <mesh ref={bodyRef} position={[0, 1.16, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.72, 8, 16]} />
        <meshStandardMaterial color="#fcf7ed" roughness={0.68} />
      </mesh>
      <mesh ref={badgeRef} position={[-0.13, 1.42, -0.31]} castShadow>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[0.16, 1.32, -0.33]} castShadow>
        <boxGeometry args={[0.22, 0.035, 0.025]} />
        <meshStandardMaterial color="#1b3f77" roughness={0.56} />
      </mesh>

      <mesh ref={headRef} position={[0, 1.86, 0]} castShadow>
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
      {[-0.14, 0, 0.14].map((x) => (
        <mesh key={x} position={[x, 1.84, -0.245]} castShadow>
          <boxGeometry args={[0.014, 0.18, 0.018]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      ))}

      <mesh ref={topArmRef} position={[0.31, 1.2, -0.06]} rotation={[0.5, 0, -0.22]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 12]} />
        <meshStandardMaterial color="#9b6248" roughness={0.52} />
      </mesh>
      <mesh position={[0.39, 1.04, -0.18]} castShadow>
        <sphereGeometry args={[0.095, 12, 12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} />
      </mesh>

      <mesh ref={bottomArmRef} position={[-0.23, 1.17, -0.02]} rotation={[0.25, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 8, 12]} />
        <meshStandardMaterial color="#9b6248" roughness={0.52} />
      </mesh>

      <mesh ref={frontLegRef} position={[0.15, 0.47, 0.03]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 8, 12]} />
        <meshStandardMaterial color="#fcf7ed" roughness={0.72} />
      </mesh>
      <mesh ref={frontPadRef} position={[0.16, 0.55, -0.08]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      <mesh ref={backLegRef} position={[-0.15, 0.47, -0.03]} castShadow>
        <capsuleGeometry args={[0.09, 0.72, 8, 12]} />
        <meshStandardMaterial color="#fcf7ed" roughness={0.72} />
      </mesh>
      <mesh ref={backPadRef} position={[-0.16, 0.55, -0.08]} castShadow>
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
        <mesh position={[0, -0.7, -0.058]} castShadow>
          <boxGeometry args={[0.22, 0.38, 0.012]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.5, -0.066]} castShadow>
          <boxGeometry args={[0.14, 0.04, 0.012]} />
          <meshStandardMaterial color="#facc15" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function getShotPose(shotMode) {
  const poses = {
    defensive: {
      speed: 6.2,
      bodyCoil: -0.03,
      bodyLean: -0.05,
      bodyTurn: 0.05,
      bodyRoll: -0.03,
      followLean: 0.02,
      followTurn: 0.02,
      followRoll: 0.01,
      lift: -0.03,
      readyPosition: [0.4, 1.02, -0.2],
      anticipationPosition: [0.03, 0.02, 0.04],
      swingPosition: [-0.1, -0.02, -0.08],
      followPosition: [0.04, -0.02, -0.04],
      readyRotation: [-1.05, -0.42, 0.2],
      anticipationRotation: [-0.16, -0.1, 0.08],
      swingRotation: [0.72, 0.32, -0.54],
      followRotation: [0.18, 0.1, -0.08],
    },
    drive: {
      speed: 4.8,
      bodyCoil: -0.06,
      bodyLean: -0.08,
      bodyTurn: 0.08,
      bodyRoll: -0.05,
      followLean: -0.04,
      followTurn: 0.06,
      followRoll: -0.04,
      lift: 0.02,
      readyPosition: [0.44, 0.97, -0.24],
      anticipationPosition: [0.05, 0.04, 0.06],
      swingPosition: [-0.28, 0, -0.26],
      followPosition: [-0.08, 0.05, -0.1],
      readyRotation: [-0.88, -0.52, 0.28],
      anticipationRotation: [-0.22, -0.18, 0.18],
      swingRotation: [1.48, 1.05, -1.35],
      followRotation: [0.46, 0.34, -0.34],
    },
    loft: {
      speed: 4.35,
      bodyCoil: -0.08,
      bodyLean: -0.12,
      bodyTurn: 0.12,
      bodyRoll: -0.08,
      followLean: -0.1,
      followTurn: 0.1,
      followRoll: -0.06,
      lift: 0.16,
      readyPosition: [0.48, 1.0, -0.28],
      anticipationPosition: [0.06, 0.03, 0.08],
      swingPosition: [-0.34, 0, -0.32],
      followPosition: [-0.1, 0.13, -0.1],
      readyRotation: [-1.0, -0.6, 0.38],
      anticipationRotation: [-0.3, -0.22, 0.22],
      swingRotation: [1.75, 1.2, -1.68],
      followRotation: [0.58, 0.5, -0.5],
    },
    sweep: {
      speed: 5.15,
      bodyCoil: -0.14,
      bodyLean: -0.2,
      bodyTurn: -0.24,
      bodyRoll: -0.18,
      followLean: -0.08,
      followTurn: -0.12,
      followRoll: -0.1,
      lift: -0.08,
      readyPosition: [0.44, 0.78, -0.16],
      anticipationPosition: [0.04, -0.02, 0.06],
      swingPosition: [-0.34, 0, -0.42],
      followPosition: [-0.12, -0.04, -0.12],
      readyRotation: [-0.45, -0.85, 0.74],
      anticipationRotation: [-0.1, -0.28, 0.24],
      swingRotation: [0.68, 1.75, -1.95],
      followRotation: [0.24, 0.52, -0.42],
    },
    pull: {
      speed: 4.65,
      bodyCoil: 0.03,
      bodyLean: 0.08,
      bodyTurn: -0.18,
      bodyRoll: 0.06,
      followLean: 0.08,
      followTurn: -0.14,
      followRoll: 0.06,
      lift: 0.08,
      readyPosition: [0.5, 1.08, -0.16],
      anticipationPosition: [0.08, 0.06, 0.04],
      swingPosition: [-0.5, 0, -0.12],
      followPosition: [-0.18, 0.06, -0.02],
      readyRotation: [-1.32, -0.3, 0.42],
      anticipationRotation: [-0.24, 0.16, 0.18],
      swingRotation: [1.35, 1.55, -1.22],
      followRotation: [0.46, 0.48, -0.24],
    },
  };

  return poses[shotMode] ?? poses.drive;
}
