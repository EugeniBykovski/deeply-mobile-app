import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEYS } from '@/api/client';
import type { User } from '@/api/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True while restoring session on app launch */
  isLoading: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => Promise<void>;
  /**
   * Restores session from SecureStore on app launch.
   * If a valid access token exists the store is marked authenticated.
   * The user profile is fetched lazily on first use (via API interceptors).
   */
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(TOKEN_KEYS.access, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.refresh, refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
      await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
    } catch {
      // SecureStore may be unavailable — proceed anyway
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEYS.access),
        SecureStore.getItemAsync(TOKEN_KEYS.refresh),
      ]);

      if (accessToken) {
        // Mark authenticated immediately so the app can proceed.
        // The access token is the source of truth; refresh token enables silent renewal.
        set({ accessToken, isAuthenticated: true });

        // Lazy-fetch the user profile in the background so the rest of the
        // bootstrap can continue without blocking on a network call.
        // We do NOT await this — the user object will populate once available.
        (async () => {
          try {
            const { userService } = await import('@/api/services/user.service');
            const user = await userService.getMe();
            set({ user });
          } catch {
            // Profile fetch failed (e.g. expired token + no refresh).
            // The 401 interceptor in apiClient will clear tokens if refresh fails.
          }
        })();
      }
    } catch {
      // SecureStore unavailable (e.g. simulator without passphrase) — safe to ignore
    } finally {
      set({ isLoading: false });
    }
  },
}));
