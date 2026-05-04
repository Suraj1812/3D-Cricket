import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  BALL_RADIUS,
  FIELD_RADIUS,
  HIT_ZONE,
  RELEASE_POSITION,
  RUNUP_DURATION,
  calculateRunningRuns,
  createDeliveryVelocity,
  createHitVelocity,
  createShotSpin,
  distanceFromCenter,
  evaluateShotTiming,
  getDeliveryProfile,
  getPitchSurface,
  isThreateningStumps,
  resolveBounce,
  speed2D,
  stepBallWithForces,
} from './Physics.js';
import { useGameStore } from '../store/useGameStore.js';
import { gameRefs } from '../utils/gameRefs.js';
import { clamp, lerp } from '../utils/math.js';
import { describeRuns } from '../utils/scoring.js';

const hiddenPosition = new THREE.Vector3(0, BALL_RADIUS, 7);
const TRAIL_POINTS = 24;

function createSimulation() {
  return {
    deliveryId: 0,
    deliveryProfile: null,
    surface: null,
    phase: 'idle',
    timer: 0,
    releaseTime: 0,
    resultLocked: false,
    hit: false,
    timing: null,
    shotMode: null,
    bouncesAfterHit: 0,
    deliveryBounces: 0,
    lastSwingRequestId: 0,
    hint: 'idle',
  };
}

export default function Ball() {
  const ballGroupRef = useRef(null);
  const shadowRef = useRef(null);
  const trailRef = useRef(null);
  const trailBuffer = useMemo(() => new Float32Array(TRAIL_POINTS * 3), []);
  const position = useRef(hiddenPosition.clone());
  const velocity = useRef(new THREE.Vector3());
  const spin = useRef(new THREE.Vector3());
  const simulation = useRef(createSimulation());
  const nextDeliveryTimer = useRef(null);

  const deliveryId = useGameStore((state) => state.deliveryId);
  const phase = useGameStore((state) => state.phase);

  useEffect(() => {
    return () => {
      if (nextDeliveryTimer.current) {
        window.clearTimeout(nextDeliveryTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || deliveryId === 0) {
      hideBall(ballGroupRef.current, shadowRef.current, trailRef.current);
      return;
    }

    resetDelivery(deliveryId, simulation.current, position.current, velocity.current);
  }, [deliveryId, phase]);

  useFrame((_, rawDelta) => {
    const store = useGameStore.getState();
    const sim = simulation.current;
    const delta = Math.min(rawDelta, 0.033);

    if (store.phase !== 'playing' || sim.phase === 'idle') {
      syncMesh(ballGroupRef.current, shadowRef.current, position.current, velocity.current, false);
      updateTrail(trailRef.current, trailBuffer, position.current, false);
      return;
    }

    sim.timer += delta;

    if (sim.deliveryId !== store.deliveryId) {
      resetDelivery(store.deliveryId, sim, position.current, velocity.current);
    }

    if (sim.phase === 'runup') {
      updateRunup(sim, position.current, velocity.current, spin.current);
    } else if (sim.phase === 'released') {
      updateReleasedBall(sim, position.current, velocity.current, spin.current, delta, store);
    } else if (sim.phase === 'hit') {
      updateHitBall(sim, position.current, velocity.current, spin.current, delta);
    }

    syncSharedRefs(position.current, velocity.current, sim.phase !== 'idle');
    syncMesh(ballGroupRef.current, shadowRef.current, position.current, velocity.current, sim.phase !== 'idle');
    updateTrail(trailRef.current, trailBuffer, position.current, sim.phase === 'released' || sim.phase === 'hit');
  });

  function resetDelivery(id, sim, ballPosition, ballVelocity) {
    if (nextDeliveryTimer.current) {
      window.clearTimeout(nextDeliveryTimer.current);
      nextDeliveryTimer.current = null;
    }

    const store = useGameStore.getState();
    const context = {
      requiredRuns: Math.max(0, store.targetScore - store.score),
      remainingBalls: Math.max(1, store.maxBalls - store.balls),
      lastBoundary: store.lastRuns >= 4,
    };
    const surface = getPitchSurface(store.pitchCondition);

    Object.assign(sim, createSimulation(), {
      deliveryId: id,
      deliveryProfile: getDeliveryProfile(id, context),
      surface,
      phase: 'runup',
      lastSwingRequestId: store.swingRequestId,
    });

    store.setDeliveryInfo({
      name: sim.deliveryProfile.name,
      pace: sim.deliveryProfile.pace,
      surface: surface.name,
      length: sim.deliveryProfile.length,
    });
    ballPosition.copy(RELEASE_POSITION);
    ballVelocity.set(0, 0, 0);
    spin.current.copy(sim.deliveryProfile.spin);
    resetTrail(trailBuffer, ballPosition);
    syncSharedRefs(ballPosition, ballVelocity, false);
  }

  function updateRunup(sim, ballPosition, ballVelocity, ballSpin) {
    const progress = clamp(sim.timer / RUNUP_DURATION, 0, 1);
    const handZ = lerp(-23.5, RELEASE_POSITION.z, progress);

    ballPosition.set(0.28, 1.52 + Math.sin(progress * Math.PI) * 0.18, handZ);
    ballVelocity.set(0, 0, 0);
    ballSpin.copy(sim.deliveryProfile?.spin ?? new THREE.Vector3());

    handleSwingRequest(sim, ballPosition, ballVelocity);

    if (progress >= 1) {
      sim.phase = 'released';
      sim.releaseTime = sim.timer;
      ballPosition.copy(RELEASE_POSITION);
      ballVelocity.copy(createDeliveryVelocity(sim.deliveryProfile, sim.surface));
      ballSpin.copy(sim.deliveryProfile.spin);
      useGameStore.getState().setBallState('released', 'Ball released');
    }
  }

  function updateReleasedBall(sim, ballPosition, ballVelocity, ballSpin, delta, store) {
    stepBallWithForces(ballPosition, ballVelocity, ballSpin, delta, {
      drag: 0.015,
      swing: sim.deliveryProfile.swing,
      seam: sim.deliveryProfile.seam,
      surface: sim.surface,
    });
    const bounced = resolveBounce(ballPosition, ballVelocity, {
      restitution: 0.6,
      lateralDamping: 0.9,
      surface: sim.surface,
      seam: sim.deliveryProfile.seam,
      spin: ballSpin,
    });

    if (bounced) {
      sim.deliveryBounces += 1;
    }

    if (ballPosition.z >= HIT_ZONE.minZ && ballPosition.z <= HIT_ZONE.maxZ && sim.hint !== 'hittable') {
      sim.hint = 'hittable';
      useGameStore.getState().setBallState('hittable', 'Hit window');
    }

    handleSwingRequest(sim, ballPosition, ballVelocity);

    if (!sim.hit && ballPosition.z > HIT_ZONE.maxZ + 1.1) {
      const wicket = isThreateningStumps(ballPosition);
      finishDelivery(sim, 0, 'Miss', wicket ? 'Bowled' : 'Beaten', { wicket });
      return;
    }

    if (ballPosition.y < -2.5 || sim.timer - sim.releaseTime > 4.2) {
      finishDelivery(sim, 0, store.lastTiming ?? 'Miss', 'Dot ball');
    }
  }

  function updateHitBall(sim, ballPosition, ballVelocity, ballSpin, delta) {
    stepBallWithForces(ballPosition, ballVelocity, ballSpin, delta, {
      drag: sim.shotMode === 'loft' ? 0.013 : 0.018,
      swing: 0,
      seam: 0,
      surface: sim.surface,
      postContact: true,
      magnus: sim.shotMode === 'loft' ? 0.014 : 0.02,
    });
    const bounced = resolveBounce(ballPosition, ballVelocity, {
      restitution: 0.43,
      lateralDamping: 0.78,
      surface: sim.surface,
      spin: ballSpin,
      speedInfluence: 0.012,
    });

    if (bounced) {
      sim.bouncesAfterHit += 1;
    }

    const distance = distanceFromCenter(ballPosition);

    if (distance >= FIELD_RADIUS) {
      const runs = sim.bouncesAfterHit === 0 ? 6 : 4;
      finishDelivery(sim, runs, sim.timing?.label, runs === 6 ? 'Six' : 'Four');
      return;
    }

    const ballHasSettled = ballPosition.y <= BALL_RADIUS + 0.02 && speed2D(ballVelocity) < 1.85;
    const hitHasExpired = sim.timer - sim.releaseTime > 5.6;

    if (ballHasSettled || hitHasExpired) {
      const runs = calculateRunningRuns(distance, sim.timing?.quality);
      finishDelivery(sim, runs, sim.timing?.label, describeRuns(runs));
    }
  }

  function handleSwingRequest(sim, ballPosition, ballVelocity) {
    const store = useGameStore.getState();

    if (store.swingRequestId === sim.lastSwingRequestId || sim.resultLocked || sim.hit) {
      return;
    }

    sim.lastSwingRequestId = store.swingRequestId;

    if (sim.phase === 'runup') {
      store.setShotFeedback({
        timing: 'Early',
        label: 'Too early',
      });
      return;
    }

    const shotMode = store.shotMode;
    const timing = evaluateShotTiming(ballPosition, shotMode);

    if (timing.quality === 'miss') {
      store.setShotFeedback({
        timing: 'Miss',
        label: 'Missed',
      });
      store.setBallState('missed', 'Missed');
      return;
    }

    sim.hit = true;
    sim.phase = 'hit';
    sim.timing = timing;
    sim.shotMode = shotMode;
    sim.bouncesAfterHit = 0;
    ballVelocity.copy(createHitVelocity(ballPosition, timing, sim.deliveryId, shotMode));
    spin.current.copy(createShotSpin(timing, shotMode));

    store.setShotFeedback({
      timing: timing.label,
      label: `${timing.label} shot`,
    });
    store.registerImpact(timing.quality === 'perfect' ? 'perfect' : 'contact');
    store.setBallState('hit', `${timing.label} shot`);
  }

  function finishDelivery(sim, runs, timing, description, extras = {}) {
    if (sim.resultLocked) {
      return;
    }

    sim.resultLocked = true;
    const result = useGameStore.getState().completeDelivery({
      deliveryId: sim.deliveryId,
      runs,
      timing,
      description,
      shotMode: sim.shotMode,
      deliveryType: sim.deliveryProfile?.name,
      accuracy: sim.timing?.accuracy,
      ...extras,
    });

    if (!result.accepted || result.gameOver) {
      return;
    }

    nextDeliveryTimer.current = window.setTimeout(() => {
      const latest = useGameStore.getState();

      if (latest.phase === 'playing' && latest.completedDeliveryId === sim.deliveryId) {
        latest.startNextDelivery();
      }
    }, 1300);
  }

  return (
    <group>
      <line ref={trailRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailBuffer, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#fff1b8" transparent opacity={0.58} depthWrite={false} />
      </line>

      <group ref={ballGroupRef} visible={false}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_RADIUS, 28, 28]} />
          <meshStandardMaterial color="#b21d2b" roughness={0.4} metalness={0.02} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[BALL_RADIUS * 0.78, 0.009, 8, 32]} />
          <meshStandardMaterial color="#fff4d8" roughness={0.55} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[BALL_RADIUS * 0.78, 0.007, 8, 32]} />
          <meshStandardMaterial color="#fff4d8" roughness={0.55} />
        </mesh>
      </group>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#08100b" transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
}

function syncSharedRefs(position, velocity, visible) {
  gameRefs.ball.position.copy(position);
  gameRefs.ball.velocity.copy(velocity);
  gameRefs.ball.visible = visible;
}

function hideBall(mesh, shadow, trail) {
  if (mesh) {
    mesh.visible = false;
  }

  if (shadow) {
    shadow.visible = false;
  }

  if (trail) {
    trail.visible = false;
  }
}

function syncMesh(mesh, shadow, position, velocity, visible) {
  if (!mesh || !shadow) {
    return;
  }

  mesh.visible = visible;
  mesh.position.copy(position);
  mesh.rotation.x += velocity.z * 0.018;
  mesh.rotation.z -= velocity.x * 0.018;

  shadow.visible = visible;
  shadow.position.set(position.x, 0.026, position.z);

  const scale = clamp(1.12 - position.y * 0.12, 0.28, 1.12);
  shadow.scale.set(scale, scale, scale);
}

function resetTrail(buffer, position) {
  for (let index = 0; index < TRAIL_POINTS; index += 1) {
    buffer[index * 3] = position.x;
    buffer[index * 3 + 1] = position.y;
    buffer[index * 3 + 2] = position.z;
  }
}

function updateTrail(line, buffer, position, visible) {
  if (!line) {
    return;
  }

  line.visible = visible;

  if (!visible) {
    return;
  }

  for (let index = 0; index < TRAIL_POINTS - 1; index += 1) {
    buffer[index * 3] = buffer[(index + 1) * 3];
    buffer[index * 3 + 1] = buffer[(index + 1) * 3 + 1];
    buffer[index * 3 + 2] = buffer[(index + 1) * 3 + 2];
  }

  const lastIndex = (TRAIL_POINTS - 1) * 3;
  buffer[lastIndex] = position.x;
  buffer[lastIndex + 1] = position.y;
  buffer[lastIndex + 2] = position.z;
  line.geometry.attributes.position.needsUpdate = true;
}
