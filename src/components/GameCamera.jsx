import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { gameRefs } from '../utils/gameRefs.js';

export default function GameCamera() {
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);
  const lastCompletedDelivery = useRef(0);
  const lastImpactEventId = useRef(0);
  const cameraPunch = useRef(0);
  const shakePower = useRef(0);

  useFrame(({ camera }, delta) => {
    const state = useGameStore.getState();
    const ball = gameRefs.ball.position;
    const followingShot = state.ballState === 'hit' || state.ballState === 'settled';

    if (state.completedDeliveryId !== lastCompletedDelivery.current) {
      lastCompletedDelivery.current = state.completedDeliveryId;
      cameraPunch.current = state.lastRuns >= 4 ? 1 : 0.35;
    }

    if (state.impactEventId !== lastImpactEventId.current) {
      lastImpactEventId.current = state.impactEventId;
      shakePower.current = state.impactType === 'perfect' || state.impactType === 'six' ? 1 : 0.45;
    }

    const distance = Math.hypot(ball.x, ball.z);

    if (followingShot && gameRefs.ball.visible && distance > 22) {
      desiredPosition.set(ball.x * 0.42, 12.6, ball.z - 18.5);
      lookAtTarget.set(ball.x * 0.7, Math.max(1.1, ball.y), ball.z + 2.4);
    } else if (followingShot && gameRefs.ball.visible) {
      desiredPosition.set(ball.x * 0.24, 7.7 + Math.min(5.1, ball.length() * 0.065), ball.z - 13.8);
      lookAtTarget.set(ball.x * 0.5, Math.max(0.74, ball.y), ball.z + 3.8);
    } else if (state.ballState === 'released' || state.ballState === 'hittable') {
      desiredPosition.set(0, 5.95, 13.8);
      lookAtTarget.set(ball.x * 0.26, Math.max(0.9, ball.y), ball.z + 0.55);
    } else {
      desiredPosition.set(0, 6.35, 15.35);
      lookAtTarget.set(0, 1.2, 2.15);
    }

    if (cameraPunch.current > 0.01) {
      const pulse = Math.sin(cameraPunch.current * Math.PI * 8);
      desiredPosition.x += pulse * cameraPunch.current * 0.16;
      desiredPosition.y += Math.abs(pulse) * cameraPunch.current * 0.06;
      cameraPunch.current = Math.max(0, cameraPunch.current - delta * 1.8);
    }

    if (shakePower.current > 0.01) {
      const shakeTime = performance.now() * 0.04;
      desiredPosition.x += Math.sin(shakeTime) * shakePower.current * 0.11;
      desiredPosition.y += Math.cos(shakeTime * 1.3) * shakePower.current * 0.06;
      shakePower.current = Math.max(0, shakePower.current - delta * 4.2);
    }

    const smoothing = 1 - Math.exp(-delta * (followingShot ? 3.6 : 4.4));
    camera.position.lerp(desiredPosition, smoothing);
    camera.fov += ((followingShot ? 38 : 42) - camera.fov) * (1 - Math.exp(-delta * 3.2));
    camera.updateProjectionMatrix();
    camera.lookAt(lookAtTarget);
  });

  return null;
}
