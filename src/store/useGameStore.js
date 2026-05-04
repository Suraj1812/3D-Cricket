import { create } from 'zustand';
import { describeRuns } from '../utils/scoring.js';
import { SHOT_MODES } from '../utils/shotModes.js';
import { SHOT_PLACEMENTS } from '../utils/shotPlacement.js';

const MAX_BALLS = 6;
const TARGET_SCORE = 24;
const MAX_WICKETS = 2;
const PITCH_SEQUENCE = ['dry', 'green', 'dusty'];
const BATTER_ORDER = ['Arjun Rao', 'Kabir Singh', 'Dev Mehta', 'Rohan Iyer', 'Vivaan Shah'];

export const MATCH_FORMATS = {
  superOver: {
    id: 'superOver',
    label: 'Super Over',
    shortLabel: 'Super',
    maxBalls: 6,
    maxWickets: 2,
    targetScore: 24,
  },
  proChase: {
    id: 'proChase',
    label: 'Pro Chase',
    shortLabel: 'Pro',
    maxBalls: 12,
    maxWickets: 3,
    targetScore: 42,
  },
  deathOvers: {
    id: 'deathOvers',
    label: 'Death Overs',
    shortLabel: 'Death',
    maxBalls: 18,
    maxWickets: 4,
    targetScore: 68,
  },
};

export const MATCH_FORMAT_LIST = [MATCH_FORMATS.superOver, MATCH_FORMATS.proChase, MATCH_FORMATS.deathOvers];

function clampScore(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createBatters() {
  return BATTER_ORDER.map((name) => ({
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    out: false,
    dismissal: null,
  }));
}

function getPressureLabel({ requiredRuns, remainingBalls, wickets, maxWickets, momentum }) {
  const requiredRate = requiredRuns / Math.max(1, remainingBalls);
  const wicketsLeft = Math.max(0, maxWickets - wickets);

  if (requiredRuns <= 0) {
    return 'Complete';
  }

  if (wicketsLeft <= 1 || requiredRate >= 4.2 || momentum < 24) {
    return 'Clutch';
  }

  if (requiredRate >= 3.1 || momentum < 42) {
    return 'Pressure';
  }

  if (momentum > 74) {
    return 'Flowing';
  }

  return 'Settled';
}

const initialState = {
  phase: 'start',
  matchId: 0,
  matchFormat: MATCH_FORMATS.superOver.id,
  score: 0,
  batsmanRuns: 0,
  batters: createBatters(),
  strikerIndex: 0,
  nonStrikerIndex: 1,
  nextBatterIndex: 2,
  partnershipRuns: 0,
  partnershipBalls: 0,
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
  shotPlacement: SHOT_PLACEMENTS.straight.id,
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
  pressureLabel: 'Settled',
  umpireCall: 'Play',
  bestShot: null,
  matchResult: null,
  impactEventId: 0,
  impactType: null,
  runningEventId: 0,
  runningEvent: null,
  fieldingEventId: 0,
  fieldingEvent: null,
  celebrationEventId: 0,
  celebration: null,
};

export const useGameStore = create((set, get) => ({
  ...initialState,

  startGame: () => {
    const state = get();
    const nextMatchId = state.matchId + 1;
    const matchFormat = MATCH_FORMATS[state.matchFormat] ?? MATCH_FORMATS.superOver;

    set({
      ...initialState,
      batters: createBatters(),
      matchId: nextMatchId,
      matchFormat: matchFormat.id,
      phase: 'playing',
      maxBalls: matchFormat.maxBalls,
      maxWickets: matchFormat.maxWickets,
      targetScore: matchFormat.targetScore,
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
    set({ ...initialState, batters: createBatters() });
  },

  setMatchFormat: (matchFormatId) => {
    const matchFormat = MATCH_FORMATS[matchFormatId] ?? MATCH_FORMATS.superOver;

    set({
      matchFormat: matchFormat.id,
      maxBalls: matchFormat.maxBalls,
      maxWickets: matchFormat.maxWickets,
      targetScore: matchFormat.targetScore,
    });
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

  setShotPlacement: (shotPlacement) => {
    const validPlacement = SHOT_PLACEMENTS[shotPlacement] ? shotPlacement : SHOT_PLACEMENTS.straight.id;
    set({ shotPlacement: validPlacement });
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
    const extraRuns = outcome.extraRuns ?? (outcome.extraType ? 1 : 0);
    const batRuns = outcome.batRuns ?? Math.max(0, runs - extraRuns);
    const legalDelivery = outcome.legalDelivery !== false;
    const nextBalls = state.balls + (legalDelivery ? 1 : 0);
    const nextScore = state.score + runs;
    const nextBatsmanRuns = state.batsmanRuns + batRuns;
    const nextWickets = state.wickets + (outcome.wicket ? 1 : 0);
    const targetReached = nextScore >= state.targetScore;
    const allOut = nextWickets >= state.maxWickets;
    const overDone = nextBalls >= state.maxBalls;
    const gameOver = overDone || allOut || targetReached;
    const matchResult = targetReached ? 'won' : allOut ? 'allOut' : overDone ? 'lost' : null;
    const timing = outcome.timing ?? state.lastTiming;
    const resultLabel = outcome.description ?? describeRuns(runs);
    const impactType = outcome.extraType ? 'call' : outcome.wicket ? 'wicket' : runs >= 6 ? 'six' : runs >= 4 ? 'four' : runs > 0 ? 'run' : 'dot';
    const nextFreeHit = outcome.extraType === 'No ball' ? true : legalDelivery ? false : state.freeHit;
    const boundary = outcome.boundary ?? (!outcome.extraType && runs >= 4);
    const currentBatters = state.batters ?? createBatters();
    const striker = currentBatters[state.strikerIndex] ?? currentBatters[0];
    const nextBatters = currentBatters.map((batter, index) => {
      if (index !== state.strikerIndex) {
        return batter;
      }

      return {
        ...batter,
        runs: batter.runs + batRuns,
        balls: batter.balls + (legalDelivery ? 1 : 0),
        fours: batter.fours + (batRuns === 4 ? 1 : 0),
        sixes: batter.sixes + (batRuns === 6 ? 1 : 0),
        out: batter.out || Boolean(outcome.wicket),
        dismissal: outcome.wicket ? outcome.wicketType ?? 'Out' : batter.dismissal,
      };
    });
    let nextStrikerIndex = state.strikerIndex;
    let nextNonStrikerIndex = state.nonStrikerIndex;
    let nextNextBatterIndex = state.nextBatterIndex;

    if (outcome.wicket && !allOut) {
      nextStrikerIndex = Math.min(state.nextBatterIndex, nextBatters.length - 1);
      nextNextBatterIndex = Math.min(state.nextBatterIndex + 1, nextBatters.length - 1);
    } else if (batRuns % 2 === 1) {
      nextStrikerIndex = state.nonStrikerIndex;
      nextNonStrikerIndex = state.strikerIndex;
    }

    if (legalDelivery && nextBalls % 6 === 0 && !gameOver) {
      const swap = nextStrikerIndex;
      nextStrikerIndex = nextNonStrikerIndex;
      nextNonStrikerIndex = swap;
    }

    const nextPartnershipRuns = outcome.wicket ? 0 : state.partnershipRuns + runs;
    const nextPartnershipBalls = outcome.wicket ? 0 : state.partnershipBalls + (legalDelivery ? 1 : 0);
    const momentumDelta =
      (boundary ? 10 : runs * 3) +
      (timing === 'Perfect' ? 8 : timing === 'Good' ? 4 : 0) -
      (outcome.wicket ? 22 : 0) -
      (runs === 0 && legalDelivery ? 6 : 0) +
      (outcome.extraType ? 4 : 0);
    const nextMomentum = clampScore(state.momentum + momentumDelta, 0, 100);
    const nextPressureLabel = getPressureLabel({
      requiredRuns: Math.max(0, state.targetScore - nextScore),
      remainingBalls: Math.max(1, state.maxBalls - nextBalls),
      wickets: nextWickets,
      maxWickets: state.maxWickets,
      momentum: nextMomentum,
    });
    const umpireCall = outcome.extraType ?? (outcome.wicket ? 'Out' : runs >= 6 ? 'Six' : runs >= 4 ? 'Four' : 'Play');
    const runningEvent =
      batRuns > 0 && batRuns < 4
        ? {
            deliveryId: outcome.deliveryId,
            runs: batRuns,
            urgency: clampScore((state.targetScore - nextScore) / Math.max(1, state.maxBalls - nextBalls) / 4, 0.28, 1),
            hesitation: timing === 'Late' || outcome.fieldEvent === 'stop',
            striker: striker?.name ?? 'Batter',
          }
        : null;
    const fieldingEvent =
      outcome.fieldEvent || outcome.wicket
        ? {
            deliveryId: outcome.deliveryId,
            type: outcome.fieldEvent ?? (outcome.wicket ? 'wicket' : null),
            role: outcome.fielder ?? null,
            position: outcome.fielderPosition ?? null,
            wicket: Boolean(outcome.wicket),
            runsSaved: outcome.fieldEvent === 'stop' ? Math.max(0, 2 - batRuns) : 0,
          }
        : null;
    const celebration = {
      deliveryId: outcome.deliveryId,
      type: targetReached ? 'win' : outcome.wicket ? 'wicket' : boundary ? 'boundary' : runs > 0 ? 'run' : outcome.extraType ? 'call' : 'dot',
      intensity: targetReached || runs >= 6 || outcome.wicket ? 1 : runs >= 4 ? 0.78 : runs > 0 ? 0.42 : 0.24,
      batting: targetReached || (!outcome.wicket && !outcome.extraType && runs > 0),
      fielding: outcome.wicket || runs === 0 || outcome.fieldEvent === 'stop',
    };
    const historyEntry = {
      id: outcome.deliveryId,
      runs,
      batRuns,
      legal: legalDelivery,
      extraType: outcome.extraType ?? null,
      extraRuns,
      timing,
      wicket: Boolean(outcome.wicket),
      boundary,
      mode: outcome.shotMode ?? state.shotMode,
      placement: outcome.shotPlacement ?? state.shotPlacement,
      label: resultLabel,
      striker: striker?.name ?? 'Batter',
      delivery: state.deliveryInfo?.name ?? outcome.deliveryType ?? null,
      wicketType: outcome.wicketType ?? null,
      fielder: outcome.fielder ?? null,
      fielderPosition: outcome.fielderPosition ?? null,
      fieldEvent: outcome.fieldEvent ?? null,
      fieldPlan: state.fieldPlan,
      shot: outcome.shot ?? null,
      accuracy: outcome.accuracy ?? null,
    };
    const nextBestShot =
      !outcome.wicket && batRuns > (state.bestShot?.batRuns ?? -1)
        ? historyEntry
        : state.bestShot;

    set({
      score: nextScore,
      batsmanRuns: nextBatsmanRuns,
      batters: nextBatters,
      strikerIndex: nextStrikerIndex,
      nonStrikerIndex: nextNonStrikerIndex,
      nextBatterIndex: nextNextBatterIndex,
      partnershipRuns: nextPartnershipRuns,
      partnershipBalls: nextPartnershipBalls,
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
      dotBalls: state.dotBalls + (batRuns === 0 && legalDelivery && !outcome.extraType ? 1 : 0),
      extras: state.extras + extraRuns,
      wides: state.wides + (outcome.extraType === 'Wide' ? 1 : 0),
      noBalls: state.noBalls + (outcome.extraType === 'No ball' ? 1 : 0),
      momentum: nextMomentum,
      pressureLabel: nextPressureLabel,
      umpireCall,
      bestShot: nextBestShot,
      matchResult,
      impactEventId: state.impactEventId + 1,
      impactType,
      runningEventId: state.runningEventId + (runningEvent ? 1 : 0),
      runningEvent,
      fieldingEventId: state.fieldingEventId + (fieldingEvent ? 1 : 0),
      fieldingEvent,
      celebrationEventId: state.celebrationEventId + 1,
      celebration,
    });

    return {
      accepted: true,
      gameOver,
    };
  },
}));
