import { isPracticeLocked } from './entitlement.types';

describe('isPracticeLocked', () => {
  it('locks a premium practice for a free/anonymous user (no trial, no Pro)', () => {
    expect(isPracticeLocked(true, false)).toBe(true);
  });

  it('unlocks a premium practice during an active trial or with active Pro', () => {
    expect(isPracticeLocked(true, true)).toBe(false);
  });

  it('never locks the one free (non-premium) introductory practice per topic, regardless of access', () => {
    expect(isPracticeLocked(false, false)).toBe(false);
    expect(isPracticeLocked(false, true)).toBe(false);
  });

  it('is the exact guard a deep link straight to a run/session screen must fail for a locked practice', () => {
    // Simulates a hand-crafted deep link straight to /train/run or /dive/session
    // for a premium practice, for a user with no trial/Pro access — the run
    // screens compute this exact expression from route params + useEntitlement()
    // and must render the locked sheet instead of the play UI.
    const deepLinkedIsPremium = true;
    const userHasFullAccess = false;
    expect(isPracticeLocked(deepLinkedIsPremium, userHasFullAccess)).toBe(true);
  });
});
