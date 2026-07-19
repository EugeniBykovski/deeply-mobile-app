import type { TrainingStep } from '@/api/types';

export interface TimelineStep extends TrainingStep {
  /** 0-indexed round this step belongs to (or continues into, if merged). */
  roundIndex: number;
}

/**
 * Flattens a single round's `steps` into the full multi-round session
 * timeline, merging adjacent identical phases at any boundary (most
 * commonly where one round ends and the next begins) into a single step
 * with the summed duration — never dropping time, never leaving two
 * consecutive steps with the same phase.
 *
 * This is the one place round-repetition + phase-adjacency is resolved;
 * every consumer (timer/wave visualization, progress display, and any
 * future audio/haptic cue) reads this output instead of re-deriving
 * round boundaries itself.
 */
export function buildSessionTimeline(steps: TrainingStep[], repeats: number): TimelineStep[] {
  if (steps.length === 0 || repeats <= 0) return [];

  const out: TimelineStep[] = [];

  for (let round = 0; round < repeats; round++) {
    for (const step of steps) {
      const last = out[out.length - 1];
      if (last && last.phase === step.phase) {
        out[out.length - 1] = {
          phase: last.phase,
          durationSeconds: last.durationSeconds + step.durationSeconds,
          roundIndex: round,
        };
      } else {
        out.push({ phase: step.phase, durationSeconds: step.durationSeconds, roundIndex: round });
      }
    }
  }

  return out;
}
