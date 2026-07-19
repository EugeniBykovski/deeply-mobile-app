export interface Clock {
  now(): number;
}

/**
 * Real wall-clock time (Date.now()), not a monotonic/steady-state clock —
 * deliberately, since a true monotonic clock can pause advancing during
 * deep device sleep, which would undercount real elapsed time exactly
 * when a long backgrounded hold/dive needs it most. Injectable so tests
 * can simulate arbitrary time jumps (backgrounding, relaunch after quit).
 */
export const systemClock: Clock = {
  now: () => Date.now(),
};
