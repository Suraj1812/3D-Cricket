# 3D Cricket

A polished 3D cricket chase game built with React, Vite, Three.js, @react-three/fiber, essential Drei helpers, Zustand, and Tailwind CSS.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Folder Structure

```text
src/
  components/        React UI and canvas composition
  game/              Three.js scene actors and cricket physics
  hooks/             Input hooks
  screens/           Start and game-over overlays
  store/             Zustand game state
  utils/             Shared math, scoring, and mutable render refs
  App.jsx
```

## Architecture

The app keeps high-frequency simulation work inside `useFrame` refs so React does not re-render every physics tick. Zustand stores only gameplay events and UI state: match phase, score, ball count, shot requests, delivery lifecycle, and feedback.

The 3D game is split into focused scene modules:

- `Ground.js` builds the field, pitch, stumps, boundary boards, floodlights, animated crowd bowl, and pitch-surface visuals.
- `Fielders.js` adds fielding positions and extra on-field life.
- `Bowler.js` animates AI run-up, release rhythm, and follow-through.
- `Bat.js` renders the batsman and blends shot-specific swing poses.
- `Ball.js` owns delivery variation, bounce, shot timing, wickets, ball trail, boundary detection, camera impact events, and scoring.
- `Physics.js` contains reusable vector physics, delivery profiles, swing, seam, spin, pitch-surface tuning, shot trajectories, and timing calculations.
- `GameCamera.jsx` handles smooth gameplay tracking, impact shake, FOV changes, and ball-follow angles.
- `useGameAudio.js` provides lightweight procedural impact audio without adding asset dependencies.

## Gameplay

- Chase 24 from one over.
- Select Defend, Drive, Loft, Sweep, or Pull for different risk and reward.
- Bowler varies length, line, pace, swing, seam, and spin based on match pressure.
- Pitch surfaces rotate between dry, green, and dusty conditions.
- Missed balls can beat the bat or hit the stumps.
- Timing, ball-by-ball history, wickets, run rate, target, match summary, and result feedback are surfaced in the UI.
