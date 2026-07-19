import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as KeepAwake from 'expo-keep-awake';
import * as Crypto from 'expo-crypto';
import type { CreateTimerAttemptPayload } from '@/api/types';
import { systemClock } from '../domain/clock';
import {
  dispatch,
  getElapsedMs,
  INITIAL_TIMER_ENGINE_STATE,
  type CapturedAttempt,
  type TimerAction,
  type TimerEngineState,
  type TimerMode,
} from '../domain/timerEngine';
import { useActiveAttemptStore, useRestorableAttempt } from '../persistence/activeAttemptStore';
import { timerService } from '../api/timerService';

const KEEP_AWAKE_TAG = 'deeply-timer-session';
const ACTIVE_STATUSES: TimerEngineState['status'][] = ['preparing', 'active', 'recovering'];

/** Optional per-attempt metadata — attached at confirmation time, after the
 *  timing capture itself, since none of it can be known until the attempt
 *  is over and the brief requires all of it to be skippable. */
export interface AttemptDetails {
  depthMeters?: number;
  diveType?: string;
  location?: string;
  equalizationNotes?: string;
  contractionsCount?: number;
  comfortRating?: number;
  notes?: string;
}

export interface UseTimerSessionOptions {
  /** Fires on every state transition — Phase E attaches haptics/sound here. */
  onPhaseChange?: (state: TimerEngineState) => void;
  /** Fires exactly when STOP finalizes an in-progress attempt, before confirmation. */
  onAttemptCaptured?: (attempt: CapturedAttempt) => void;
}

export function useTimerSession(options: UseTimerSessionOptions = {}) {
  const setPersisted = useActiveAttemptStore((s) => s.setSnapshot);
  const setPersistedPending = useActiveAttemptStore((s) => s.setPendingAttempt);
  const persistedClientAttemptId = useActiveAttemptStore((s) => s.clientAttemptId);
  const restorable = useRestorableAttempt();

  const [state, setState] = useState<TimerEngineState>(INITIAL_TIMER_ENGINE_STATE);
  const [pendingAttempt, setPendingAttempt] = useState<CapturedAttempt | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const clientAttemptIdRef = useRef<string | null>(persistedClientAttemptId);
  const [, forceTick] = useState(0);

  const onPhaseChangeRef = useRef(options.onPhaseChange);
  onPhaseChangeRef.current = options.onPhaseChange;
  const onAttemptCapturedRef = useRef(options.onAttemptCaptured);
  onAttemptCapturedRef.current = options.onAttemptCaptured;

  // UI-refresh tick — purely forces a re-render so the displayed elapsed
  // time visibly counts up. Never itself the source of truth: even if this
  // interval is throttled, paused, or misses ticks, getElapsedMs recomputes
  // the exact correct value from timestamps on whatever render happens next.
  useEffect(() => {
    if (!ACTIVE_STATUSES.includes(state.status) || state.pausedAtMs !== null) return;
    const id = setInterval(() => forceTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [state.status, state.pausedAtMs]);

  // AppState only needs to nudge a re-render on foreground so the display
  // catches up immediately — elapsed correctness needs no special handling.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') forceTick((t) => t + 1);
    });
    return () => sub.remove();
  }, []);

  // Screen wake lock while a session is actually in progress.
  useEffect(() => {
    if (ACTIVE_STATUSES.includes(state.status)) {
      KeepAwake.activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    } else {
      KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }
    return () => {
      KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [state.status]);

  const saveAttempt = useCallback(
    async (mode: TimerMode, captured: CapturedAttempt, clientAttemptId: string, details?: AttemptDetails) => {
      const payload: CreateTimerAttemptPayload = {
        clientAttemptId,
        startedAt: new Date(captured.startedAtMs).toISOString(),
        finishedAt: new Date(captured.finishedAtMs).toISOString(),
        durationSeconds: Math.round(captured.durationMs / 1000),
        ...details,
      };

      try {
        if (sessionIdRef.current) {
          await timerService.addAttempt(sessionIdRef.current, payload);
          return;
        }
        const result = await timerService.createSession({ mode, firstAttempt: payload });
        sessionIdRef.current = result.sessionId;
        setState((prev) => {
          const withSessionId = { ...prev, sessionId: result.sessionId };
          setPersisted(withSessionId, clientAttemptIdRef.current);
          return withSessionId;
        });
      } catch {
        // Non-fatal — the attempt stays captured locally (persisted pendingAttempt +
        // clientAttemptId); a later retry can resend it idempotently, since
        // the backend upserts on (sessionId, clientAttemptId).
      }
    },
    [setPersisted],
  );

  const runAction = useCallback(
    (action: TimerAction) => {
      const { state: next, capturedAttempt } = dispatch(state, action, systemClock);
      if (next === state) return; // illegal transition — no-op, nothing to persist

      if (next.sessionId !== null) sessionIdRef.current = next.sessionId;
      setState(next);
      setPersisted(next);

      if (capturedAttempt) {
        // Captured, not yet saved — the caller confirms via confirmPendingAttempt()
        // once any optional details (comfort rating, notes, depth, ...) are entered
        // or explicitly skipped. Persisted immediately so a crash before
        // confirmation doesn't lose it.
        setPendingAttempt(capturedAttempt);
        setPersistedPending(capturedAttempt);
        onAttemptCapturedRef.current?.(capturedAttempt);
      }

      onPhaseChangeRef.current?.(next);
    },
    [state, setPersisted, setPersistedPending],
  );

  /** Attaches optional details (or none) and persists the pending attempt to the backend. */
  const confirmPendingAttempt = useCallback(
    (details?: AttemptDetails) => {
      if (!pendingAttempt || !state.mode) return;
      const clientAttemptId = clientAttemptIdRef.current ?? Crypto.randomUUID();
      clientAttemptIdRef.current = clientAttemptId;

      void saveAttempt(state.mode, pendingAttempt, clientAttemptId, details);

      setPendingAttempt(null);
      setPersistedPending(null);
    },
    [pendingAttempt, state.mode, saveAttempt, setPersistedPending],
  );

  const start = useCallback(
    (mode: TimerMode, opts?: { prepSeconds?: number }) => {
      sessionIdRef.current = null;
      clientAttemptIdRef.current = null;
      setPendingAttempt(null);
      runAction({ type: 'START', mode, sessionId: null, prepSeconds: opts?.prepSeconds });
    },
    [runAction],
  );

  const startNextAttempt = useCallback(
    (opts?: { prepSeconds?: number }) => {
      if (!state.mode) return;
      clientAttemptIdRef.current = null;
      runAction({ type: 'START', mode: state.mode, sessionId: sessionIdRef.current, prepSeconds: opts?.prepSeconds });
    },
    [runAction, state.mode],
  );

  const pause = useCallback(() => runAction({ type: 'PAUSE' }), [runAction]);
  const resume = useCallback(() => runAction({ type: 'RESUME' }), [runAction]);
  const stop = useCallback(() => runAction({ type: 'STOP' }), [runAction]);
  const cancel = useCallback(() => runAction({ type: 'CANCEL' }), [runAction]);

  /** Loads the persisted in-progress attempt (and any unconfirmed captured
   *  attempt) into the live engine — the user's explicit "Resume" choice
   *  from Phase E's restore prompt. */
  const restoreActive = useCallback(() => {
    if (!restorable.snapshot) return;
    const stored = useActiveAttemptStore.getState();
    sessionIdRef.current = restorable.snapshot.sessionId;
    clientAttemptIdRef.current = stored.clientAttemptId;
    setState(restorable.snapshot);
    setPendingAttempt(stored.pendingAttempt);
  }, [restorable.snapshot]);

  /** Discards the persisted in-progress attempt entirely — the user's
   *  explicit "Discard" choice from Phase E's restore prompt. */
  const discardActive = useCallback(() => {
    restorable.discard();
    setState(INITIAL_TIMER_ENGINE_STATE);
    setPendingAttempt(null);
    sessionIdRef.current = null;
    clientAttemptIdRef.current = null;
  }, [restorable]);

  return {
    state,
    elapsedMs: getElapsedMs(state, systemClock),
    pendingAttempt,
    confirmPendingAttempt,
    hasRestorable: restorable.hasRestorable,
    restorableSnapshot: restorable.snapshot,
    start,
    startNextAttempt,
    pause,
    resume,
    stop,
    cancel,
    restoreActive,
    discardActive,
  };
}
