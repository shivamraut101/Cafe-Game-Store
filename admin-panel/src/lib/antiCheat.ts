/**
 * Anti-Cheat Physics & Score Validation Engine
 * Validates whether a submitted score is physically possible within the elapsed game duration.
 */

export interface ScoreValidationResult {
  valid: boolean;
  maxAllowed: number;
  reason?: string;
}

export function validateGameScore(
  gameSlug: string,
  score: number,
  durationSeconds: number
): ScoreValidationResult {
  const duration = Math.max(1, durationSeconds || 1);

  let maxAllowed = 100;
  if (gameSlug === "coffee-tower") {
    // Physical block drop speed limit: ~2.5 blocks/sec maximum
    maxAllowed = Math.max(10, Math.ceil(duration * 2.5));
  } else if (gameSlug === "flappy-barista") {
    // Pipe frequency limit: ~1.2 pipes/sec maximum
    maxAllowed = Math.max(5, Math.ceil(duration * 1.2));
  } else if (gameSlug === "barista-catch") {
    // Falling items score limit: ~75 points/sec maximum
    maxAllowed = Math.max(100, Math.ceil(duration * 75));
  } else {
    maxAllowed = Math.max(50, Math.ceil(duration * 50));
  }

  if (score > maxAllowed) {
    return {
      valid: false,
      maxAllowed,
      reason: `Reported score (${score}) exceeds theoretical physics limit (${maxAllowed} in ${duration}s).`,
    };
  }

  return { valid: true, maxAllowed };
}
