const mockFsStore = new Map<string, string>();

jest.mock('@/shared/lib/fileSystemStorage', () => ({
  createFileSystemStorage: () => ({
    getItem: jest.fn((key: string) => Promise.resolve(mockFsStore.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockFsStore.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      mockFsStore.delete(key);
      return Promise.resolve();
    }),
  }),
}));

import { act, renderHook } from '@testing-library/react-native';
import { INITIAL_TIMER_ENGINE_STATE, type TimerEngineState } from '../domain/timerEngine';
import { useActiveAttemptStore, useRestorableAttempt } from './activeAttemptStore';

describe('activeAttemptStore', () => {
  beforeEach(() => {
    mockFsStore.clear();
    useActiveAttemptStore.setState({
      snapshot: INITIAL_TIMER_ENGINE_STATE,
      clientAttemptId: null,
      pendingAttempt: null,
    });
  });

  it('starts with the initial idle snapshot and no restorable attempt', () => {
    const { result } = renderHook(() => useRestorableAttempt());
    expect(result.current.hasRestorable).toBe(false);
    expect(result.current.snapshot).toBeNull();
  });

  it('setSnapshot persists a non-terminal status as restorable', () => {
    const activeSnapshot: TimerEngineState = {
      ...INITIAL_TIMER_ENGINE_STATE,
      status: 'active',
      mode: 'BREATH_HOLD',
      phaseStartedAtMs: 12345,
    };
    useActiveAttemptStore.getState().setSnapshot(activeSnapshot, 'attempt-1');

    const { result } = renderHook(() => useRestorableAttempt());
    expect(result.current.hasRestorable).toBe(true);
    expect(result.current.snapshot).toEqual(activeSnapshot);
    expect(useActiveAttemptStore.getState().clientAttemptId).toBe('attempt-1');
  });

  it('treats idle/done/cancelled snapshots as not restorable', () => {
    for (const status of ['idle', 'done', 'cancelled'] as const) {
      useActiveAttemptStore.getState().setSnapshot({ ...INITIAL_TIMER_ENGINE_STATE, status });
      const { result, unmount } = renderHook(() => useRestorableAttempt());
      expect(result.current.hasRestorable).toBe(false);
      unmount();
    }
  });

  it('discard() clears the snapshot back to idle and clears the clientAttemptId', () => {
    useActiveAttemptStore
      .getState()
      .setSnapshot({ ...INITIAL_TIMER_ENGINE_STATE, status: 'recovering', phaseStartedAtMs: 1 }, 'attempt-1');

    const { result } = renderHook(() => useRestorableAttempt());
    expect(result.current.hasRestorable).toBe(true);

    act(() => {
      result.current.discard();
    });

    expect(useActiveAttemptStore.getState().snapshot).toEqual(INITIAL_TIMER_ENGINE_STATE);
    expect(useActiveAttemptStore.getState().clientAttemptId).toBeNull();
  });

  it('resume() is a no-op on state', () => {
    const snapshot: TimerEngineState = { ...INITIAL_TIMER_ENGINE_STATE, status: 'active', phaseStartedAtMs: 1 };
    useActiveAttemptStore.getState().setSnapshot(snapshot, 'attempt-1');

    const before = useActiveAttemptStore.getState().snapshot;
    const { result } = renderHook(() => useRestorableAttempt());
    act(() => {
      result.current.resume();
    });
    expect(useActiveAttemptStore.getState().snapshot).toBe(before);
  });

  it('setSnapshot without a clientAttemptId argument preserves the existing one', () => {
    useActiveAttemptStore.getState().setSnapshot({ ...INITIAL_TIMER_ENGINE_STATE, status: 'active' }, 'attempt-1');
    useActiveAttemptStore.getState().setSnapshot({ ...INITIAL_TIMER_ENGINE_STATE, status: 'recovering' });
    expect(useActiveAttemptStore.getState().clientAttemptId).toBe('attempt-1');
  });

  it('setPendingAttempt persists a captured-but-unconfirmed attempt so it survives a crash before confirmation', () => {
    const captured = { attemptIndex: 0, startedAtMs: 1000, finishedAtMs: 60_000, durationMs: 59_000 };
    useActiveAttemptStore.getState().setPendingAttempt(captured);
    expect(useActiveAttemptStore.getState().pendingAttempt).toEqual(captured);
  });

  it('clear() also clears any pending unconfirmed attempt', () => {
    useActiveAttemptStore.getState().setPendingAttempt({
      attemptIndex: 0,
      startedAtMs: 1000,
      finishedAtMs: 60_000,
      durationMs: 59_000,
    });
    useActiveAttemptStore.getState().clear();
    expect(useActiveAttemptStore.getState().pendingAttempt).toBeNull();
  });
});
