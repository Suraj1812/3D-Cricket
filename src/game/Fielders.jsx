import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const FIELDERS = [
  [-9.5, 0, 13.5, 0.2],
  [10.5, 0, 13.2, -0.2],
  [-15.5, 0, 1.8, 0.9],
  [15.8, 0, 1.4, -0.9],
  [-12.8, 0, -9.5, 1.1],
  [12.4, 0, -10.2, -1.1],
  [0, 0, 19.5, 0],
  [0.95, 0, 7.75, Math.PI],
];

function Fielder({ position, rotation, index }) {
  const groupRef = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    const idle = Math.sin(clock.elapsedTime * 1.8 + index) * 0.025;
    groupRef.current.position.y = idle;
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.04, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.54, 8, 14]} />
        <meshStandardMaterial color={index % 2 === 0 ? '#1d4ed8' : '#2563eb'} roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh position={[0.15, 0.43, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.75} />
      </mesh>
      <mesh position={[-0.15, 0.43, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.58, 8, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.75} />
      </mesh>
    </group>
  );
}

export default function Fielders() {
  return (
    <group>
      {FIELDERS.map(([x, y, z, rotation], index) => (
        <Fielder key={`${x}-${z}`} position={[x, y, z]} rotation={rotation} index={index} />
      ))}
    </group>
  );
}
