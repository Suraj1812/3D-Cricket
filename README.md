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
- `Fielders.js` renders pressure-based field placements, a reactive wicketkeeper, non-striker presence, and fielder movement.
- `Bowler.js` animates AI run-up, release rhythm, and follow-through.
- `Bat.js` renders the batsman with shot-specific swing poses, run-between-wickets animation, balance shifts, helmet grille, pads, crest, and bat decals.
- `Ball.js` owns delivery variation, bounce, shot timing, LBW/bowled/caught outcomes, fielder stops, ball trail, boundary detection, camera impact events, extras, and scoring.
- `Physics.js` contains reusable vector physics, delivery profiles, swing, seam, spin, pitch-surface tuning, shot trajectories, and timing calculations.
- `fielding.js` contains attacking, balanced, and defensive field plans plus catch/save evaluation.
- `FieldingAction.jsx` renders return throws after fielding stops so stops feel complete.
- `playerMotion.js` keeps striker and non-striker sprint timing coordinated.
- `Umpire.js` renders match-official call gestures for boundaries, wickets, wides, and no-balls.
- `GameCamera.jsx` handles smooth gameplay tracking, impact shake, FOV changes, and ball-follow angles.
- `ImpactEffects.jsx` renders lightweight contact, bounce, fielding, and wicket particles without extra dependencies.
- `useGameAudio.js` provides lightweight procedural impact audio without adding asset dependencies.

## Gameplay

- Choose Super Over, Pro Chase, or Death Overs formats with matching balls, wickets, and targets.
- Select Defend, Drive, Loft, Sweep, or Pull for different risk and reward.
- Aim leg-side, straight, or off-side to shape placement and wagon-wheel results.
- Bowler varies length, line, pace, swing, seam, and spin based on match pressure.
- Shot effectiveness now responds to delivery length, so pull, drive, sweep, loft, and defense each have better and worse matchups.
- Field placements adapt between attacking, balanced, and boundary-saving setups.
- Striker and non-striker run between wickets with urgency, hesitation, stride, turning, and coordinated crease switching.
- Fielders chase, lean, smother, catch, throw, and react to wicket/save events.
- Wicketkeeper crouches, tracks lateral movement, raises gloves, and reacts to catches/wickets.
- Bowler shows follow-through, appeals, wicket celebration, and frustration after boundaries.
- Mistimed aerial shots can be caught; grounded shots can be stopped by fielders.
- Misses can produce bowled, LBW, or beaten outcomes depending on line and height.
- Wides and no-balls are non-legal deliveries with extras and free-hit logic.
- Umpire calls, field radar, extras, bat runs, dot balls, saves, partnership, striker rotation, and momentum are surfaced in the HUD.
- Pitch surfaces rotate between dry, green, and dusty conditions.
- Timing, ball-by-ball history, wickets, run rate, target, batting card, wagon wheel, match summary, and result feedback are surfaced in the UI.
