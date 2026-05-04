export const SHOT_MODES = {
  defensive: {
    id: 'defensive',
    label: 'Defend',
    shortLabel: 'DEF',
    risk: 'Control',
    timingWindow: 0.64,
    power: 0.36,
    lift: 0.28,
    side: 0.2,
    intent: 'control',
  },
  drive: {
    id: 'drive',
    label: 'Drive',
    shortLabel: 'DRV',
    risk: 'Safe',
    timingWindow: 0.5,
    power: 0.86,
    lift: 0.72,
    side: 0.58,
    intent: 'ground',
  },
  loft: {
    id: 'loft',
    label: 'Loft',
    shortLabel: 'LFT',
    risk: 'Power',
    timingWindow: 0.4,
    power: 1.16,
    lift: 1.28,
    side: 0.72,
    intent: 'aerial',
  },
  sweep: {
    id: 'sweep',
    label: 'Sweep',
    shortLabel: 'SWP',
    risk: 'Angle',
    timingWindow: 0.56,
    power: 0.88,
    lift: 0.72,
    side: 1.42,
    intent: 'leg-side',
  },
  pull: {
    id: 'pull',
    label: 'Pull',
    shortLabel: 'PUL',
    risk: 'Short',
    timingWindow: 0.46,
    power: 1.02,
    lift: 0.95,
    side: 1.18,
    intent: 'back-foot',
  },
};

export const SHOT_MODE_LIST = [
  SHOT_MODES.defensive,
  SHOT_MODES.drive,
  SHOT_MODES.loft,
  SHOT_MODES.sweep,
  SHOT_MODES.pull,
];

export function getShotModeConfig(id) {
  return SHOT_MODES[id] ?? SHOT_MODES.drive;
}
