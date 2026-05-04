export const SHOT_PLACEMENTS = {
  leg: {
    id: 'leg',
    label: 'Leg',
    shortLabel: 'LEG',
    bias: -1,
  },
  straight: {
    id: 'straight',
    label: 'Straight',
    shortLabel: 'STR',
    bias: 0,
  },
  off: {
    id: 'off',
    label: 'Off',
    shortLabel: 'OFF',
    bias: 1,
  },
};

export const SHOT_PLACEMENT_LIST = [
  SHOT_PLACEMENTS.leg,
  SHOT_PLACEMENTS.straight,
  SHOT_PLACEMENTS.off,
];

export function getShotPlacementConfig(id) {
  return SHOT_PLACEMENTS[id] ?? SHOT_PLACEMENTS.straight;
}
