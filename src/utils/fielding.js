import { FIELD_RADIUS, deliveryVariation, speed2D } from '../game/Physics.js';
import { clamp } from './math.js';

const keeper = {
  id: 'keeper',
  role: 'Keeper',
  x: 0.9,
  z: 7.75,
  rotation: Math.PI,
  catchSkill: 0.92,
  stopSkill: 0.86,
  close: true,
};

export const FIELDING_PLANS = {
  attacking: {
    id: 'attacking',
    label: 'Attacking field',
    shortLabel: 'Attack',
    intent: 'Wickets',
    positions: [
      keeper,
      { id: 'slip', role: 'Slip', x: -1.45, z: 7.3, rotation: Math.PI, catchSkill: 0.9, stopSkill: 0.62, close: true },
      { id: 'gully', role: 'Gully', x: -3.6, z: 6.15, rotation: -2.65, catchSkill: 0.82, stopSkill: 0.72, close: true },
      { id: 'point', role: 'Point', x: -9.2, z: 4.0, rotation: 0.75, catchSkill: 0.76, stopSkill: 0.86 },
      { id: 'cover', role: 'Cover', x: 9.4, z: 1.2, rotation: -0.75, catchSkill: 0.78, stopSkill: 0.84 },
      { id: 'mid-off', role: 'Mid-off', x: 6.2, z: -5.7, rotation: -0.3, catchSkill: 0.74, stopSkill: 0.82 },
      { id: 'mid-on', role: 'Mid-on', x: -6.1, z: -5.9, rotation: 0.3, catchSkill: 0.74, stopSkill: 0.82 },
      { id: 'square-leg', role: 'Square leg', x: -13.4, z: 9.0, rotation: 1.25, catchSkill: 0.76, stopSkill: 0.82 },
      { id: 'fine-leg', role: 'Fine leg', x: -17.8, z: 17.8, rotation: 1.0, catchSkill: 0.7, stopSkill: 0.78 },
      { id: 'long-off', role: 'Long-off', x: 7.4, z: 24.2, rotation: -0.1, catchSkill: 0.76, stopSkill: 0.8 },
    ],
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced field',
    shortLabel: 'Balanced',
    intent: 'Control',
    positions: [
      keeper,
      { id: 'point', role: 'Point', x: -11.4, z: 4.2, rotation: 0.7, catchSkill: 0.74, stopSkill: 0.86 },
      { id: 'cover', role: 'Cover', x: 12.2, z: 2.6, rotation: -0.8, catchSkill: 0.76, stopSkill: 0.86 },
      { id: 'mid-off', role: 'Mid-off', x: 7.6, z: -6.8, rotation: -0.3, catchSkill: 0.72, stopSkill: 0.82 },
      { id: 'mid-on', role: 'Mid-on', x: -7.4, z: -7.0, rotation: 0.3, catchSkill: 0.72, stopSkill: 0.82 },
      { id: 'mid-wicket', role: 'Mid-wicket', x: -14.2, z: 1.2, rotation: 1.1, catchSkill: 0.74, stopSkill: 0.84 },
      { id: 'deep-cover', role: 'Deep cover', x: 19.6, z: 14.2, rotation: -1.2, catchSkill: 0.72, stopSkill: 0.8 },
      { id: 'deep-square', role: 'Deep square', x: -21.0, z: 12.8, rotation: 1.15, catchSkill: 0.72, stopSkill: 0.8 },
      { id: 'long-on', role: 'Long-on', x: -8.4, z: 24.8, rotation: 0.2, catchSkill: 0.76, stopSkill: 0.8 },
      { id: 'long-off', role: 'Long-off', x: 8.6, z: 24.5, rotation: -0.2, catchSkill: 0.76, stopSkill: 0.8 },
    ],
  },
  defensive: {
    id: 'defensive',
    label: 'Boundary riders',
    shortLabel: 'Deep',
    intent: 'Save runs',
    positions: [
      keeper,
      { id: 'third', role: 'Third', x: -19.6, z: 20.0, rotation: 0.85, catchSkill: 0.7, stopSkill: 0.84 },
      { id: 'fine-leg', role: 'Fine leg', x: -23.2, z: 12.6, rotation: 1.25, catchSkill: 0.7, stopSkill: 0.84 },
      { id: 'deep-square', role: 'Deep square', x: -24.2, z: 3.8, rotation: 1.45, catchSkill: 0.74, stopSkill: 0.86 },
      { id: 'deep-mid', role: 'Deep mid-wicket', x: -18.6, z: -8.4, rotation: 1.9, catchSkill: 0.74, stopSkill: 0.84 },
      { id: 'long-on', role: 'Long-on', x: -9.4, z: 26.2, rotation: 0.22, catchSkill: 0.78, stopSkill: 0.84 },
      { id: 'long-off', role: 'Long-off', x: 9.8, z: 26.0, rotation: -0.22, catchSkill: 0.78, stopSkill: 0.84 },
      { id: 'deep-cover', role: 'Deep cover', x: 23.6, z: 12.6, rotation: -1.2, catchSkill: 0.74, stopSkill: 0.86 },
      { id: 'deep-point', role: 'Deep point', x: 22.4, z: 2.4, rotation: -1.42, catchSkill: 0.72, stopSkill: 0.84 },
      { id: 'straight', role: 'Straight', x: 0, z: 27.0, rotation: 0, catchSkill: 0.78, stopSkill: 0.84 },
    ],
  },
};

export function getFieldPlanKey(context = {}) {
  const remainingBalls = Math.max(1, context.remainingBalls ?? 6);
  const requiredRuns = Math.max(0, context.requiredRuns ?? 24);
  const requiredRate = requiredRuns / remainingBalls;

  if (context.freeHit || context.lastBoundary || requiredRate <= 2.4 || context.momentum > 72) {
    return 'defensive';
  }

  if (requiredRate >= 3.6 || context.wickets > 0 || context.momentum < 28) {
    return 'attacking';
  }

  return 'balanced';
}

export function getFieldPlan(planKey = 'balanced') {
  return FIELDING_PLANS[planKey] ?? FIELDING_PLANS.balanced;
}

export function evaluateFieldingOutcome({
  position,
  velocity,
  bounces,
  deliveryId,
  shotMode,
  timing,
  fieldPlanKey,
}) {
  const plan = getFieldPlan(fieldPlanKey);
  const closest = getClosestFielder(position, plan.positions);

  if (!closest) {
    return null;
  }

  const speed = speed2D(velocity);
  const seed = deliveryVariation(deliveryId * 17 + closest.index * 3 + Math.round(position.x * 10));
  const riskyShot = shotMode === 'loft' || shotMode === 'pull' || shotMode === 'sweep';
  const mistimed = timing?.quality === 'early' || timing?.quality === 'late';
  const catchRadius = closest.fielder.close ? 1.35 : 1.85;
  const stopRadius = closest.fielder.close ? 1.05 : 1.55;

  if (
    bounces === 0 &&
    riskyShot &&
    position.y > 0.86 &&
    position.y < 4.2 &&
    closest.distance < catchRadius &&
    speed < 25
  ) {
    const chance =
      (mistimed ? 0.72 : timing?.quality === 'good' ? 0.34 : 0.12) *
      closest.fielder.catchSkill *
      clamp(1.25 - closest.distance / catchRadius, 0.22, 1);

    if (seed < chance) {
      return {
        type: 'catch',
        wicket: true,
        runs: 0,
        wicketType: 'Caught',
        description: `Caught by ${closest.fielder.role}`,
        fielder: closest.fielder,
      };
    }
  }

  if (
    bounces > 0 &&
    position.y <= 0.72 &&
    speed > 3.2 &&
    closest.distance < stopRadius &&
    distanceFromBoundary(position) > 2.2
  ) {
    const runs = calculateStoppedRuns(position, timing?.quality, closest.fielder.stopSkill);

    return {
      type: 'stop',
      wicket: false,
      runs,
      description: runs === 0 ? `${closest.fielder.role} stops it` : `${runs} run, saved by ${closest.fielder.role}`,
      fielder: closest.fielder,
    };
  }

  return null;
}

function getClosestFielder(position, fielders) {
  let closest = null;

  fielders.forEach((fielder, index) => {
    const distance = Math.hypot(position.x - fielder.x, position.z - fielder.z);

    if (!closest || distance < closest.distance) {
      closest = { fielder, index, distance };
    }
  });

  return closest;
}

function calculateStoppedRuns(position, timingQuality, stopSkill) {
  const distance = Math.hypot(position.x, position.z);
  const timingBonus = timingQuality === 'perfect' ? 0.8 : timingQuality === 'good' ? 0.35 : 0;
  const baseRuns = distance > FIELD_RADIUS * 0.68 ? 2 : distance > FIELD_RADIUS * 0.34 ? 1 : 0;

  return clamp(Math.round(baseRuns + timingBonus - stopSkill * 0.4), 0, 2);
}

function distanceFromBoundary(position) {
  return FIELD_RADIUS - Math.hypot(position.x, position.z);
}
