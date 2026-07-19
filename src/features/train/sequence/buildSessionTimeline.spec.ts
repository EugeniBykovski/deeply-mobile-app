import { buildSessionTimeline } from './buildSessionTimeline';
import type { TrainingStep } from '@/api/types';

function totalDuration(steps: TrainingStep[]): number {
  return steps.reduce((sum, s) => sum + s.durationSeconds, 0);
}

function hasAdjacentDuplicatePhase(steps: { phase: string }[]): boolean {
  return steps.some((s, i) => i > 0 && steps[i - 1].phase === s.phase);
}

describe('buildSessionTimeline', () => {
  it('returns an empty timeline for empty steps or non-positive repeats', () => {
    expect(buildSessionTimeline([], 3)).toEqual([]);
    expect(buildSessionTimeline([{ phase: 'INHALE', durationSeconds: 4 }], 0)).toEqual([]);
    expect(buildSessionTimeline([{ phase: 'INHALE', durationSeconds: 4 }], -1)).toEqual([]);
  });

  it('one round: passes a single round through with roundIndex 0, no merging needed', () => {
    const steps: TrainingStep[] = [
      { phase: 'INHALE', durationSeconds: 4 },
      { phase: 'HOLD', durationSeconds: 7 },
      { phase: 'EXHALE', durationSeconds: 8 },
      { phase: 'REST', durationSeconds: 2 },
    ];
    const timeline = buildSessionTimeline(steps, 1);
    expect(timeline).toEqual(steps.map((s) => ({ ...s, roundIndex: 0 })));
  });

  it('two rounds with a distinct start/end phase: simple concatenation, no merge', () => {
    const steps: TrainingStep[] = [
      { phase: 'INHALE', durationSeconds: 4 },
      { phase: 'HOLD', durationSeconds: 7 },
      { phase: 'EXHALE', durationSeconds: 8 },
      { phase: 'REST', durationSeconds: 2 },
    ];
    const timeline = buildSessionTimeline(steps, 2);
    expect(timeline).toHaveLength(8);
    expect(timeline.map((s) => s.phase)).toEqual([
      'INHALE', 'HOLD', 'EXHALE', 'REST',
      'INHALE', 'HOLD', 'EXHALE', 'REST',
    ]);
    expect(timeline.map((s) => s.roundIndex)).toEqual([0, 0, 0, 0, 1, 1, 1, 1]);
    expect(!hasAdjacentDuplicatePhase(timeline)).toBe(true);
  });

  it('multiple rounds (5): still no adjacent duplicates, total duration preserved', () => {
    const steps: TrainingStep[] = [
      { phase: 'INHALE', durationSeconds: 4 },
      { phase: 'EXHALE', durationSeconds: 6 },
    ];
    const timeline = buildSessionTimeline(steps, 5);
    expect(!hasAdjacentDuplicatePhase(timeline)).toBe(true);
    expect(totalDuration(timeline)).toBe(totalDuration(steps) * 5);
  });

  it('inhale -> inhale round boundary: merges into one step with summed duration', () => {
    // Ends on INHALE (mid-cycle truncation, as buildSteps in PrivateTrainingFormScreen can produce)
    const steps: TrainingStep[] = [
      { phase: 'INHALE', durationSeconds: 4 },
      { phase: 'HOLD', durationSeconds: 7 },
      { phase: 'EXHALE', durationSeconds: 8 },
      { phase: 'HOLD', durationSeconds: 5 },
      { phase: 'INHALE', durationSeconds: 4 }, // truncated cycle re-enters INHALE
    ];
    const timeline = buildSessionTimeline(steps, 2);
    // Round 0's trailing INHALE merges with round 1's leading INHALE; round 1's
    // own trailing INHALE has nothing after it to merge with, so it stays.
    expect(timeline.map((s) => s.phase)).toEqual([
      'INHALE', 'HOLD', 'EXHALE', 'HOLD', 'INHALE', 'HOLD', 'EXHALE', 'HOLD', 'INHALE',
    ]);
    expect(timeline).toHaveLength(9);
    // The merged boundary step (index 4) has the two INHALE durations summed: 4 + 4 = 8
    expect(timeline[4]).toEqual({ phase: 'INHALE', durationSeconds: 8, roundIndex: 1 });
    expect(!hasAdjacentDuplicatePhase(timeline)).toBe(true);
    expect(totalDuration(timeline)).toBe(totalDuration(steps) * 2);
  });

  it('recovery (REST) -> recovery round boundary: merges the same way', () => {
    // A round starting and ending on REST — the boundary between rounds is REST -> REST.
    const steps: TrainingStep[] = [
      { phase: 'REST', durationSeconds: 3 },
      { phase: 'INHALE', durationSeconds: 4 },
      { phase: 'EXHALE', durationSeconds: 6 },
      { phase: 'REST', durationSeconds: 10 },
    ];
    const timeline = buildSessionTimeline(steps, 2);
    expect(timeline.map((s) => s.phase)).toEqual(['REST', 'INHALE', 'EXHALE', 'REST', 'INHALE', 'EXHALE', 'REST']);
    expect(timeline[3]).toEqual({ phase: 'REST', durationSeconds: 13, roundIndex: 1 });
    expect(!hasAdjacentDuplicatePhase(timeline)).toBe(true);
    expect(totalDuration(timeline)).toBe(totalDuration(steps) * 2);
  });

  it('different adjacent phases: never merges non-duplicates, preserves every step', () => {
    const steps: TrainingStep[] = [
      { phase: 'INHALE', durationSeconds: 4 },
      { phase: 'HOLD', durationSeconds: 7 },
      { phase: 'EXHALE', durationSeconds: 8 },
      { phase: 'REST', durationSeconds: 2 },
    ];
    const timeline = buildSessionTimeline(steps, 4);
    expect(timeline).toHaveLength(16);
    expect(totalDuration(timeline)).toBe(totalDuration(steps) * 4);
  });

  it('custom sequences: an arbitrary user-defined order with its own internal adjacent duplicate also gets merged', () => {
    const customSteps: TrainingStep[] = [
      { phase: 'HOLD', durationSeconds: 5 },
      { phase: 'HOLD', durationSeconds: 5 }, // intentionally adjacent-duplicate within a single round
      { phase: 'EXHALE', durationSeconds: 6 },
    ];
    const timeline = buildSessionTimeline(customSteps, 1);
    expect(timeline).toEqual([
      { phase: 'HOLD', durationSeconds: 10, roundIndex: 0 },
      { phase: 'EXHALE', durationSeconds: 6, roundIndex: 0 },
    ]);
  });

  it('invariant: no two adjacent timeline entries ever share a phase — the guarantee any future audio/haptic cue relies on to fire exactly once per real transition', () => {
    const cases: [TrainingStep[], number][] = [
      [[{ phase: 'INHALE', durationSeconds: 4 }, { phase: 'INHALE', durationSeconds: 4 }], 1],
      [[{ phase: 'INHALE', durationSeconds: 4 }, { phase: 'HOLD', durationSeconds: 7 }, { phase: 'EXHALE', durationSeconds: 8 }, { phase: 'HOLD', durationSeconds: 5 }, { phase: 'INHALE', durationSeconds: 4 }], 6],
      [[{ phase: 'REST', durationSeconds: 2 }], 10],
    ];
    for (const [steps, repeats] of cases) {
      const timeline = buildSessionTimeline(steps, repeats);
      expect(hasAdjacentDuplicatePhase(timeline)).toBe(false);
    }
  });

  it('preserves total duration exactly under merging (matches steps-sum * repeats, so completion-threshold math elsewhere stays correct)', () => {
    const steps: TrainingStep[] = [
      { phase: 'INHALE', durationSeconds: 3 },
      { phase: 'HOLD', durationSeconds: 9 },
      { phase: 'EXHALE', durationSeconds: 5 },
    ];
    for (const repeats of [1, 2, 3, 7]) {
      const timeline = buildSessionTimeline(steps, repeats);
      expect(totalDuration(timeline)).toBe(totalDuration(steps) * repeats);
    }
  });
});
