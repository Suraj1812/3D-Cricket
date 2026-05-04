# 3D Cricket

A complete 3D cricket mini-game built with React, Vite, Three.js, @react-three/fiber, minimal Drei helpers, Zustand, and Tailwind CSS.

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

- `Ground.js` builds the field, pitch, stumps, boundary, and lightweight stadium.
- `Bowler.js` animates the AI run-up and delivery pose.
- `Bat.js` renders the batsman and handles swing animation from player input.
- `Ball.js` owns delivery, bounce, shot timing, boundary detection, and scoring events.
- `Physics.js` contains reusable vector physics and timing calculations.
