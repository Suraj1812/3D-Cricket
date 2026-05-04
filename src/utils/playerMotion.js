import { clamp, easeInOutCubic } from './math.js';

export const STRIKER_CREASE = {
  x: 0,
  z: 6.42,
};

export const NON_STRIKER_CREASE = {
  x: -0.78,
  z: -7.55,
};

export function getRunnerPose(progress, runs, lane = 'striker', urgency = 0.6, hesitation = false) {
  const safeRuns = Math.max(1, runs);
  const safeProgress = clamp(progress, 0, 1);
  const laneOffset = lane === 'striker' ? 0.34 : -0.34;
  const cyclePosition = safeProgress * safeRuns;
  const cycle = Math.min(safeRuns - 1, Math.floor(cyclePosition));
  const localProgress = cyclePosition - cycle;
  const eased = easeInOutCubic(localProgress);
  const strikerStartsHere = lane === 'striker' ? cycle % 2 === 0 : cycle % 2 !== 0;
  const fromZ = strikerStartsHere ? STRIKER_CREASE.z : NON_STRIKER_CREASE.z;
  const toZ = strikerStartsHere ? NON_STRIKER_CREASE.z : STRIKER_CREASE.z;
  const fromX = strikerStartsHere ? laneOffset : -laneOffset;
  const toX = strikerStartsHere ? -laneOffset : laneOffset;
  const hesitationDip = hesitation ? Math.sin(clamp(safeProgress / 0.26, 0, 1) * Math.PI) * 0.16 : 0;
  const strideRate = 16 + urgency * 7;
  const stride = Math.sin(safeProgress * Math.PI * strideRate);
  const pump = Math.abs(stride);

  return {
    x: fromX + (toX - fromX) * eased,
    z: fromZ + (toZ - fromZ) * eased,
    lean: (0.18 + urgency * 0.22) * (toZ < fromZ ? -1 : 1) - hesitationDip,
    stride,
    pump,
    speed: urgency,
    turning: Math.sin(localProgress * Math.PI) * (cycle > 0 ? 0.28 : 0.08),
    facing: toZ < fromZ ? Math.PI : 0,
  };
}
