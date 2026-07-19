import { dispatch, getElapsedMs, INITIAL_TIMER_ENGINE_STATE } from './timerEngine';
import type { Clock } from './clock';

function fakeClock(startMs: number): Clock & { advance: (ms: number) => void; set: (ms: number) => void } {
  let current = startMs;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
    set: (ms: number) => {
      current = ms;
    },
  };
}

describe('timerEngine.dispatch — transition table', () => {
  it('idle + START (no prep) -> active', () => {
    const clock = fakeClock(1000);
    const { state } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    expect(state.status).toBe('active');
    expect(state.phaseStartedAtMs).toBe(1000);
    expect(state.mode).toBe('BREATH_HOLD');
  });

  it('idle + START (with prepSeconds) -> preparing', () => {
    const clock = fakeClock(1000);
    const { state } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'DIVE', sessionId: 's1', prepSeconds: 5 },
      clock,
    );
    expect(state.status).toBe('preparing');
    expect(state.prepSeconds).toBe(5);
    expect(state.sessionId).toBe('s1');
  });

  it('idle + PAUSE/RESUME/STOP/CANCEL are all no-ops', () => {
    const clock = fakeClock(1000);
    for (const action of [{ type: 'PAUSE' }, { type: 'RESUME' }, { type: 'STOP' }, { type: 'CANCEL' }] as const) {
      const result = dispatch(INITIAL_TIMER_ENGINE_STATE, action, clock);
      expect(result.state).toBe(INITIAL_TIMER_ENGINE_STATE); // same reference back
      expect(result.capturedAttempt).toBeNull();
    }
  });

  it('idle + RESET is a no-op', () => {
    const clock = fakeClock(1000);
    const result = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'RESET' }, clock);
    expect(result.state).toBe(INITIAL_TIMER_ENGINE_STATE);
  });

  it('preparing + START is a no-op (double-tap guard)', () => {
    const clock = fakeClock(1000);
    const { state: preparing } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'BREATH_HOLD', sessionId: null, prepSeconds: 5 },
      clock,
    );
    clock.advance(500);
    const result = dispatch(preparing, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    expect(result.state).toBe(preparing);
  });

  it('preparing + PAUSE then RESUME accumulates paused time', () => {
    const clock = fakeClock(1000);
    const { state: preparing } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'BREATH_HOLD', sessionId: null, prepSeconds: 5 },
      clock,
    );
    clock.advance(1000);
    const { state: paused } = dispatch(preparing, { type: 'PAUSE' }, clock);
    expect(paused.pausedAtMs).toBe(2000);

    clock.advance(3000); // time passes while paused — must not count
    const { state: resumed } = dispatch(paused, { type: 'RESUME' }, clock);
    expect(resumed.pausedAtMs).toBeNull();
    expect(resumed.pausedAccumMs).toBe(3000);
  });

  it('preparing + PAUSE while already paused is a no-op', () => {
    const clock = fakeClock(1000);
    const { state: preparing } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'BREATH_HOLD', sessionId: null, prepSeconds: 5 },
      clock,
    );
    const { state: paused } = dispatch(preparing, { type: 'PAUSE' }, clock);
    const result = dispatch(paused, { type: 'PAUSE' }, clock);
    expect(result.state).toBe(paused);
  });

  it('preparing + RESUME while not paused is a no-op', () => {
    const clock = fakeClock(1000);
    const { state: preparing } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'BREATH_HOLD', sessionId: null, prepSeconds: 5 },
      clock,
    );
    const result = dispatch(preparing, { type: 'RESUME' }, clock);
    expect(result.state).toBe(preparing);
  });

  it('preparing + STOP skips remaining prep and counts as the attempt starting now', () => {
    const clock = fakeClock(1000);
    const { state: preparing } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'BREATH_HOLD', sessionId: null, prepSeconds: 5 },
      clock,
    );
    clock.advance(2000);
    const { state, capturedAttempt } = dispatch(preparing, { type: 'STOP' }, clock);
    expect(state.status).toBe('active');
    expect(state.phaseStartedAtMs).toBe(3000);
    expect(capturedAttempt).toBeNull(); // no attempt finished yet, just skipped prep
  });

  it('preparing + CANCEL resets to idle entirely (nothing was recorded yet)', () => {
    const clock = fakeClock(1000);
    const { state: preparing } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'BREATH_HOLD', sessionId: 's1', prepSeconds: 5 },
      clock,
    );
    const { state, capturedAttempt } = dispatch(preparing, { type: 'CANCEL' }, clock);
    expect(state).toEqual(INITIAL_TIMER_ENGINE_STATE);
    expect(capturedAttempt).toBeNull();
  });

  it('active + START is a no-op (double-tap guard)', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    const result = dispatch(active, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    expect(result.state).toBe(active);
  });

  it('active + STOP (first attempt) captures the attempt and moves to recovering', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(72_000);
    const { state, capturedAttempt } = dispatch(active, { type: 'STOP' }, clock);

    expect(state.status).toBe('recovering');
    expect(state.attemptIndex).toBe(1);
    expect(capturedAttempt).toEqual({
      attemptIndex: 0,
      startedAtMs: 1000,
      finishedAtMs: 73_000,
      durationMs: 72_000,
    });
  });

  it('active + STOP after a pause excludes paused time from the captured duration', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(10_000);
    const { state: paused } = dispatch(active, { type: 'PAUSE' }, clock);
    clock.advance(20_000); // paused time — should not count
    const { state: resumed } = dispatch(paused, { type: 'RESUME' }, clock);
    clock.advance(5_000);
    const { capturedAttempt } = dispatch(resumed, { type: 'STOP' }, clock);

    expect(capturedAttempt?.durationMs).toBe(15_000); // 10s + 5s active, 20s paused excluded
  });

  it('active + CANCEL on the first attempt resets entirely (nothing was recorded yet)', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(5000);
    const { state, capturedAttempt } = dispatch(active, { type: 'CANCEL' }, clock);
    expect(state).toEqual(INITIAL_TIMER_ENGINE_STATE);
    expect(capturedAttempt).toBeNull();
  });

  it('recovering + START begins the next attempt within the same session (attemptIndex preserved)', () => {
    const clock = fakeClock(1000);
    const { state: active1 } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'DIVE', sessionId: 's1' }, clock);
    clock.advance(60_000);
    const { state: recovering } = dispatch(active1, { type: 'STOP' }, clock);
    expect(recovering.attemptIndex).toBe(1);

    clock.advance(30_000); // recovery interval
    const { state: active2 } = dispatch(recovering, { type: 'START', mode: 'DIVE', sessionId: 's1' }, clock);
    expect(active2.status).toBe('active');
    expect(active2.attemptIndex).toBe(1); // still attempt #2 (0-indexed 1), unchanged by this transition
    expect(active2.mode).toBe('DIVE');
    expect(active2.sessionId).toBe('s1');
    expect(active2.phaseStartedAtMs).toBe(clock.now());
  });

  it('active + CANCEL on a later attempt discards only the in-flight attempt, keeping prior ones', () => {
    const clock = fakeClock(1000);
    const { state: active1 } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(60_000);
    const { state: recovering } = dispatch(active1, { type: 'STOP' }, clock);
    clock.advance(30_000);
    const { state: active2 } = dispatch(recovering, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);

    clock.advance(10_000);
    const { state, capturedAttempt } = dispatch(active2, { type: 'CANCEL' }, clock);
    expect(state.status).toBe('recovering');
    expect(state.attemptIndex).toBe(1); // unchanged — the in-flight attempt was discarded, not counted
    expect(capturedAttempt).toBeNull();
  });

  it('recovering + STOP ends the session (prior attempts stand)', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(60_000);
    const { state: recovering } = dispatch(active, { type: 'STOP' }, clock);
    const { state, capturedAttempt } = dispatch(recovering, { type: 'STOP' }, clock);
    expect(state.status).toBe('done');
    expect(capturedAttempt).toBeNull();
  });

  it('recovering + CANCEL has the same effect as STOP — ends the session', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(60_000);
    const { state: recovering } = dispatch(active, { type: 'STOP' }, clock);
    const { state } = dispatch(recovering, { type: 'CANCEL' }, clock);
    expect(state.status).toBe('done');
  });

  it('done + START/PAUSE/RESUME/STOP/CANCEL are all no-ops', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(1000);
    const { state: recovering } = dispatch(active, { type: 'STOP' }, clock);
    const { state: done } = dispatch(recovering, { type: 'STOP' }, clock);
    expect(done.status).toBe('done');

    for (const action of [{ type: 'PAUSE' }, { type: 'RESUME' }, { type: 'STOP' }, { type: 'CANCEL' }] as const) {
      const result = dispatch(done, action, clock);
      expect(result.state).toBe(done);
    }
  });

  it('done + RESET returns to idle', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    const { state: recovering } = dispatch(active, { type: 'STOP' }, clock);
    const { state: done } = dispatch(recovering, { type: 'STOP' }, clock);
    const { state } = dispatch(done, { type: 'RESET' }, clock);
    expect(state).toEqual(INITIAL_TIMER_ENGINE_STATE);
  });

  it('cancelled-equivalent (idle after a first-attempt cancel) + RESET is a no-op since status is already idle', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    const { state: idleAgain } = dispatch(active, { type: 'CANCEL' }, clock);
    expect(idleAgain.status).toBe('idle');
    const result = dispatch(idleAgain, { type: 'RESET' }, clock);
    expect(result.state).toBe(idleAgain);
  });
});

describe('getElapsedMs — correctness across simulated time jumps', () => {
  it('is 0 before any phase has started (idle)', () => {
    const clock = fakeClock(1000);
    expect(getElapsedMs(INITIAL_TIMER_ENGINE_STATE, clock)).toBe(0);
  });

  it('reflects wall-clock elapsed time regardless of how many "rerenders" (repeated reads) occur', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(5000);
    expect(getElapsedMs(active, clock)).toBe(5000);
    expect(getElapsedMs(active, clock)).toBe(5000); // repeated read, same state object — no drift
    clock.advance(1);
    expect(getElapsedMs(active, clock)).toBe(5001);
  });

  it('freezes at the paused instant while paused, even as real time continues to pass', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(10_000);
    const { state: paused } = dispatch(active, { type: 'PAUSE' }, clock);
    expect(getElapsedMs(paused, clock)).toBe(10_000);
    clock.advance(60_000); // simulates the app being backgrounded/locked for a minute
    expect(getElapsedMs(paused, clock)).toBe(10_000); // unchanged — frozen at the pause instant
  });

  it('correctly reconstructs elapsed time after a simulated "quit and relaunch" — a fresh clock far ahead of a persisted phaseStartedAtMs', () => {
    // Simulates: attempt started, app force-quit, device sits idle, app relaunches
    // minutes later and rehydrates the exact same TimerEngineState snapshot from
    // the FileSystem-backed store with a fresh Clock instance.
    const originalClock = fakeClock(1_000_000);
    const { state: activeAtQuit } = dispatch(
      INITIAL_TIMER_ENGINE_STATE,
      { type: 'START', mode: 'DIVE', sessionId: 's1' },
      originalClock,
    );
    originalClock.advance(30_000); // 30s elapsed before the process is killed

    // The persisted snapshot is exactly `activeAtQuit` (phaseStartedAtMs = 1_000_000).
    // "Relaunch 5 minutes later" = a brand-new clock reading a much later real time.
    const relaunchClock = fakeClock(1_000_000 + 30_000 + 5 * 60_000);
    const elapsedSinceRelaunch = getElapsedMs(activeAtQuit, relaunchClock);

    expect(elapsedSinceRelaunch).toBe(30_000 + 5 * 60_000); // the full quit-to-relaunch gap is included, correctly
  });

  it('accounts for pausedAccumMs correctly even across a relaunch (paused before quitting)', () => {
    const clock = fakeClock(1_000_000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    clock.advance(10_000);
    const { state: paused } = dispatch(active, { type: 'PAUSE' }, clock);
    // App is quit while paused; relaunch happens on a fresh clock reading much later.
    const relaunchClock = fakeClock(1_000_000 + 10_000 + 3 * 60_000);
    expect(getElapsedMs(paused, relaunchClock)).toBe(10_000); // still frozen at the pause instant
  });

  it('never returns a negative value even if the clock somehow reads earlier than phaseStartedAtMs', () => {
    const clock = fakeClock(1000);
    const { state: active } = dispatch(INITIAL_TIMER_ENGINE_STATE, { type: 'START', mode: 'BREATH_HOLD', sessionId: null }, clock);
    const clockBefore = fakeClock(500); // simulates a device clock rollback
    expect(getElapsedMs(active, clockBefore)).toBe(0);
  });
});
