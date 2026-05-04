import * as THREE from 'three';

export const gameRefs = {
  ball: {
    position: new THREE.Vector3(0, 0.18, 7),
    velocity: new THREE.Vector3(),
    visible: false,
  },
  bowler: {
    position: new THREE.Vector3(0, 0, -22),
  },
  batsman: {
    position: new THREE.Vector3(0, 0, 6.4),
  },
};
