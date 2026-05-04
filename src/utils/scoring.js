export function formatOvers(balls) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

export function formatDeliveryCount(balls, maxBalls) {
  return `${balls}/${maxBalls}`;
}

export function describeRuns(runs) {
  if (runs === 0) {
    return 'Dot ball';
  }

  if (runs === 1) {
    return '1 run';
  }

  return `${runs} runs`;
}

export function getRequiredRuns(score, targetScore) {
  return Math.max(0, targetScore - score);
}

export function getRunRate(score, balls) {
  if (balls === 0) {
    return '0.0';
  }

  return ((score / balls) * 6).toFixed(1);
}
