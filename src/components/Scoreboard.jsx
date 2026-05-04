import { useState } from 'react';
import { formatDeliveryCount, formatOvers, getRequiredRuns, getRunRate } from '../utils/scoring.js';
import { useGameStore } from '../store/useGameStore.js';
import { getShotModeConfig } from '../utils/shotModes.js';
import { getFieldPlan } from '../utils/fielding.js';
import { getShotPlacementConfig } from '../utils/shotPlacement.js';
import FieldRadar from './FieldRadar.jsx';

export default function Scoreboard() {
  const [openPanel, setOpenPanel] = useState(null);
  const score = useGameStore((state) => state.score);
  const batsmanRuns = useGameStore((state) => state.batsmanRuns);
  const batters = useGameStore((state) => state.batters);
  const strikerIndex = useGameStore((state) => state.strikerIndex);
  const nonStrikerIndex = useGameStore((state) => state.nonStrikerIndex);
  const partnershipRuns = useGameStore((state) => state.partnershipRuns);
  const partnershipBalls = useGameStore((state) => state.partnershipBalls);
  const balls = useGameStore((state) => state.balls);
  const wickets = useGameStore((state) => state.wickets);
  const maxBalls = useGameStore((state) => state.maxBalls);
  const maxWickets = useGameStore((state) => state.maxWickets);
  const targetScore = useGameStore((state) => state.targetScore);
  const message = useGameStore((state) => state.message);
  const lastTiming = useGameStore((state) => state.lastTiming);
  const lastRuns = useGameStore((state) => state.lastRuns);
  const phase = useGameStore((state) => state.phase);
  const history = useGameStore((state) => state.history);
  const boundaryCount = useGameStore((state) => state.boundaryCount);
  const fieldingSaves = useGameStore((state) => state.fieldingSaves);
  const dotBalls = useGameStore((state) => state.dotBalls);
  const extras = useGameStore((state) => state.extras);
  const momentum = useGameStore((state) => state.momentum);
  const pressureLabel = useGameStore((state) => state.pressureLabel);
  const freeHit = useGameStore((state) => state.freeHit);
  const umpireCall = useGameStore((state) => state.umpireCall);
  const fieldPlan = useGameStore((state) => state.fieldPlan);
  const shotMode = useGameStore((state) => state.shotMode);
  const shotPlacement = useGameStore((state) => state.shotPlacement);
  const deliveryInfo = useGameStore((state) => state.deliveryInfo);
  const pitchCondition = useGameStore((state) => state.pitchCondition);
  const selectedMode = getShotModeConfig(shotMode);
  const selectedPlacement = getShotPlacementConfig(shotPlacement);
  const selectedField = getFieldPlan(fieldPlan);
  const requiredRuns = getRequiredRuns(score, targetScore);
  const striker = batters?.[strikerIndex];
  const nonStriker = batters?.[nonStrikerIndex];
  const legalHistory = history.filter((entry) => entry.legal !== false);
  const ballMarkers = Array.from({ length: maxBalls }, (_, index) => legalHistory[index] ?? null);
  const pressureTone =
    pressureLabel === 'Clutch'
      ? 'hud-pressure-danger'
      : pressureLabel === 'Pressure'
        ? 'hud-pressure-warning'
        : 'hud-pressure-calm';

  return (
    <div className="scoreboard-shell pointer-events-none absolute left-0 right-0 top-0 z-20">
      <div className="hud-topbar mx-auto flex w-full max-w-6xl items-start justify-between gap-2">
        <div className="hud-score-card">
          <div className="flex items-end gap-1.5">
            <span className="hud-score-main">{score}</span>
            <span className="pb-0.5 text-sm font-black text-emerald-200">/{wickets}</span>
            <span className="pb-0.5 text-xs font-bold text-slate-200">{formatOvers(balls)}</span>
          </div>
          <div className="hud-score-meta">
            <span>T{targetScore}</span>
            <span>{requiredRuns} need</span>
            <span>{formatDeliveryCount(balls, maxBalls)}</span>
          </div>
        </div>

        <div className="hud-center-card min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-center gap-2">
            <span className={`hud-pressure ${pressureTone}`}>{pressureLabel}</span>
            <p className="truncate text-sm font-black text-white">{phase === 'playing' ? message : '3D Cricket'}</p>
            {freeHit ? <span className="hud-free-hit">FH</span> : null}
          </div>
          <div className="hud-ball-row" aria-label="Ball history">
            {ballMarkers.map((entry, index) => (
              <span
                key={index}
                className={`hud-ball-dot ${
                  entry?.wicket
                    ? 'hud-ball-wicket'
                    : entry?.runs >= 4
                      ? 'hud-ball-boundary'
                      : entry
                        ? 'hud-ball-scored'
                        : ''
                }`}
                title={`Ball ${index + 1}`}
              >
                {entry ? (entry.wicket ? 'W' : entry.runs) : index + 1}
              </span>
            ))}
          </div>
          <div className="hud-batter-line">
            <span>{striker?.name ?? 'Striker'}* {striker?.runs ?? 0}({striker?.balls ?? 0})</span>
            <span className="hidden sm:inline">{nonStriker?.name ?? 'Non-striker'} {nonStriker?.runs ?? 0}({nonStriker?.balls ?? 0})</span>
            <span className="hidden md:inline">P {partnershipRuns}({partnershipBalls})</span>
          </div>
        </div>

        <div className="hud-actions pointer-events-auto">
          <button
            type="button"
            className={`hud-icon-button ${openPanel === 'radar' ? 'hud-icon-button-active' : ''}`}
            aria-label="Toggle field radar"
            title="Field radar"
            onClick={() => setOpenPanel(openPanel === 'radar' ? null : 'radar')}
          >
            <span aria-hidden="true">⌖</span>
          </button>
          <button
            type="button"
            className={`hud-icon-button ${openPanel === 'score' ? 'hud-icon-button-active' : ''}`}
            aria-label="Toggle match stats"
            title="Match stats"
            onClick={() => setOpenPanel(openPanel === 'score' ? null : 'score')}
          >
            <span aria-hidden="true">▦</span>
          </button>
        </div>
      </div>

      {openPanel ? (
        <div className="hud-popover pointer-events-auto">
          {openPanel === 'radar' ? (
            <>
              <FieldRadar />
              <div className="hud-popover-grid">
                <span>Shot</span>
                <strong>{selectedMode.label} / {selectedPlacement.label}</strong>
                <span>Field</span>
                <strong>{deliveryInfo?.field ?? selectedField.shortLabel}</strong>
                <span>Ball</span>
                <strong>{deliveryInfo?.name ?? lastTiming ?? 'Ready'}</strong>
              </div>
            </>
          ) : (
            <div className="hud-popover-grid">
              <span>Rate</span>
              <strong>{getRunRate(score, balls)}</strong>
              <span>Wickets</span>
              <strong>{wickets}/{maxWickets}</strong>
              <span>Bat runs</span>
              <strong>{batsmanRuns}</strong>
              <span>Last</span>
              <strong>{lastRuns === null ? '-' : `${lastRuns}R`}</strong>
              <span>Boundaries</span>
              <strong>{boundaryCount}</strong>
              <span>Dots</span>
              <strong>{dotBalls}</strong>
              <span>Extras</span>
              <strong>{extras}</strong>
              <span>Saves</span>
              <strong>{fieldingSaves}</strong>
              <span>Flow</span>
              <strong>{momentum}</strong>
              <span>Umpire</span>
              <strong>{umpireCall}</strong>
              <span>Pitch</span>
              <strong>{deliveryInfo?.surface ?? pitchCondition}</strong>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
