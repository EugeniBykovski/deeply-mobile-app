import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEYS } from '@/api/client';
import type { User } from '@/api/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
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

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEYS.access);
      if (token) {
        // Token exists — mark as authenticated; user data fetched by useCurrentUser hook
        set({ accessToken: token, isAuthenticated: true });
      }
    } catch {
      // Secure store unavailable (simulator edge case) — proceed unauthenticated
    } finally {
      set({ isLoading: false });
    }
  },
}));
