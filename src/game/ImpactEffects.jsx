import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { gameRefs } from '../utils/gameRefs.js';
import { clamp, easeOutCubic } from '../utils/math.js';

const PARTICLE_COUNT = 18;

const EFFECTS = {
  perfect: { color: '#ffe589', power: 1.7, height: 0.95, ring: 1.45 },
  contact: { color: '#f8e7b6', power: 1.15, height: 0.65, ring: 1.05 },
  six: { color: '#facc15', power: 1.95, height: 1.1, ring: 1.7 },
  four: { color: '#fde68a', power: 1.45, height: 0.8, ring: 1.35 },
  wicket: { color: '#fb7185', power: 1.55, height: 0.9, ring: 1.35 },
  field: { color: '#93c5fd', power: 0.95, height: 0.52, ring: 0.9 },
  bounce: { color: '#d2b17c', power: 0.7, height: 0.32, ring: 0.82 },
  call: { color: '#bfdbfe', power: 0.8, height: 0.4, ring: 0.7 },
  run: { color: '#bbf7d0', power: 0.82, height: 0.38, ring: 0.7 },
  dot: { color: '#cbd5e1', power: 0.58, height: 0.26, ring: 0.55 },
};

function buildParticleDirections() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
    const spread = 0.54 + (index % 5) * 0.12;

    return new THREE.Vector3(Math.cos(angle) * spread, 0.28 + (index % 4) * 0.08, Math.sin(angle) * spread);
  });
}

export default function ImpactEffects() {
  const impactEventId = useGameStore((state) => state.impactEventId);
  const impactType = useGameStore((state) => state.impactType);
  const burstRef = useRef({
    life: 0,
    origin: new THREE.Vector3(),
    config: EFFECTS.contact,
  });
  const ringRef = useRef(null);
  const ringMaterialRef = useRef(null);
  const particlesRef = useRef(null);
  const particleMaterialRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const directions = useMemo(buildParticleDirections, []);

  useEffect(() => {
    if (impactEventId === 0) {
      return;
    }

    const config = EFFECTS[impactType] ?? EFFECTS.contact;
    const origin = gameRefs.ball.visible ? gameRefs.ball.position : gameRefs.batsman.position;

    burstRef.current.life = 1;
    burstRef.current.origin.copy(origin);
    burstRef.current.origin.y = Math.max(0.08, origin.y);
    burstRef.current.config = config;

    if (ringMaterialRef.current) {
      ringMaterialRef.current.color.set(config.color);
    }

    if (particleMaterialRef.current) {
      particleMaterialRef.current.color.set(config.color);
    }
  }, [impactEventId, impactType]);

  useFrame((_, delta) => {
    const burst = burstRef.current;

    if (!ringRef.current || !particlesRef.current || !ringMaterialRef.current || !particleMaterialRef.current) {
      return;
    }

    burst.life = Math.max(0, burst.life - delta * 2.8);

    if (burst.life <= 0.001) {
      ringRef.current.visible = false;
      particlesRef.current.visible = false;
      return;
    }

    const age = 1 - burst.life;
    const eased = easeOutCubic(age);
    const alpha = clamp(burst.life * 0.64, 0, 0.64);
    const groundY = Math.max(0.075, Math.min(0.22, burst.origin.y * 0.28));

    ringRef.current.visible = true;
    ringRef.current.position.set(burst.origin.x, groundY, burst.origin.z);
    ringRef.current.scale.setScalar(0.35 + eased * burst.config.ring);
    ringMaterialRef.current.opacity = alpha * 0.7;

    particlesRef.current.visible = true;
    particleMaterialRef.current.opacity = alpha;

    directions.forEach((direction, index) => {
      const lift = Math.sin(eased * Math.PI) * burst.config.height;
      const drift = burst.config.power * eased;

      dummy.position.set(
        burst.origin.x + direction.x * drift,
        groundY + lift + direction.y * burst.life * 0.28,
        burst.origin.z + direction.z * drift,
      );
      dummy.scale.setScalar((0.06 + (index % 3) * 0.012) * (0.65 + burst.life));
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(index, dummy.matrix);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.34, 0.4, 42]} />
        <meshBasicMaterial ref={ringMaterialRef} color="#f8e7b6" transparent opacity={0} depthWrite={false} />
      </mesh>
      <instancedMesh ref={particlesRef} args={[undefined, undefined, PARTICLE_COUNT]} visible={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial ref={particleMaterialRef} color="#f8e7b6" transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
