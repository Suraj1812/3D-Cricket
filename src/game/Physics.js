import * as THREE from 'three';
import { clamp } from '../utils/math.js';
import { getShotModeConfig } from '../utils/shotModes.js';

export const FIELD_RADIUS = 30;
export const BALL_RADIUS = 0.18;
export const GRAVITY = -9.8;
export const RUNUP_DURATION = 1.58;
export const RELEASE_POSITION = new THREE.Vector3(0, 1.72, -13.4);

export const HIT_ZONE = {
  minZ: 4.2,
  idealZ: 5.66,
  maxZ: 7.25,
  maxY: 2.2,
};

export const PITCH_SURFACES = {
  dry: {
    id: 'dry',
    name: 'Dry',
    bounce: 0.57,
    seamGrip: 0.84,
    spinGrip: 1.05,
    paceCarry: 0.96,
    rollingFriction: 0.985,
    lateralDamping: 0.84,
  },
  green: {
    id: 'green',
    name: 'Green',
    bounce: 0.63,
    seamGrip: 1.24,
    spinGrip: 0.78,
    paceCarry: 1.02,
    rollingFriction: 0.99,
    lateralDamping: 0.9,
  },
  dusty: {
    id: 'dusty',
    name: 'Dusty',
    bounce: 0.49,
    seamGrip: 0.72,
    spinGrip: 1.38,
    paceCarry: 0.92,
    rollingFriction: 0.975,
    lateralDamping: 0.78,
  },
};

export const PITCH_SEQUENCE = [PITCH_SURFACES.dry, PITCH_SURFACES.green, PITCH_SURFACES.dusty];

export function deliveryVariation(seedValue) {
  const seed = Math.sin(seedValue * 12.9898) * 43758.5453;
  return seed - Math.floor(seed);
}

export function getPitchSurface(surfaceId = 'dry') {
  return PITCH_SURFACES[surfaceId] ?? PITCH_SURFACES.dry;
}

export function getMatchPitch(matchId = 0) {
  return PITCH_SEQUENCE[matchId % PITCH_SEQUENCE.length];
}

export function getDeliveryProfile(deliveryId, context = {}) {
  const variation = deliveryVariation(deliveryId);
  const pressureOffset = context.requiredRuns > context.remainingBalls * 3 ? 1 : 0;
  const boundaryOffset = context.lastBoundary ? 1 : 0;
  const profiles = [
    {
      name: 'Good length',
      length: 'good',
      firstBounceZ: -0.55,
      flightTime: 0.9,
      line: -0.08,
      pace: 132,
      swing: 0.16,
      seam: 0.24,
      spin: new THREE.Vector3(-0.3, 0.08, -0.2),
    },
    {
      name: 'Off cutter',
      length: 'cutter',
      firstBounceZ: 0.25,
      flightTime: 1.02,
      line: 0.28,
      pace: 119,
      swing: -0.08,
      seam: -0.34,
      spin: new THREE.Vector3(0.65, 0.2, -0.55),
    },
    {
      name: 'Yorker',
      length: 'full',
      firstBounceZ: 3.2,
      flightTime: 1.08,
      line: -0.22,
      pace: 138,
      swing: 0.1,
      seam: 0.08,
      spin: new THREE.Vector3(-0.18, 0.05, -0.24),
    },
    {
      name: 'Back of length',
      length: 'short',
      firstBounceZ: -1.35,
      flightTime: 0.84,
      line: 0.18,
      pace: 136,
      swing: -0.12,
      seam: 0.32,
      spin: new THREE.Vector3(0.2, 0.1, -0.35),
    },
    {
      name: 'Bouncer',
      length: 'short',
      firstBounceZ: -3.1,
      flightTime: 0.78,
      line: 0.04,
      pace: 140,
      swing: 0.04,
      seam: 0.18,
      spin: new THREE.Vector3(0.1, 0.08, -0.5),
    },
  ];
  const profile = profiles[(deliveryId + pressureOffset + boundaryOffset) % profiles.length];

  return {
    ...profile,
    firstBounceZ: profile.firstBounceZ + (variation - 0.5) * 0.74,
    flightTime: profile.flightTime + (variation - 0.5) * 0.09,
    line: profile.line + (variation - 0.5) * 0.22,
    pace: Math.round(profile.pace + (variation - 0.5) * 6),
    swing: profile.swing + (variation - 0.5) * 0.08,
    seam: profile.seam + (variation - 0.5) * 0.14,
    spin: profile.spin.clone(),
  };
}

export function createDeliveryVelocity(deliveryProfile, surface = PITCH_SURFACES.dry) {
  const profile = typeof deliveryProfile === 'number' ? getDeliveryProfile(deliveryProfile) : deliveryProfile;

  return new THREE.Vector3(
    profile.line / profile.flightTime,
    (BALL_RADIUS - RELEASE_POSITION.y - 0.5 * GRAVITY * profile.flightTime * profile.flightTime) /
      profile.flightTime,
    ((profile.firstBounceZ - RELEASE_POSITION.z) / profile.flightTime) * surface.paceCarry,
  );
}

export function stepBall(position, velocity, delta, friction = 0.998) {
  velocity.y += GRAVITY * delta;
  position.addScaledVector(velocity, delta);
  velocity.x *= friction;
  velocity.z *= friction;
}

export function stepBallWithForces(position, velocity, spin, delta, options = {}) {
  const {
    drag = 0.017,
    swing = 0,
    seam = 0,
    magnus = 0.018,
    surface = PITCH_SURFACES.dry,
    postContact = false,
  } = options;

  const speed = velocity.length();
  const dragFactor = Math.max(0, 1 - drag * speed * delta);
  const swingPhase = clamp((position.z - RELEASE_POSITION.z) / 18, 0, 1);

  velocity.x += swing * Math.sin(swingPhase * Math.PI) * speed * 0.018 * delta;
  velocity.x += spin.y * magnus * speed * delta;
  velocity.y += (GRAVITY + spin.z * magnus * 0.7 * speed) * delta;

  if (position.y <= BALL_RADIUS + 0.03 && velocity.y <= 0.04) {
    velocity.x += seam * surface.seamGrip * 0.18 * delta;
    velocity.x *= surface.rollingFriction;
    velocity.z *= surface.rollingFriction;
  }

  spin.multiplyScalar(Math.max(0, 1 - delta * (postContact ? 0.48 : 0.16)));
  velocity.multiplyScalar(dragFactor);
  velocity.y += GRAVITY * delta * 0.04;
  position.addScaledVector(velocity, delta);
}

export function resolveBounce(
  position,
  velocity,
  {
    restitution = 0.58,
    lateralDamping = 0.86,
    surface = PITCH_SURFACES.dry,
    seam = 0,
    spin = null,
    speedInfluence = 0.018,
  } = {},
) {
  if (position.y > BALL_RADIUS || velocity.y >= 0) {
    return false;
  }

  position.y = BALL_RADIUS;
  const speed = velocity.length();
  const surfaceBounce = clamp(restitution * surface.bounce + speed * speedInfluence, 0.34, 0.72);
  const spinLift = spin ? clamp(1 + Math.abs(spin.x) * 0.02, 0.9, 1.18) : 1;

  velocity.y = Math.abs(velocity.y) * surfaceBounce * spinLift;
  velocity.x = velocity.x * lateralDamping * surface.lateralDamping + seam * surface.seamGrip * clamp(speed * 0.025, 0.04, 0.32);
  velocity.z *= lateralDamping * surface.paceCarry;

  if (spin) {
    velocity.x += spin.y * surface.spinGrip * 0.1;
    velocity.z += spin.x * surface.spinGrip * 0.04;
    spin.multiplyScalar(0.78);
  }

  if (Math.abs(velocity.y) < 0.55) {
    velocity.y = 0;
  }

  return true;
}

export function evaluateShotTiming(position, shotMode = 'drive') {
  const shotConfig = getShotModeConfig(shotMode);

  if (position.z < HIT_ZONE.minZ || position.z > HIT_ZONE.maxZ || position.y > HIT_ZONE.maxY) {
    return {
      quality: 'miss',
      label: 'Miss',
      diff: position.z - HIT_ZONE.idealZ,
      accuracy: 0,
    };
  }

  const diff = position.z - HIT_ZONE.idealZ;
  const absDiff = Math.abs(diff);
  const accuracy = Math.round(clamp(1 - absDiff / (HIT_ZONE.maxZ - HIT_ZONE.idealZ), 0, 1) * 100);

  if (absDiff <= shotConfig.timingWindow * 0.72) {
    return {
      quality: 'perfect',
      label: 'Perfect',
      diff,
      accuracy,
    };
  }

  if (absDiff <= shotConfig.timingWindow) {
    return {
      quality: 'good',
      label: 'Good',
      diff,
      accuracy,
    };
  }

  return {
    quality: diff < 0 ? 'early' : 'late',
    label: diff < 0 ? 'Early' : 'Late',
    diff,
    accuracy,
  };
}

export function createHitVelocity(position, timing, deliveryId, shotMode = 'drive') {
  const variation = deliveryVariation(deliveryId + 7);
  const shot = getShotModeConfig(shotMode);
  const contactHeight = clamp(position.y, BALL_RADIUS, 1.7);
  const qualityPower = timing.quality === 'perfect' ? 1 : timing.quality === 'good' ? 0.84 : 0.66;
  const sideBias = shotMode === 'sweep' ? -6.7 : shotMode === 'pull' ? -5.4 : 0;

  if (shotMode === 'defensive') {
    return new THREE.Vector3(
      (variation - 0.5) * 1.2,
      1.45 + contactHeight * 0.22,
      4.2 + variation * 1.1,
    );
  }

  if (timing.quality === 'early') {
    return new THREE.Vector3(
      (-10.6 - variation * 3.2) * shot.side + (shotMode === 'pull' ? -3.8 : 0),
      (5.4 + contactHeight * 0.35) * shot.lift * qualityPower,
      (15.8 + variation * 2.8) * shot.power * qualityPower,
    );
  }

  if (timing.quality === 'late') {
    return new THREE.Vector3(
      (9.8 + variation * 3.4) * shot.side + (shotMode === 'sweep' ? -2.8 : 0),
      (5.0 + contactHeight * 0.3) * shot.lift * qualityPower,
      (14.6 + variation * 2.2) * shot.power * qualityPower,
    );
  }

  return new THREE.Vector3(
    (variation - 0.5) * 2.4 * shot.side + sideBias,
    (9.8 + contactHeight * 0.8) * shot.lift * qualityPower,
    (24.5 + variation * 2.6) * shot.power * qualityPower,
  );
}

export function createShotSpin(timing, shotMode = 'drive') {
  const qualityBoost = timing.quality === 'perfect' ? 1.15 : timing.quality === 'good' ? 0.95 : 0.76;
  const presets = {
    defensive: new THREE.Vector3(-0.6, 0.2, -0.25),
    drive: new THREE.Vector3(-1.0, 0.45, -0.55),
    loft: new THREE.Vector3(-0.42, 0.32, 0.78),
    sweep: new THREE.Vector3(-0.35, -1.05, -0.28),
    pull: new THREE.Vector3(-0.55, -0.85, 0.16),
  };

  return (presets[shotMode] ?? presets.drive).clone().multiplyScalar(qualityBoost);
}

export function distanceFromCenter(position) {
  return Math.hypot(position.x, position.z);
}

export function calculateRunningRuns(distance, timingQuality) {
  if (timingQuality === 'miss') {
    return 0;
  }

  if (distance > FIELD_RADIUS * 0.74) {
    return 2;
  }

  return 1;
}

export function speed2D(velocity) {
  return Math.hypot(velocity.x, velocity.z);
}

export function isThreateningStumps(position) {
  return Math.abs(position.x) <= 0.48 && position.y <= 0.86;
}

export function isLbwShout(position, deliveryId = 0) {
  if (position.y < 0.28 || position.y > 1.16 || Math.abs(position.x) > 0.68) {
    return false;
  }

  return deliveryVariation(deliveryId + 41) > 0.42;
}
