import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { clamp, easeOutCubic } from '../utils/math.js';

const THROW_POINTS = 18;
const KEEPER_TARGET = new THREE.Vector3(0.76, 1.05, 7.42);
const STUMP_TARGET = new THREE.Vector3(0, 0.82, 6.78);

export default function FieldingAction() {
  const fieldingEventId = useGameStore((state) => state.fieldingEventId);
  const lineRef = useRef(null);
  const ballRef = useRef(null);
  const materialRef = useRef(null);
  const progressRef = useRef(1);
  const startRef = useRef(new THREE.Vector3());
  const endRef = useRef(KEEPER_TARGET.clone());
  const buffer = useMemo(() => new Float32Array(THROW_POINTS * 3), []);

  useEffect(() => {
    const event = useGameStore.getState().fieldingEvent;

    if (!event?.position || event.type !== 'stop') {
      return;
    }

    progressRef.current = 0;
    startRef.current.set(event.position.x, 0.84, event.position.z);
    endRef.current.copy(event.runsSaved > 0 ? STUMP_TARGET : KEEPER_TARGET);

    if (lineRef.current) {
      lineRef.current.visible = true;
    }

    if (ballRef.current) {
      ballRef.current.visible = true;
    }
  }, [fieldingEventId]);

  useFrame((_, delta) => {
    if (!lineRef.current || !ballRef.current || !materialRef.current) {
      return;
    }

    progressRef.current = Math.min(1, progressRef.current + delta * 1.95);

    if (progressRef.current >= 1) {
      lineRef.current.visible = false;
      ballRef.current.visible = false;
      return;
    }

    const progress = easeOutCubic(progressRef.current);
    const alpha = clamp((1 - progressRef.current) * 0.82, 0, 0.82);
    const current = getArcPoint(startRef.current, endRef.current, progress);

    for (let index = 0; index < THROW_POINTS; index += 1) {
      const pointProgress = clamp(progress - (THROW_POINTS - index) * 0.018, 0, 1);
      const point = getArcPoint(startRef.current, endRef.current, pointProgress);

      buffer[index * 3] = point.x;
      buffer[index * 3 + 1] = point.y;
      buffer[index * 3 + 2] = point.z;
    }

    lineRef.current.geometry.attributes.position.needsUpdate = true;
    materialRef.current.opacity = alpha;
    ballRef.current.position.copy(current);
  });

  return (
    <group>
      <line ref={lineRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buffer, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={materialRef} color="#dbeafe" transparent opacity={0} depthWrite={false} />
      </line>
      <mesh ref={ballRef} visible={false} castShadow>
        <sphereGeometry args={[0.11, 14, 14]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.42} emissive="#60a5fa" emissiveIntensity={0.16} />
      </mesh>
    </group>
  );
}

function getArcPoint(start, end, progress) {
  const point = start.clone().lerp(end, progress);
  const height = Math.sin(progress * Math.PI) * 2.6;

  point.y += height;
  return point;
}
