import * as THREE from 'three';
import { clamp } from '../utils/math.js';

export const FIELD_RADIUS = 30;
export const BALL_RADIUS = 0.18;
export const GRAVITY = -9.8;
export const RUNUP_DURATION = 1.45;
export const RELEASE_POSITION = new THREE.Vector3(0, 1.72, -13.4);

export const HIT_ZONE = {
  minZ: 4.25,
  idealZ: 5.65,
  maxZ: 7.15,
  maxY: 2.15,
};

function deliveryVariation(deliveryId) {
  const seed = Math.sin(deliveryId * 12.9898) * 43758.5453;
  return seed - Math.floor(seed);
}

export function getDeliveryProfile(deliveryId) {
  const variation = deliveryVariation(deliveryId);
  const profiles = [
    {
      name: 'Good length',
      firstBounceZ: -0.55,
      flightTime: 0.9,
      line: -0.08,
      pace: 132,
    },
    {
      name: 'Off cutter',
      firstBounceZ: 0.25,
      flightTime: 1.02,
      line: 0.28,
      pace: 119,
    },
    {
      name: 'Yorker',
      firstBounceZ: 3.2,
      flightTime: 1.08,
      line: -0.22,
      pace: 138,
    },
    {
      name: 'Back of length',
      firstBounceZ: -1.35,
      flightTime: 0.84,
      line: 0.18,
      pace: 136,
    },
  ];
  const profile = profiles[deliveryId % profiles.length];

  return {
    ...profile,
    firstBounceZ: profile.firstBounceZ + (variation - 0.5) * 0.74,
    flightTime: profile.flightTime + (variation - 0.5) * 0.09,
    line: profile.line + (variation - 0.5) * 0.22,
    pace: Math.round(profile.pace + (variation - 0.5) * 6),
  };
}

export function createDeliveryVelocity(deliveryId) {
  const profile = getDeliveryProfile(deliveryId);

  return new THREE.Vector3(
    profile.line / profile.flightTime,
    (BALL_RADIUS - RELEASE_POSITION.y - 0.5 * GRAVITY * profile.flightTime * profile.flightTime) /
      profile.flightTime,
    (profile.firstBounceZ - RELEASE_POSITION.z) / profile.flightTime,
  );
}

export function stepBall(position, velocity, delta, friction = 0.998) {
  velocity.y += GRAVITY * delta;
  position.addScaledVector(velocity, delta);
  velocity.x *= friction;
  velocity.z *= friction;
}

export function resolveBounce(
  position,
  velocity,
  {
    restitution = 0.58,
    lateralDamping = 0.86,
  } = {},
) {
  if (position.y > BALL_RADIUS || velocity.y >= 0) {
    return false;
  }

  position.y = BALL_RADIUS;
  velocity.y = Math.abs(velocity.y) * restitution;
  velocity.x *= lateralDamping;
  velocity.z *= lateralDamping;

  if (Math.abs(velocity.y) < 0.55) {
    velocity.y = 0;
  }

  return true;
}

export function evaluateShotTiming(position, shotMode = 'drive') {
  const perfectWindow = shotMode === 'sweep' ? 0.56 : shotMode === 'loft' ? 0.38 : 0.48;

  if (
    position.z < HIT_ZONE.minZ ||
    position.z > HIT_ZONE.maxZ ||
    position.y > HIT_ZONE.maxY
  ) {
    return {
      quality: 'miss',
      label: 'Miss',
      diff: position.z - HIT_ZONE.idealZ,
    };
  }

  const diff = position.z - HIT_ZONE.idealZ;
  const absDiff = Math.abs(diff);
  const accuracy = Math.round(clamp(1 - absDiff / (HIT_ZONE.maxZ - HIT_ZONE.idealZ), 0, 1) * 100);

  if (absDiff <= perfectWindow) {
    return {
      quality: 'perfect',
      label: 'Perfect',
      diff,
      accuracy,
    };
  }

  if (diff < 0) {
    return {
      quality: 'early',
      label: 'Early',
      diff,
      accuracy,
    };
  }

  return {
    quality: 'late',
    label: 'Late',
    diff,
    accuracy,
  };
}

export function createHitVelocity(position, timing, deliveryId, shotMode = 'drive') {
  const variation = deliveryVariation(deliveryId + 7);
  const contactHeight = clamp(position.y, BALL_RADIUS, 1.7);
  const mode = {
    drive: {
      lift: 0.78,
      carry: 0.96,
      side: 0.75,
    },
    loft: {
      lift: 1.34,
      carry: 1.12,
      side: 0.84,
    },
    sweep: {
      lift: 0.9,
      carry: 0.88,
      side: 1.45,
    },
  }[shotMode] ?? {
    lift: 0.78,
    carry: 0.96,
    side: 0.75,
  };

  if (timing.quality === 'perfect') {
    return new THREE.Vector3(
      (variation - 0.5) * 2.4 * mode.side + (shotMode === 'sweep' ? -5.2 : 0),
      (9.8 + contactHeight * 0.8) * mode.lift,
      (24.5 + variation * 2.6) * mode.carry,
    );
  }

  if (timing.quality === 'early') {
    return new THREE.Vector3(
      (-10.6 - variation * 3.2) * mode.side,
      (5.4 + contactHeight * 0.35) * mode.lift,
      (15.8 + variation * 2.8) * mode.carry,
    );
  }

  return new THREE.Vector3(
    (9.8 + variation * 3.4) * mode.side,
    (5.0 + contactHeight * 0.3) * mode.lift,
    (14.6 + variation * 2.2) * mode.carry,
  );
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
