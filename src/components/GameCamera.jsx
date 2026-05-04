import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { gameRefs } from '../utils/gameRefs.js';

export default function GameCamera() {
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);
  const lastCompletedDelivery = useRef(0);
  const cameraPunch = useRef(0);

  useFrame(({ camera }, delta) => {
    const state = useGameStore.getState();
    const ball = gameRefs.ball.position;
    const followingShot = state.ballState === 'hit' || state.ballState === 'settled';

    if (state.completedDeliveryId !== lastCompletedDelivery.current) {
      lastCompletedDelivery.current = state.completedDeliveryId;
      cameraPunch.current = state.lastRuns >= 4 ? 1 : 0.35;
    }

    if (followingShot && gameRefs.ball.visible) {
      desiredPosition.set(ball.x * 0.24, 7.7 + Math.min(5.1, ball.length() * 0.065), ball.z - 13.8);
      lookAtTarget.set(ball.x * 0.5, Math.max(0.74, ball.y), ball.z + 3.8);
    } else {
      desiredPosition.set(0, 7.35, 16.7);
      lookAtTarget.set(0, 1.16, 1.2);
    }

    if (cameraPunch.current > 0.01) {
      const pulse = Math.sin(cameraPunch.current * Math.PI * 8);
      desiredPosition.x += pulse * cameraPunch.current * 0.16;
      desiredPosition.y += Math.abs(pulse) * cameraPunch.current * 0.06;
      cameraPunch.current = Math.max(0, cameraPunch.current - delta * 1.8);
    }

    const smoothing = 1 - Math.exp(-delta * 3.1);
    camera.position.lerp(desiredPosition, smoothing);
    camera.lookAt(lookAtTarget);
  });

  return null;
}
