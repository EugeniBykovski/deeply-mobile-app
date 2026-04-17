import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEYS } from '@/api/client';
import { authEvents } from '@/api/authEvents';
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
   * If a valid access token exists the store is marked authenticated
   * and a background user-profile fetch is kicked off.
   * Registers the auth-event handler so the 401 interceptor can clear
   * state when a refresh fails.
   */
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
    await Promise.allSettled([
      SecureStore.deleteItemAsync(TOKEN_KEYS.access),
      SecureStore.deleteItemAsync(TOKEN_KEYS.refresh),
    ]);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    // Wire the event bus so the 401 interceptor can trigger clearAuth()
    // without creating a circular module dependency.
    authEvents.onUnauthorized(() => {
      get().clearAuth();
    });

    try {
      const [accessToken] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEYS.access),
        SecureStore.getItemAsync(TOKEN_KEYS.refresh), // read but not stored in state — only needed by the interceptor
      ]);

      if (accessToken) {
        // Mark authenticated immediately — bootstrap can continue without
        // waiting for a network call.
        set({ accessToken, isAuthenticated: true });

        // Lazy-fetch the user profile. Fire-and-forget — does NOT block startup.
        // If the access token is expired, the 401 interceptor will silently
        // refresh it and retry. If refresh also fails, the interceptor emits
        // `unauthorized` → authEvents handler → clearAuth() above.
        (async () => {
          try {
            const { userService } = await import('@/api/services/user.service');
            const user = await userService.getMe();
            set({ user });
          } catch {
            // The interceptor already cleared SecureStore and emitted the
            // unauthorized event if the refresh failed.
            // As a safety net: if SecureStore is now empty, mirror that in state.
            try {
              const stillValid = await SecureStore.getItemAsync(TOKEN_KEYS.access);
              if (!stillValid) {
                set({ user: null, accessToken: null, isAuthenticated: false });
              }
            } catch {
              // SecureStore unavailable — leave state as-is
            }
          }
        })();
      }
    } catch {
      // SecureStore unavailable (e.g. simulator without passphrase)
    } finally {
      set({ isLoading: false });
    }
  },
}));
