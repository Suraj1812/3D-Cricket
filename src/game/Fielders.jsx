import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { gameRefs } from '../utils/gameRefs.js';
import { getFieldPlan } from '../utils/fielding.js';
import { clamp } from '../utils/math.js';

function Fielder({ fielder, index }) {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const armRef = useRef(null);
  const baseX = fielder.x;
  const baseZ = fielder.z;

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    const ball = gameRefs.ball;
    const dx = ball.position.x - baseX;
    const dz = ball.position.z - baseZ;
    const distance = Math.hypot(dx, dz);
    const alertness = ball.visible ? clamp(1 - distance / (fielder.close ? 6 : 9), 0, 1) : 0;
    const idle = Math.sin(clock.elapsedTime * 1.8 + index) * 0.025;
    const chaseX = distance > 0.001 ? (dx / distance) * alertness * (fielder.close ? 0.26 : 0.46) : 0;
    const chaseZ = distance > 0.001 ? (dz / distance) * alertness * (fielder.close ? 0.22 : 0.42) : 0;

    groupRef.current.position.set(baseX + chaseX, idle + alertness * 0.04, baseZ + chaseZ);

    if (alertness > 0.02) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    } else {
      groupRef.current.rotation.y = fielder.rotation;
    }

    if (bodyRef.current) {
      bodyRef.current.rotation.x = -alertness * 0.18;
      bodyRef.current.rotation.z = Math.sin(clock.elapsedTime * 2.4 + index) * 0.018;
    }

    if (armRef.current) {
      armRef.current.rotation.x = -0.2 - alertness * 0.55;
    }
  });

  return (
    <group ref={groupRef} position={[baseX, 0, baseZ]} rotation={[0, fielder.rotation, 0]}>
      <mesh ref={bodyRef} position={[0, 1.04, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.54, 8, 14]} />
        <meshStandardMaterial color={fielder.close ? '#1e40af' : index % 2 === 0 ? '#1d4ed8' : '#2563eb'} roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.22, -0.28]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.045]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh ref={armRef} position={[0.23, 1.08, -0.02]} rotation={[-0.2, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.055, 0.42, 8, 10]} />
        <meshStandardMaterial color="#8f553e" roughness={0.56} />
      </mesh>
      <mesh position={[-0.22, 1.08, -0.02]} rotation={[-0.2, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.055, 0.42, 8, 10]} />
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
  const fieldPlanKey = useGameStore((state) => state.fieldPlan);
  const plan = getFieldPlan(fieldPlanKey);

  return (
    <group>
      {plan.positions.map((fielder, index) => (
        <Fielder key={fielder.id} fielder={fielder} index={index} />
      ))}
    </group>
  );
}
