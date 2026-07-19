import { renderHook, waitFor, act } from '@testing-library/react-native';

let mockPathname = '/train';
jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
}));

let mockEntitlement: {
  isLoading: boolean;
  hasFullAccess: boolean;
  isProActive: boolean;
  isTrialActive: boolean;
};
jest.mock('@/features/entitlement/useEntitlement', () => ({
  useEntitlement: () => mockEntitlement,
}));

jest.mock('../storage/trial-announcement-storage', () => ({
  getAcknowledgedVersion: jest.fn(),
  setAcknowledgedVersion: jest.fn(() => Promise.resolve()),
}));

// authStore.ts transitively imports react-native-purchases and axios's
// fetch-adapter feature-detection, neither of which parse/run cleanly under
// jest-expo's default environment. Nothing in this test exercises real auth
// session behavior (useEntitlement itself is mocked above), so a minimal
// controllable stub matching the selector-hook shape is used instead.
let mockAuthUserId: string | null = null;
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: any) => unknown) =>
    selector({
      user: mockAuthUserId ? { id: mockAuthUserId, appleSub: 'sub', isPro: false } : null,
      isAuthenticated: !!mockAuthUserId,
    }),
}));

import { getAcknowledgedVersion, setAcknowledgedVersion } from '../storage/trial-announcement-storage';
import { useTrialAnnouncement } from './useTrialAnnouncement';
import { TRIAL_ANNOUNCEMENT_MODAL_VERSION } from '../constants';

const mockGetAcknowledgedVersion = getAcknowledgedVersion as jest.Mock;
const mockSetAcknowledgedVersion = setAcknowledgedVersion as jest.Mock;

function setAuthUser(id: string | null) {
  mockAuthUserId = id;
}

function setEntitlement(overrides: Partial<typeof mockEntitlement>) {
  mockEntitlement = {
    isLoading: false,
    hasFullAccess: false,
    isProActive: false,
    isTrialActive: false,
    ...overrides,
  };
}

describe('useTrialAnnouncement', () => {
  beforeEach(() => {
    mockPathname = '/train';
    setEntitlement({});
    mockGetAcknowledgedVersion.mockReset();
    mockSetAcknowledgedVersion.mockClear().mockResolvedValue(undefined);
    setAuthUser(null);
  });

  it('shows the modal on the first eligible launch (not yet acknowledged, no full access, in main app)', async () => {
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result } = renderHook(() => useTrialAnnouncement());

    expect(result.current.visible).toBe(false); // no empty-frame flash before the check resolves
    await waitFor(() => expect(result.current.visible).toBe(true));
  });

  it('pressing OK (acknowledge) persists the acknowledgement and closes the modal immediately', async () => {
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result } = renderHook(() => useTrialAnnouncement());
    await waitFor(() => expect(result.current.visible).toBe(true));

    act(() => {
      result.current.acknowledge();
    });

    expect(result.current.visible).toBe(false);
    await waitFor(() =>
      expect(mockSetAcknowledgedVersion).toHaveBeenCalledWith(null, TRIAL_ANNOUNCEMENT_MODAL_VERSION),
    );
  });

  it('does not show again after acknowledgement, even across a simulated remount/restart', async () => {
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result, unmount } = renderHook(() => useTrialAnnouncement());
    await waitFor(() => expect(result.current.visible).toBe(true));

    act(() => {
      result.current.acknowledge();
    });
    unmount();

    // Simulate app restart: a fresh hook instance, storage now reports the acknowledged version.
    mockGetAcknowledgedVersion.mockResolvedValue(TRIAL_ANNOUNCEMENT_MODAL_VERSION);
    const { result: afterRestart } = renderHook(() => useTrialAnnouncement());

    await waitFor(() => expect(mockGetAcknowledgedVersion).toHaveBeenCalled());
    expect(afterRestart.current.visible).toBe(false);
  });

  it('scopes acknowledgement by user id — acknowledging as one user does not suppress it for another', async () => {
    setAuthUser('user-1');
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result: user1 } = renderHook(() => useTrialAnnouncement());
    await waitFor(() => expect(user1.current.visible).toBe(true));
    act(() => {
      user1.current.acknowledge();
    });
    await waitFor(() =>
      expect(mockSetAcknowledgedVersion).toHaveBeenCalledWith('user-1', TRIAL_ANNOUNCEMENT_MODAL_VERSION),
    );

    // A different user signs in on the same device — storage reports nothing acknowledged for them.
    setAuthUser('user-2');
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result: user2 } = renderHook(() => useTrialAnnouncement());
    await waitFor(() => expect(mockGetAcknowledgedVersion).toHaveBeenCalledWith('user-2'));
    await waitFor(() => expect(user2.current.visible).toBe(true));
  });

  it('does not show for a user with active Pro access', async () => {
    setEntitlement({ hasFullAccess: true, isProActive: true });
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result } = renderHook(() => useTrialAnnouncement());

    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.visible).toBe(false);
    expect(mockGetAcknowledgedVersion).not.toHaveBeenCalled();
  });

  it('does not show for a user with an active trial', async () => {
    setEntitlement({ hasFullAccess: true, isTrialActive: true });
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result } = renderHook(() => useTrialAnnouncement());

    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.visible).toBe(false);
    expect(mockGetAcknowledgedVersion).not.toHaveBeenCalled();
  });

  it('does not briefly show while entitlement is still loading', async () => {
    setEntitlement({ isLoading: true });
    mockGetAcknowledgedVersion.mockResolvedValue(null);
    const { result, rerender } = renderHook(() => useTrialAnnouncement());

    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.visible).toBe(false);
    expect(mockGetAcknowledgedVersion).not.toHaveBeenCalled();

    // Loading finishes — now it's eligible to evaluate and show.
    setEntitlement({ isLoading: false });
    rerender({});
    await waitFor(() => expect(result.current.visible).toBe(true));
  });

  it('incrementing the announcement version allows a previously-acknowledged user to see it again', async () => {
    // Storage holds an acknowledgement for an older version than the current
    // TRIAL_ANNOUNCEMENT_MODAL_VERSION — exactly the state a real user is in
    // right after the constant gets bumped for a materially updated announcement.
    mockGetAcknowledgedVersion.mockResolvedValue(TRIAL_ANNOUNCEMENT_MODAL_VERSION - 1);
    const { result } = renderHook(() => useTrialAnnouncement());
    await waitFor(() => expect(result.current.visible).toBe(true));
  });
});
