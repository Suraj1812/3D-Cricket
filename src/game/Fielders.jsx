import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { gameRefs } from '../utils/gameRefs.js';
import { getFieldPlan } from '../utils/fielding.js';
import { clamp, easeOutCubic } from '../utils/math.js';
import { getRunnerPose } from '../utils/playerMotion.js';

function Fielder({ fielder, index }) {
  if (fielder.id === 'keeper') {
    return <KeeperFielder fielder={fielder} index={index} />;
  }

  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const headRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const leftLegRef = useRef(null);
  const rightLegRef = useRef(null);
  const actionProgress = useRef(1);
  const fieldingEventId = useGameStore((state) => state.fieldingEventId);
  const baseX = fielder.x;
  const baseZ = fielder.z;

  useEffect(() => {
    const event = useGameStore.getState().fieldingEvent;

    if (event?.role === fielder.role) {
      actionProgress.current = 0;
    }
  }, [fieldingEventId, fielder.role]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) {
      return;
    }

    const event = useGameStore.getState().fieldingEvent;
    const isActionFielder = event?.role === fielder.role;
    actionProgress.current = Math.min(1, actionProgress.current + delta * 2.7);
    const action = isActionFielder ? Math.sin(clamp(actionProgress.current, 0, 1) * Math.PI) : 0;
    const actionEase = easeOutCubic(clamp(actionProgress.current, 0, 1));
    const ball = gameRefs.ball;
    const dx = ball.position.x - baseX;
    const dz = ball.position.z - baseZ;
    const distance = Math.hypot(dx, dz);
    const alertness = ball.visible ? clamp(1 - distance / (fielder.close ? 6 : 9), 0, 1) : 0;
    const idle = Math.sin(clock.elapsedTime * 1.8 + index) * 0.025;
    const chaseX = distance > 0.001 ? (dx / distance) * alertness * (fielder.close ? 0.26 : 0.46) : 0;
    const chaseZ = distance > 0.001 ? (dz / distance) * alertness * (fielder.close ? 0.22 : 0.42) : 0;
    const sideDive = isActionFielder && event?.wicket ? Math.sign(dx || 1) * action * 0.65 : 0;
    const forwardSmother = isActionFielder && event?.type === 'stop' ? action * 0.48 : 0;
    const runningStride = Math.sin(clock.elapsedTime * (8 + alertness * 7) + index);

    groupRef.current.position.set(baseX + chaseX + sideDive, idle + alertness * 0.04 + (event?.wicket ? action * 0.05 : 0), baseZ + chaseZ + forwardSmother);

    if (alertness > 0.02) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    } else {
      groupRef.current.rotation.y = fielder.rotation;
    }

    if (bodyRef.current) {
      bodyRef.current.rotation.x = -alertness * 0.18 - forwardSmother * 0.42 - (event?.wicket ? action * 0.18 : 0);
      bodyRef.current.rotation.z = Math.sin(clock.elapsedTime * 2.4 + index) * 0.018 - sideDive * 0.24;
    }

    if (headRef.current) {
      headRef.current.rotation.x = -alertness * 0.12;
      headRef.current.rotation.y = runningStride * alertness * 0.04;
    }

    if (leftArmRef.current && rightArmRef.current) {
      const catchLift = isActionFielder && event?.wicket ? actionEase * 1.55 : 0;
      const throwWhip = isActionFielder && event?.type === 'stop' ? Math.sin(actionEase * Math.PI * 1.4) * 1.15 : 0;

      leftArmRef.current.rotation.x = -0.18 - alertness * 0.34 + runningStride * alertness * 0.48 - catchLift * 0.7;
      rightArmRef.current.rotation.x = -0.18 - alertness * 0.34 - runningStride * alertness * 0.48 - catchLift - throwWhip;
      leftArmRef.current.rotation.z = 0.24 + catchLift * 0.38;
      rightArmRef.current.rotation.z = -0.24 - catchLift * 0.38 + throwWhip * 0.16;
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = runningStride * alertness * 0.48 - forwardSmother * 0.45;
      rightLegRef.current.rotation.x = -runningStride * alertness * 0.48 - sideDive * 0.16;
    }
  });

  return (
    <group ref={groupRef} position={[baseX, 0, baseZ]} rotation={[0, fielder.rotation, 0]}>
      <mesh ref={bodyRef} position={[0, 1.04, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.54, 8, 14]} />
        <meshStandardMaterial color={fielder.close ? '#1e40af' : index % 2 === 0 ? '#1d4ed8' : '#2563eb'} roughness={0.68} />
      </mesh>
      <mesh position={[-0.09, 1.24, -0.28]} castShadow>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#facc15" roughness={0.55} metalness={0.06} />
      </mesh>
      <mesh position={[0, 1.22, -0.28]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.045]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.58} />
      </mesh>
      <mesh ref={headRef} position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <boxGeometry args={[0.34, 0.08, 0.24]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.58} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.23, 1.08, -0.02]} rotation={[-0.2, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.055, 0.42, 8, 10]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.22, 1.08, -0.02]} rotation={[-0.2, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.055, 0.42, 8, 10]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.15, 0.43, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.75} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.15, 0.43, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.75} />
      </mesh>
    </group>
  );
}

function KeeperFielder({ fielder, index }) {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const headRef = useRef(null);
  const leftGloveRef = useRef(null);
  const rightGloveRef = useRef(null);
  const actionProgress = useRef(1);
  const fieldingEventId = useGameStore((state) => state.fieldingEventId);
  const baseX = fielder.x;
  const baseZ = fielder.z;

  useEffect(() => {
    const event = useGameStore.getState().fieldingEvent;

    if (event?.role === fielder.role || event?.wicket) {
      actionProgress.current = 0;
    }
  }, [fieldingEventId, fielder.role]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) {
      return;
    }

    const event = useGameStore.getState().fieldingEvent;
    actionProgress.current = Math.min(1, actionProgress.current + delta * 3.1);
    const action = Math.sin(clamp(actionProgress.current, 0, 1) * Math.PI);
    const ball = gameRefs.ball;
    const dx = ball.position.x - baseX;
    const dz = ball.position.z - baseZ;
    const distance = Math.hypot(dx, dz);
    const alertness = ball.visible ? clamp(1 - distance / 5.8, 0, 1) : 0;
    const settle = Math.sin(clock.elapsedTime * 2 + index) * 0.018;
    const lateral = clamp(dx * 0.18, -0.38, 0.38) * alertness;
    const dive = (event?.role === fielder.role || event?.wicket) && event?.type !== 'stop' ? action : 0;
    const diveSide = Math.sign(dx || 1) * dive * 0.72;

    groupRef.current.position.set(baseX + lateral + diveSide, settle + dive * 0.04, baseZ + dive * 0.16);
    groupRef.current.rotation.y = Math.atan2(dx, dz);
    groupRef.current.rotation.z = -diveSide * 0.22;

    if (bodyRef.current) {
      bodyRef.current.rotation.x = -0.38 - alertness * 0.18 - dive * 0.18;
      bodyRef.current.position.y = 0.88 - alertness * 0.05;
    }

    if (headRef.current) {
      headRef.current.rotation.x = -0.1 - alertness * 0.12;
      headRef.current.rotation.y = lateral * 0.35;
    }

    if (leftGloveRef.current && rightGloveRef.current) {
      const gloveLift = alertness * 0.18;
      leftGloveRef.current.position.y = 0.88 + gloveLift + dive * 0.24;
      rightGloveRef.current.position.y = 0.88 + gloveLift + dive * 0.24;
      leftGloveRef.current.position.x = -0.28 - alertness * 0.1 + diveSide * 0.18;
      rightGloveRef.current.position.x = 0.28 + alertness * 0.1 + diveSide * 0.18;
    }
  });

  return (
    <group ref={groupRef} position={[baseX, 0, baseZ]} rotation={[0, fielder.rotation, 0]}>
      <mesh ref={bodyRef} position={[0, 0.88, 0]} castShadow>
        <capsuleGeometry args={[0.29, 0.54, 8, 14]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.68} />
      </mesh>
      <mesh ref={headRef} position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh position={[0, 1.51, 0]} castShadow>
        <boxGeometry args={[0.42, 0.1, 0.3]} />
        <meshStandardMaterial color="#1f2937" roughness={0.58} />
      </mesh>
      <mesh ref={leftGloveRef} position={[-0.28, 0.88, -0.12]} rotation={[-0.2, 0, 0.32]} castShadow>
        <boxGeometry args={[0.18, 0.16, 0.08]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.52} />
      </mesh>
      <mesh ref={rightGloveRef} position={[0.28, 0.88, -0.12]} rotation={[-0.2, 0, -0.32]} castShadow>
        <boxGeometry args={[0.18, 0.16, 0.08]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.52} />
      </mesh>
      <mesh position={[0.16, 0.33, 0.08]} rotation={[0.35, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.075, 0.52, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.74} />
      </mesh>
      <mesh position={[-0.16, 0.33, 0.08]} rotation={[0.35, 0, 0.08]} castShadow>
        <capsuleGeometry args={[0.075, 0.52, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.74} />
      </mesh>
    </group>
  );
}

function NonStriker() {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const batRef = useRef(null);
  const leftLegRef = useRef(null);
  const rightLegRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const runProgress = useRef(1);
  const runningEventId = useGameStore((state) => state.runningEventId);

  useEffect(() => {
    if (runningEventId > 0) {
      runProgress.current = 0;
    }
  }, [runningEventId]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) {
      return;
    }

    const event = useGameStore.getState().runningEvent;
    const ball = gameRefs.ball;
    const alertness = ball.visible ? clamp((ball.position.z + 12) / 20, 0, 1) : 0;
    runProgress.current = Math.min(1, runProgress.current + delta * (0.82 + (event?.urgency ?? 0.5) * 0.82) / Math.max(1, (event?.runs ?? 1) * 0.72));

    if (event && runProgress.current < 1) {
      const runPose = getRunnerPose(runProgress.current, event.runs, 'nonStriker', event.urgency, event.hesitation);

      groupRef.current.position.set(runPose.x, runPose.pump * 0.03, runPose.z);
      groupRef.current.rotation.set(runPose.lean, runPose.facing + runPose.turning, runPose.stride * 0.035);

      if (bodyRef.current) {
        bodyRef.current.rotation.x = -Math.abs(runPose.lean) * 0.68;
        bodyRef.current.rotation.z = runPose.stride * 0.06;
      }

      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = runPose.stride * 0.58;
        rightLegRef.current.rotation.x = -runPose.stride * 0.58;
      }

      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -runPose.stride * 0.64;
        rightArmRef.current.rotation.x = runPose.stride * 0.64;
      }
    } else {
      groupRef.current.position.set(-0.78 + alertness * 0.12, Math.sin(clock.elapsedTime * 1.7) * 0.01, -7.55);
      groupRef.current.rotation.y = Math.PI - alertness * 0.22;

      if (bodyRef.current) {
        bodyRef.current.rotation.x = -alertness * 0.04;
        bodyRef.current.rotation.z = 0;
      }
    }

    if (batRef.current) {
      batRef.current.rotation.x = -0.72 + Math.sin(clock.elapsedTime * 1.2) * 0.03 - alertness * 0.18;
      batRef.current.rotation.z = 0.26 + alertness * 0.28;
    }
  });

  return (
    <group ref={groupRef} position={[-0.78, 0, -7.55]} rotation={[0, Math.PI, 0]}>
      <mesh ref={bodyRef} position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.58, 8, 14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#9b6248" roughness={0.56} />
      </mesh>
      <mesh position={[0, 1.69, 0]} castShadow>
        <boxGeometry args={[0.39, 0.1, 0.28]} />
        <meshStandardMaterial color="#1b3f77" roughness={0.58} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.25, 1.05, -0.02]} rotation={[-0.22, 0, -0.24]} castShadow>
        <capsuleGeometry args={[0.055, 0.42, 8, 10]} />
        <meshStandardMaterial color="#9b6248" roughness={0.56} />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.25, 1.05, -0.02]} rotation={[-0.22, 0, 0.24]} castShadow>
        <capsuleGeometry args={[0.055, 0.42, 8, 10]} />
        <meshStandardMaterial color="#9b6248" roughness={0.56} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.13, 0.42, 0.02]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.74} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.13, 0.42, -0.02]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.74} />
      </mesh>
      <group ref={batRef} position={[0.34, 0.78, -0.18]} rotation={[-0.72, -0.28, 0.26]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.1, 0.46, 0.065]} />
          <meshStandardMaterial color="#7b4a2f" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <boxGeometry args={[0.28, 0.72, 0.08]} />
          <meshStandardMaterial color="#d4a65f" roughness={0.64} />
        </mesh>
      </group>
    </group>
  );
}

export default function Fielders() {
  const fieldPlanKey = useGameStore((state) => state.fieldPlan);
  const plan = getFieldPlan(fieldPlanKey);

  return (
    <group>
      <NonStriker />
      {plan.positions.map((fielder, index) => (
        <Fielder key={fielder.id} fielder={fielder} index={index} />
      ))}
    </group>
  );
}
