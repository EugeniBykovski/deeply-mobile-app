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

export interface UseTimerSessionOptions {
  /** Fires on every state transition — Phase E attaches haptics/sound here. */
  onPhaseChange?: (state: TimerEngineState) => void;
  /** Fires exactly when STOP finalizes an in-progress attempt. */
  onAttemptCaptured?: (attempt: CapturedAttempt) => void;
}

export function useTimerSession(options: UseTimerSessionOptions = {}) {
  const setPersisted = useActiveAttemptStore((s) => s.setSnapshot);
  const persistedClientAttemptId = useActiveAttemptStore((s) => s.clientAttemptId);
  const restorable = useRestorableAttempt();

  const [state, setState] = useState<TimerEngineState>(INITIAL_TIMER_ENGINE_STATE);
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
    async (mode: TimerMode, captured: CapturedAttempt, clientAttemptId: string) => {
      const payload: CreateTimerAttemptPayload = {
        clientAttemptId,
        startedAt: new Date(captured.startedAtMs).toISOString(),
        finishedAt: new Date(captured.finishedAtMs).toISOString(),
        durationSeconds: Math.round(captured.durationMs / 1000),
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
        // Non-fatal — the attempt stays captured locally (persisted snapshot +
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

      if (capturedAttempt) {
        const clientAttemptId = Crypto.randomUUID();
        clientAttemptIdRef.current = clientAttemptId;
        setPersisted(next, clientAttemptId);
        onAttemptCapturedRef.current?.(capturedAttempt);
        if (next.mode) void saveAttempt(next.mode, capturedAttempt, clientAttemptId);
      } else {
        setPersisted(next);
      }

      onPhaseChangeRef.current?.(next);
    },
    [state, setPersisted, saveAttempt],
  );

  const start = useCallback(
    (mode: TimerMode, opts?: { prepSeconds?: number }) => {
      sessionIdRef.current = null;
      clientAttemptIdRef.current = null;
      runAction({ type: 'START', mode, sessionId: null, prepSeconds: opts?.prepSeconds });
    },
    [runAction],
  );

  const startNextAttempt = useCallback(
    (opts?: { prepSeconds?: number }) => {
      if (!state.mode) return;
      runAction({ type: 'START', mode: state.mode, sessionId: sessionIdRef.current, prepSeconds: opts?.prepSeconds });
    },
    [runAction, state.mode],
  );

  const pause = useCallback(() => runAction({ type: 'PAUSE' }), [runAction]);
  const resume = useCallback(() => runAction({ type: 'RESUME' }), [runAction]);
  const stop = useCallback(() => runAction({ type: 'STOP' }), [runAction]);
  const cancel = useCallback(() => runAction({ type: 'CANCEL' }), [runAction]);

  /** Loads the persisted in-progress attempt into the live engine — the
   *  user's explicit "Resume" choice from Phase E's restore prompt. */
  const restoreActive = useCallback(() => {
    if (!restorable.snapshot) return;
    sessionIdRef.current = restorable.snapshot.sessionId;
    clientAttemptIdRef.current = useActiveAttemptStore.getState().clientAttemptId;
    setState(restorable.snapshot);
  }, [restorable.snapshot]);

  /** Discards the persisted in-progress attempt entirely — the user's
   *  explicit "Discard" choice from Phase E's restore prompt. */
  const discardActive = useCallback(() => {
    restorable.discard();
    setState(INITIAL_TIMER_ENGINE_STATE);
    sessionIdRef.current = null;
    clientAttemptIdRef.current = null;
  }, [restorable]);

  return {
    state,
    elapsedMs: getElapsedMs(state, systemClock),
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
