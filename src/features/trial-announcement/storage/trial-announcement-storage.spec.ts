const mockStore = new Map<string, string>();

jest.mock('@/shared/lib/fileSystemStorage', () => ({
  fileSystemStorage: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStore.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      mockStore.delete(key);
      return Promise.resolve();
    }),
  },
}));

import { getAcknowledgedVersion, setAcknowledgedVersion } from './trial-announcement-storage';

describe('trial-announcement-storage', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('returns null when nothing has been acknowledged yet', async () => {
    expect(await getAcknowledgedVersion('user-1')).toBeNull();
    expect(await getAcknowledgedVersion(null)).toBeNull();
  });

  it('persists and reads back the acknowledged version for a given user', async () => {
    await setAcknowledgedVersion('user-1', 1);
    expect(await getAcknowledgedVersion('user-1')).toBe(1);
  });

  it('scopes acknowledgement by user id — one account acknowledging does not affect another', async () => {
    await setAcknowledgedVersion('user-1', 1);
    expect(await getAcknowledgedVersion('user-1')).toBe(1);
    expect(await getAcknowledgedVersion('user-2')).toBeNull();
  });

  it('uses a separate device-level bucket for anonymous users (null id), distinct from any real user id', async () => {
    await setAcknowledgedVersion(null, 1);
    expect(await getAcknowledgedVersion(null)).toBe(1);
    expect(await getAcknowledgedVersion('user-1')).toBeNull();
  });
});
