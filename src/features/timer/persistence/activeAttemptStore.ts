import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createFileSystemStorage } from '@/shared/lib/fileSystemStorage';
import { INITIAL_TIMER_ENGINE_STATE, type CapturedAttempt, type TimerEngineState } from '../domain/timerEngine';

const storage = createFileSystemStorage();

interface ActiveAttemptState {
  /** True once the persist middleware has finished reading from FileSystem. */
  _hasHydrated: boolean;

  snapshot: TimerEngineState;
  /**
   * Idempotency key for the CURRENT in-flight attempt — generated once by
   * the caller and reused across retries, so a relaunch-and-resend after a
   * network failure never double-records the attempt server-side.
   */
  clientAttemptId: string | null;
  /**
   * An attempt STOP has already captured but the app hasn't yet confirmed
   * (e.g. the user is still on the optional attempt-details sheet). Persisted
   * so a crash between capture and confirmation doesn't lose it — the
   * captured attempt itself (not just the engine snapshot) needs to survive.
   */
  pendingAttempt: CapturedAttempt | null;

  setSnapshot: (snapshot: TimerEngineState, clientAttemptId?: string | null) => void;
  setPendingAttempt: (attempt: CapturedAttempt | null) => void;
  clear: () => void;
}

export const useActiveAttemptStore = create<ActiveAttemptState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      snapshot: INITIAL_TIMER_ENGINE_STATE,
      clientAttemptId: null,
      pendingAttempt: null,

      setSnapshot: (snapshot, clientAttemptId) =>
        set((s) => ({
          snapshot,
          clientAttemptId: clientAttemptId !== undefined ? clientAttemptId : s.clientAttemptId,
        })),

      setPendingAttempt: (pendingAttempt) => set({ pendingAttempt }),

      clear: () =>
        set({ snapshot: INITIAL_TIMER_ENGINE_STATE, clientAttemptId: null, pendingAttempt: null }),
    }),
    {
      name: 'deeply-timer-active-attempt',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => () => {
        useActiveAttemptStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

/** Resolves once the persist middleware has finished reading from FileSystem. */
export function waitForActiveAttemptHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useActiveAttemptStore.getState()._hasHydrated) {
      resolve();
      return;
    }
    const unsub = useActiveAttemptStore.subscribe((state) => {
      if (state._hasHydrated) {
        unsub();
        resolve();
      }
    });
  });
}

export interface RestorableAttempt {
  hasRestorable: boolean;
  snapshot: TimerEngineState | null;
  /** No-op on state — elapsed is already correct (recomputed from the persisted
   *  phaseStartedAtMs against the current clock). Exists so a caller can
   *  dismiss a restore prompt without discarding the in-progress attempt. */
  resume: () => void;
  discard: () => void;
}

const TERMINAL_STATUSES = new Set(['idle', 'done', 'cancelled']);

/**
 * Reactive — re-renders the caller if the persisted snapshot changes.
 * A restorable attempt exists whenever its status isn't idle/done/cancelled,
 * i.e. an attempt was mid-flight when the app was killed. No restore-prompt
 * UI here — this is the surface Phase E's UI reads from.
 */
export function useRestorableAttempt(): RestorableAttempt {
  const snapshot = useActiveAttemptStore((s) => s.snapshot);
  const hasRestorable = !TERMINAL_STATUSES.has(snapshot.status);

  return {
    hasRestorable,
    snapshot: hasRestorable ? snapshot : null,
    resume: () => {},
    discard: () => useActiveAttemptStore.getState().clear(),
  };
}
