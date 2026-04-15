import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { AppleLoginPayload, AuthResponse, RefreshPayload } from '../types';

export const authService = {
  loginWithApple: async (payload: AppleLoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      endpoints.auth.apple,
      payload,
    );
    return data;
  },

  refresh: async (payload: RefreshPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      endpoints.auth.refresh,
      payload,
    );
    return data;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete(endpoints.auth.deleteAccount);
  },
};
