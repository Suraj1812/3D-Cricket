import { create } from 'zustand';
import { describeRuns } from '../utils/scoring.js';
import { SHOT_MODES } from '../utils/shotModes.js';

const MAX_BALLS = 6;
const TARGET_SCORE = 24;
const MAX_WICKETS = 2;
const PITCH_SEQUENCE = ['dry', 'green', 'dusty'];

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
  pitchCondition: PITCH_SEQUENCE[0],
  cameraMode: 'bat',
  message: 'Ready',
  lastTiming: null,
  lastRuns: null,
  lastOutcome: null,
  shotFeedback: null,
  deliveryInfo: null,
  history: [],
  boundaryCount: 0,
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
      message: 'Bowler running in',
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
    const nextBalls = state.balls + 1;
    const nextScore = state.score + runs;
    const nextWickets = state.wickets + (outcome.wicket ? 1 : 0);
    const targetReached = nextScore >= state.targetScore;
    const allOut = nextWickets >= state.maxWickets;
    const overDone = nextBalls >= state.maxBalls;
    const gameOver = overDone || allOut || targetReached;
    const matchResult = targetReached ? 'won' : allOut ? 'allOut' : overDone ? 'lost' : null;
    const timing = outcome.timing ?? state.lastTiming;
    const resultLabel = outcome.description ?? describeRuns(runs);
    const impactType = outcome.wicket ? 'wicket' : runs >= 6 ? 'six' : runs >= 4 ? 'four' : runs > 0 ? 'run' : 'dot';
    const historyEntry = {
      id: outcome.deliveryId,
      runs,
      timing,
      wicket: Boolean(outcome.wicket),
      boundary: runs >= 4,
      mode: outcome.shotMode ?? state.shotMode,
      label: resultLabel,
      delivery: state.deliveryInfo?.name ?? outcome.deliveryType ?? null,
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
      phase: gameOver ? 'gameOver' : 'playing',
      completedDeliveryId: outcome.deliveryId,
      ballState: 'settled',
      message: resultLabel,
      lastRuns: runs,
      lastTiming: timing,
      lastOutcome: historyEntry,
      shotFeedback: resultLabel,
      history: [...state.history, historyEntry],
      boundaryCount: state.boundaryCount + (runs >= 4 ? 1 : 0),
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
