import { create } from 'zustand';
import { describeRuns } from '../utils/scoring.js';
import { SHOT_MODES } from '../utils/shotModes.js';

const MAX_BALLS = 6;
const TARGET_SCORE = 24;
const MAX_WICKETS = 2;
const PITCH_SEQUENCE = ['dry', 'green', 'dusty'];

function clampScore(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const initialState = {
  phase: 'start',
  matchId: 0,
  score: 0,
  balls: 0,
  wickets: 0,
  maxBalls: MAX_BALLS,
  maxWickets: MAX_WICKETS,
  targetScore: TARGET_SCORE,
  deliveryId: 0,
  completedDeliveryId: 0,
  swingRequestId: 0,
  ballState: 'idle',
  shotMode: SHOT_MODES.drive.id,
  freeHit: false,
  pitchCondition: PITCH_SEQUENCE[0],
  cameraMode: 'bat',
  message: 'Ready',
  lastTiming: null,
  lastRuns: null,
  lastOutcome: null,
  shotFeedback: null,
  deliveryInfo: null,
  fieldPlan: 'balanced',
  history: [],
  boundaryCount: 0,
  fieldingSaves: 0,
  catches: 0,
  dotBalls: 0,
  extras: 0,
  wides: 0,
  noBalls: 0,
  momentum: 52,
  umpireCall: 'Play',
  bestShot: null,
  matchResult: null,
  impactEventId: 0,
  impactType: null,
};

export const useGameStore = create((set, get) => ({
  ...initialState,

  startGame: () => {
    const nextMatchId = get().matchId + 1;

    set({
      ...initialState,
      matchId: nextMatchId,
      phase: 'playing',
      pitchCondition: PITCH_SEQUENCE[(nextMatchId - 1) % PITCH_SEQUENCE.length],
      deliveryId: 1,
      ballState: 'runup',
      message: 'Bowler running in',
      fieldPlan: 'balanced',
    });
  },

  restartGame: () => {
    get().startGame();
  },

  resetToStart: () => {
    set({ ...initialState });
  },

  startNextDelivery: () => {
    const state = get();

    if (state.phase !== 'playing' || state.balls >= state.maxBalls) {
      return;
    }

    set({
      deliveryId: state.deliveryId + 1,
      ballState: 'runup',
      message: state.freeHit ? 'Free hit' : 'Bowler running in',
      lastTiming: null,
      lastRuns: null,
      lastOutcome: null,
      shotFeedback: null,
      deliveryInfo: null,
    });
  },

  setShotMode: (shotMode) => {
    const validMode = SHOT_MODES[shotMode] ? shotMode : SHOT_MODES.drive.id;
    set({ shotMode: validMode });
  },

  playShot: () => {
    const state = get();

    if (state.phase !== 'playing' || state.ballState === 'settled') {
      return;
    }

    set({ swingRequestId: state.swingRequestId + 1 });
  },

  setBallState: (ballState, message) => {
    const state = get();

    if (state.ballState === ballState && state.message === message) {
      return;
    }

    set({ ballState, message });
  },

  setShotFeedback: (feedback) => {
    set({
      lastTiming: feedback.timing,
      shotFeedback: feedback.label,
    });
  },

  setDeliveryInfo: (deliveryInfo) => {
    set({ deliveryInfo });
  },

  setFieldPlan: (fieldPlan) => {
    set({ fieldPlan });
  },

  setCameraMode: (cameraMode) => {
    set({ cameraMode });
  },

  registerImpact: (impactType = 'contact') => {
    const state = get();
    set({
      impactEventId: state.impactEventId + 1,
      impactType,
    });
  },

  completeDelivery: (outcome) => {
    const state = get();

    if (state.completedDeliveryId === outcome.deliveryId) {
      return {
        accepted: false,
        gameOver: state.phase === 'gameOver',
      };
    }

    const runs = outcome.runs ?? 0;
    const legalDelivery = outcome.legalDelivery !== false;
    const nextBalls = state.balls + (legalDelivery ? 1 : 0);
    const nextScore = state.score + runs;
    const nextWickets = state.wickets + (outcome.wicket ? 1 : 0);
    const targetReached = nextScore >= state.targetScore;
    const allOut = nextWickets >= state.maxWickets;
    const overDone = nextBalls >= state.maxBalls;
    const gameOver = overDone || allOut || targetReached;
    const matchResult = targetReached ? 'won' : allOut ? 'allOut' : overDone ? 'lost' : null;
    const timing = outcome.timing ?? state.lastTiming;
    const resultLabel = outcome.description ?? describeRuns(runs);
    const extraRuns = outcome.extraRuns ?? (outcome.extraType ? 1 : 0);
    const impactType = outcome.extraType ? 'call' : outcome.wicket ? 'wicket' : runs >= 6 ? 'six' : runs >= 4 ? 'four' : runs > 0 ? 'run' : 'dot';
    const nextFreeHit = outcome.extraType === 'No ball' ? true : legalDelivery ? false : state.freeHit;
    const boundary = outcome.boundary ?? (!outcome.extraType && runs >= 4);
    const momentumDelta =
      (boundary ? 10 : runs * 3) +
      (timing === 'Perfect' ? 8 : timing === 'Good' ? 4 : 0) -
      (outcome.wicket ? 22 : 0) -
      (runs === 0 && legalDelivery ? 6 : 0) +
      (outcome.extraType ? 4 : 0);
    const nextMomentum = clampScore(state.momentum + momentumDelta, 0, 100);
    const umpireCall = outcome.extraType ?? (outcome.wicket ? 'Out' : runs >= 6 ? 'Six' : runs >= 4 ? 'Four' : 'Play');
    const historyEntry = {
      id: outcome.deliveryId,
      runs,
      legal: legalDelivery,
      extraType: outcome.extraType ?? null,
      extraRuns,
      timing,
      wicket: Boolean(outcome.wicket),
      boundary,
      mode: outcome.shotMode ?? state.shotMode,
      label: resultLabel,
      delivery: state.deliveryInfo?.name ?? outcome.deliveryType ?? null,
      wicketType: outcome.wicketType ?? null,
      fielder: outcome.fielder ?? null,
      fieldEvent: outcome.fieldEvent ?? null,
      fieldPlan: state.fieldPlan,
      shot: outcome.shot ?? null,
      accuracy: outcome.accuracy ?? null,
    };
    const nextBestShot =
      !outcome.wicket && runs > (state.bestShot?.runs ?? -1)
        ? historyEntry
        : state.bestShot;

    set({
      score: nextScore,
      balls: nextBalls,
      wickets: nextWickets,
      freeHit: nextFreeHit,
      phase: gameOver ? 'gameOver' : 'playing',
      completedDeliveryId: outcome.deliveryId,
      ballState: 'settled',
      message: resultLabel,
      lastRuns: runs,
      lastTiming: timing,
      lastOutcome: historyEntry,
      shotFeedback: resultLabel,
      history: [...state.history, historyEntry],
      boundaryCount: state.boundaryCount + (boundary ? 1 : 0),
      fieldingSaves: state.fieldingSaves + (outcome.fieldEvent === 'stop' ? 1 : 0),
      catches: state.catches + (outcome.fieldEvent === 'catch' ? 1 : 0),
      dotBalls: state.dotBalls + (runs === 0 && legalDelivery ? 1 : 0),
      extras: state.extras + extraRuns,
      wides: state.wides + (outcome.extraType === 'Wide' ? 1 : 0),
      noBalls: state.noBalls + (outcome.extraType === 'No ball' ? 1 : 0),
      momentum: nextMomentum,
      umpireCall,
      bestShot: nextBestShot,
      matchResult,
      impactEventId: state.impactEventId + 1,
      impactType,
    });

    return {
      accepted: true,
      gameOver,
    };
  },
}));
