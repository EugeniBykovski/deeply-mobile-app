import type { Clock } from './clock';

export type TimerMode = 'BREATH_HOLD' | 'DIVE';
export type TimerStatus = 'idle' | 'preparing' | 'active' | 'recovering' | 'done' | 'cancelled';

export interface TimerEngineState {
  status: TimerStatus;
  mode: TimerMode | null;
  sessionId: string | null;
  /** 0-based index of the attempt currently in progress (or about to start). */
  attemptIndex: number;
  prepSeconds: number | null;
  phaseStartedAtMs: number | null;
  pausedAtMs: number | null;
  pausedAccumMs: number;
}

export const INITIAL_TIMER_ENGINE_STATE: TimerEngineState = {
  status: 'idle',
  mode: null,
  sessionId: null,
  attemptIndex: 0,
  prepSeconds: null,
  phaseStartedAtMs: null,
  pausedAtMs: null,
  pausedAccumMs: 0,
};

export type TimerAction =
  | { type: 'START'; mode: TimerMode; sessionId: string | null; prepSeconds?: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

export interface CapturedAttempt {
  attemptIndex: number;
  startedAtMs: number;
  finishedAtMs: number;
  /** Pause-aware active duration — excludes any paused time. */
  durationMs: number;
}

export interface DispatchResult {
  state: TimerEngineState;
  /** Non-null exactly when STOP finalizes an in-progress attempt (active -> recovering). */
  capturedAttempt: CapturedAttempt | null;
}

const PAUSABLE_STATUSES: TimerStatus[] = ['preparing', 'active', 'recovering'];

function noop(state: TimerEngineState): DispatchResult {
  return { state, capturedAttempt: null };
}

function elapsedMsAt(state: TimerEngineState, nowMs: number): number {
  if (state.phaseStartedAtMs === null) return 0;
  const end = state.pausedAtMs ?? nowMs;
  return Math.max(0, end - state.phaseStartedAtMs - state.pausedAccumMs);
}

/**
 * Elapsed time is always computed from timestamps, never accumulated by a
 * counter — this is what makes it correct across rerenders, backgrounding,
 * device lock, notification interrupts, screen changes, resuming, and frame
 * drops, all with zero special-case code. The only scenario that needs
 * persistence (not just this) is a killed process — see activeAttemptStore.
 */
export function getElapsedMs(state: TimerEngineState, clock: Clock): number {
  return elapsedMsAt(state, clock.now());
}

/**
 * Pure reducer — no side effects, no RN/timer APIs. Illegal transitions for
 * the current status are no-ops (the same kind of state back, not a throw),
 * which makes dispatching a duplicate/rapid action harmless by construction
 * (the "accidental double taps" requirement) rather than needing a separate
 * UI-level debounce for correctness.
 */
export function dispatch(state: TimerEngineState, action: TimerAction, clock: Clock): DispatchResult {
  const now = clock.now();

  switch (action.type) {
    case 'START': {
      if (state.status === 'recovering') {
        // Begin the next attempt within the same session — attemptIndex was
        // already advanced by the STOP that produced this recovering state.
        const prepSeconds = action.prepSeconds ?? null;
        const status: TimerStatus = prepSeconds && prepSeconds > 0 ? 'preparing' : 'active';
        return noop({
          ...state,
          status,
          prepSeconds,
          phaseStartedAtMs: now,
          pausedAtMs: null,
          pausedAccumMs: 0,
        });
      }
      if (state.status !== 'idle' && state.status !== 'done' && state.status !== 'cancelled') {
        return noop(state); // preparing/active -> no-op (double-tap guard)
      }
      const prepSeconds = action.prepSeconds ?? null;
      const status: TimerStatus = prepSeconds && prepSeconds > 0 ? 'preparing' : 'active';
      return noop({
        status,
        mode: action.mode,
        sessionId: action.sessionId,
        attemptIndex: 0,
        prepSeconds,
        phaseStartedAtMs: now,
        pausedAtMs: null,
        pausedAccumMs: 0,
      });
    }

    case 'PAUSE': {
      if (!PAUSABLE_STATUSES.includes(state.status)) return noop(state);
      if (state.pausedAtMs !== null) return noop(state); // already paused
      return noop({ ...state, pausedAtMs: now });
    }

    case 'RESUME': {
      if (!PAUSABLE_STATUSES.includes(state.status)) return noop(state);
      if (state.pausedAtMs === null) return noop(state); // not paused
      const pausedDurationMs = now - state.pausedAtMs;
      return noop({ ...state, pausedAtMs: null, pausedAccumMs: state.pausedAccumMs + pausedDurationMs });
    }

    case 'STOP': {
      if (state.status === 'preparing') {
        // Skip remaining prep — this counts as the attempt starting now.
        return noop({ ...state, status: 'active', phaseStartedAtMs: now, pausedAtMs: null, pausedAccumMs: 0 });
      }
      if (state.status === 'active') {
        const capturedAttempt: CapturedAttempt = {
          attemptIndex: state.attemptIndex,
          startedAtMs: state.phaseStartedAtMs as number,
          finishedAtMs: now,
          durationMs: elapsedMsAt(state, now),
        };
        return {
          state: {
            ...state,
            status: 'recovering',
            attemptIndex: state.attemptIndex + 1,
            phaseStartedAtMs: now,
            pausedAtMs: null,
            pausedAccumMs: 0,
          },
          capturedAttempt,
        };
      }
      if (state.status === 'recovering') {
        return noop({ ...state, status: 'done' });
      }
      return noop(state);
    }

    case 'CANCEL': {
      if (state.status === 'preparing') {
        return noop({ ...INITIAL_TIMER_ENGINE_STATE });
      }
      if (state.status === 'active') {
        // Nothing was ever saved for a first attempt cancelled before STOP —
        // a full reset. A later attempt within the same session cancels only
        // the in-flight one; prior saved attempts stand.
        if (state.attemptIndex === 0) {
          return noop({ ...INITIAL_TIMER_ENGINE_STATE });
        }
        return noop({ ...state, status: 'recovering', phaseStartedAtMs: now, pausedAtMs: null, pausedAccumMs: 0 });
      }
      if (state.status === 'recovering') {
        return noop({ ...state, status: 'done' });
      }
      return noop(state);
    }

    case 'RESET': {
      if (state.status !== 'done' && state.status !== 'cancelled') return noop(state);
      return noop({ ...INITIAL_TIMER_ENGINE_STATE });
    }

    default:
      return noop(state);
  }
}
