import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { FIELD_RADIUS } from './Physics.js';
import { useGameStore } from '../store/useGameStore.js';

function Stumps({ z }) {
  const stumpPositions = [-0.22, 0, 0.22];

  return (
    <group position={[0, 0.38, z]}>
      {stumpPositions.map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.76, 10]} />
          <meshStandardMaterial color="#f5f1dc" roughness={0.62} />
        </mesh>
      ))}
      <mesh position={[0, 0.39, 0]} castShadow>
        <boxGeometry args={[0.56, 0.035, 0.035]} />
        <meshStandardMaterial color="#f5f1dc" roughness={0.62} />
      </mesh>
    </group>
  );
}

function CreaseLine({ z, width = 3.25 }) {
  return (
    <mesh position={[0, 0.071, z]} receiveShadow>
      <boxGeometry args={[width, 0.012, 0.035]} />
      <meshStandardMaterial color="#f7f2e7" roughness={0.7} />
    </mesh>
  );
}

function StadiumStands() {
  const stands = Array.from({ length: 28 }, (_, index) => {
    const angle = (index / 28) * Math.PI * 2;
    const radius = FIELD_RADIUS + 6.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    return {
      id: index,
      angle,
      x,
      z,
      height: index % 3 === 0 ? 2.8 : 2.05,
    };
  });

  return (
    <group>
      {stands.map((stand) => (
        <mesh
          key={stand.id}
          position={[stand.x, stand.height / 2 - 0.06, stand.z]}
          rotation={[0, -stand.angle, 0]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[3.3, stand.height, 1.2]} />
          <meshStandardMaterial color={stand.id % 2 === 0 ? '#314f70' : '#d0a94c'} roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function GrassStripes() {
  const stripes = Array.from({ length: 13 }, (_, index) => ({
    id: index,
    x: -24 + index * 4,
    color: index % 2 === 0 ? '#56a96b' : '#3f915d',
  }));

  return (
    <group>
      {stripes.map((stripe) => (
        <mesh
          key={stripe.id}
          position={[stripe.x, 0.017, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI * 0.04]}
          receiveShadow
        >
          <planeGeometry args={[2.4, FIELD_RADIUS * 1.72]} />
          <meshStandardMaterial color={stripe.color} transparent opacity={0.24} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function BoundaryBoards() {
  const boards = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    const radius = FIELD_RADIUS + 0.65;

    return {
      id: index,
      angle,
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      color: ['#111827', '#b91c1c', '#0f766e', '#334155', '#f59e0b', '#1d4ed8'][index % 6],
    };
  });

  return (
    <group>
      {boards.map((board) => (
        <mesh
          key={board.id}
          position={[board.x, 0.34, board.z]}
          rotation={[0, -board.angle, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.7, 0.68, 0.16]} />
          <meshStandardMaterial color={board.color} roughness={0.55} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

function PitchWear() {
  const patches = [
    [-0.52, -3.4, 0.38, 0.18],
    [0.36, -1.2, 0.28, 0.14],
    [-0.28, 1.1, 0.3, 0.12],
    [0.48, 3.25, 0.36, 0.16],
    [0.04, -5.8, 0.42, 0.13],
  ];

  return (
    <group>
      {patches.map(([x, z, width, height], index) => (
        <mesh key={index} position={[x, 0.083, z]} rotation={[-Math.PI / 2, 0, index * 0.55]} scale={[width, height, 1]}>
          <circleGeometry args={[1, 18]} />
          <meshStandardMaterial color="#b39163" transparent opacity={0.42} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function CrowdBowl() {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const palette = useMemo(
    () => ['#eab308', '#ef4444', '#38bdf8', '#f8fafc', '#22c55e', '#fb7185'],
    [],
  );

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    const color = new THREE.Color();
    const count = meshRef.current.count;

    for (let index = 0; index < count; index += 1) {
      const ring = index % 4;
      const angle = (index / count) * Math.PI * 2 * 4.6 + ring * 0.18;
      const radius = FIELD_RADIUS + 5.2 + ring * 1.25;
      dummy.position.set(Math.cos(angle) * radius, 1.35 + ring * 0.28, Math.sin(angle) * radius);
      dummy.rotation.y = -angle;
      dummy.scale.setScalar(0.72 + (index % 5) * 0.04);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);
      meshRef.current.setColorAt(index, color.set(palette[index % palette.length]));
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [dummy, palette]);

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.55) * 0.004;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 320]} castShadow receiveShadow>
      <boxGeometry args={[0.28, 0.34, 0.18]} />
      <meshStandardMaterial roughness={0.86} vertexColors />
    </instancedMesh>
  );
}

function Floodlight({ angle }) {
  const radius = FIELD_RADIUS + 9.4;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  return (
    <group position={[x, 0, z]} rotation={[0, -angle, 0]}>
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 6.4, 10]} />
        <meshStandardMaterial color="#475569" roughness={0.62} metalness={0.18} />
      </mesh>
      <mesh position={[0, 6.55, -0.18]} rotation={[0.22, 0, 0]} castShadow>
        <boxGeometry args={[1.25, 0.72, 0.18]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f2d58a" emissiveIntensity={0.38} roughness={0.28} />
      </mesh>
      <pointLight position={[0, 6.45, -0.8]} intensity={1.25} distance={45} color="#fff1bf" />
    </group>
  );
}

function SightScreens() {
  return (
    <group>
      <mesh position={[0, 2.1, 11.5]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 3.4, 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.1, -15.4]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 3.4, 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function Ground() {
  const pitchCondition = useGameStore((state) => state.pitchCondition);
  const pitchColor = {
    dry: '#cfae77',
    green: '#bba873',
    dusty: '#c59a6a',
  }[pitchCondition] ?? '#cfae77';
  const pitchTopColor = {
    dry: '#d6bd89',
    green: '#c4b97e',
    dusty: '#c99a6b',
  }[pitchCondition] ?? '#d6bd89';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[FIELD_RADIUS, 128]} />
        <meshStandardMaterial color="#4b9f68" roughness={0.94} />
      </mesh>
      <GrassStripes />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <ringGeometry args={[18, 18.08, 96]} />
        <meshStandardMaterial color="#d9e1b8" roughness={0.8} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
        <ringGeometry args={[FIELD_RADIUS - 0.34, FIELD_RADIUS - 0.18, 128]} />
        <meshStandardMaterial color="#f6f0df" roughness={0.72} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} castShadow receiveShadow>
        <torusGeometry args={[FIELD_RADIUS - 0.2, 0.075, 8, 160]} />
        <meshStandardMaterial color="#f7f2e7" roughness={0.55} />
      </mesh>

      <mesh position={[0, 0.035, -0.9]} receiveShadow>
        <boxGeometry args={[3.25, 0.07, 17.8]} />
        <meshStandardMaterial color={pitchColor} roughness={0.86} />
      </mesh>

      <mesh position={[0, 0.074, -0.9]} receiveShadow>
        <boxGeometry args={[2.62, 0.014, 16.8]} />
        <meshStandardMaterial color={pitchTopColor} roughness={0.88} />
      </mesh>

      <PitchWear />

      <CreaseLine z={6.65} />
      <CreaseLine z={5.9} width={4.2} />
      <CreaseLine z={-8.4} />
      <CreaseLine z={-9.15} width={4.2} />

      <Stumps z={6.85} />
      <Stumps z={-8.6} />
      <SightScreens />
      <BoundaryBoards />
      <StadiumStands />
      <CrowdBowl />
      {[Math.PI * 0.22, Math.PI * 0.78, Math.PI * 1.22, Math.PI * 1.78].map((angle) => (
        <Floodlight key={angle} angle={angle} />
      ))}
    </group>
  );
}
