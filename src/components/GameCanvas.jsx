import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Ball from '../game/Ball.js';
import Bat from '../game/Bat.js';
import Bowler from '../game/Bowler.js';
import Fielders from '../game/Fielders.js';
import Ground from '../game/Ground.js';
import GameCamera from './GameCamera.jsx';
import { useGameStore } from '../store/useGameStore.js';

export default function GameCanvas() {
  const playShot = useGameStore((state) => state.playShot);

  return (
    <Canvas
      className="game-canvas absolute inset-0"
      camera={{ position: [0, 7.2, 16.2], fov: 42, near: 0.1, far: 130 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
      onPointerDown={() => playShot()}
    >
      <color attach="background" args={['#9cc7d0']} />
      <fog attach="fog" args={['#9cc7d0', 34, 82]} />
      <Sky sunPosition={[70, 34, 18]} distance={450000} turbidity={4.5} rayleigh={0.8} />

      <ambientLight intensity={0.54} />
      <hemisphereLight args={['#d8f4ff', '#3f6b48', 1.35]} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[9, 16, 7]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={52}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
      />

      <Ground />
      <Fielders />
      <Bowler />
      <Bat />
      <Ball />
      <GameCamera />
    </Canvas>
  );
}
