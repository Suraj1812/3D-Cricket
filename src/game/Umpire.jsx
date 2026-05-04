import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { easeOutCubic } from '../utils/math.js';

export default function Umpire() {
  const groupRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const callRef = useRef(0);
  const lastDeliveryRef = useRef(0);

  useFrame((_, delta) => {
    const state = useGameStore.getState();

    if (state.completedDeliveryId !== lastDeliveryRef.current) {
      lastDeliveryRef.current = state.completedDeliveryId;
      callRef.current = 0;
    }

    callRef.current = Math.min(1, callRef.current + delta * 2.8);
    const gesture = easeOutCubic(callRef.current);

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(performance.now() * 0.002) * 0.008;
    }

    if (!leftArmRef.current || !rightArmRef.current) {
      return;
    }

    leftArmRef.current.rotation.set(-0.18, 0, 0.34);
    rightArmRef.current.rotation.set(-0.18, 0, -0.34);

    if (state.umpireCall === 'Wide') {
      leftArmRef.current.rotation.z = 1.45 * gesture;
      rightArmRef.current.rotation.z = -1.45 * gesture;
    } else if (state.umpireCall === 'No ball') {
      rightArmRef.current.rotation.x = -1.6 * gesture;
      rightArmRef.current.rotation.z = -0.08;
    } else if (state.umpireCall === 'Out') {
      rightArmRef.current.rotation.x = -2.7 * gesture;
      rightArmRef.current.rotation.z = 0.02;
    } else if (state.umpireCall === 'Six') {
      leftArmRef.current.rotation.x = -2.6 * gesture;
      rightArmRef.current.rotation.x = -2.6 * gesture;
      leftArmRef.current.rotation.z = 0.18;
      rightArmRef.current.rotation.z = -0.18;
    } else if (state.umpireCall === 'Four') {
      rightArmRef.current.rotation.z = -0.95 * Math.sin(gesture * Math.PI * 2.5);
    }
  });

  return (
    <group ref={groupRef} position={[-1.45, 0, -10.4]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.62, 8, 14]} />
        <meshStandardMaterial color="#121820" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.58, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <boxGeometry args={[0.44, 0.09, 0.3]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.62} />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.28, 1.23, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.48, 8, 10]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.28, 1.23, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.48, 8, 10]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh position={[0.12, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.62, 8, 10]} />
        <meshStandardMaterial color="#1f2937" roughness={0.72} />
      </mesh>
      <mesh position={[-0.12, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.62, 8, 10]} />
        <meshStandardMaterial color="#1f2937" roughness={0.72} />
      </mesh>
    </group>
  );
}
