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
  } else if (gameSlug === "drop-merge") {
    // Cascading fruit/gem merge combos: ~120 points/sec maximum
    maxAllowed = Math.max(300, Math.ceil(duration * 120));
  } else if (gameSlug === "brick-breaker") {
    // Multi-ball ricochet streams: ~150 points/sec maximum
    maxAllowed = Math.max(400, Math.ceil(duration * 150));
  } else if (gameSlug === "helix-drop") {
    // Spiral descent and destroyer mode smashes: ~80 points/sec maximum
    maxAllowed = Math.max(250, Math.ceil(duration * 80));
  } else if (gameSlug === "sky-hopper") {
    // Platform hopping, altitude ascent and star bursts: ~120 points/sec maximum
    maxAllowed = Math.max(300, Math.ceil(duration * 120));
  } else if (gameSlug === "air-hockey") {
    // 2-Player tabletop air hockey goals (max 15 goals per match)
    maxAllowed = Math.max(15, Math.ceil(duration * 0.5));
  } else if (gameSlug === "tap-war") {
    // 2-Player tug-of-war rounds & rapid taps (max ~20 taps/sec)
    maxAllowed = Math.max(100, Math.ceil(duration * 25));
  } else {
    maxAllowed = Math.max(200, Math.ceil(duration * 100));
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
