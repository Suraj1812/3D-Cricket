export const SHOT_MODES = {
  drive: {
    id: 'drive',
    label: 'Drive',
    shortLabel: 'DRV',
    risk: 'Safe',
  },
  loft: {
    id: 'loft',
    label: 'Loft',
    shortLabel: 'LFT',
    risk: 'Power',
  },
  sweep: {
    id: 'sweep',
    label: 'Sweep',
    shortLabel: 'SWP',
    risk: 'Angle',
  },
};

export const SHOT_MODE_LIST = [SHOT_MODES.drive, SHOT_MODES.loft, SHOT_MODES.sweep];

export function getShotModeConfig(id) {
  return SHOT_MODES[id] ?? SHOT_MODES.drive;
}
