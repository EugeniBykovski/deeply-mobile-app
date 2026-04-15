import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/config/env';

// ─── Token storage keys ──────────────────────────────────────────────────────

export const TOKEN_KEYS = {
  access: 'deeply_access_token',
  refresh: 'deeply_refresh_token',
} as const;

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'en',
  },
});

// ─── Request interceptor — attach Bearer token ───────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEYS.access);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor — handle 401 + token refresh ───────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
        // Reject after timeout to prevent hanging
        setTimeout(() => reject(new Error('Refresh timeout')), 10_000);
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
      if (!refreshToken) throw new Error('No refresh token stored');

      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${env.apiBaseUrl}/auth/refresh`, { refreshToken });

      await SecureStore.setItemAsync(TOKEN_KEYS.access, data.accessToken);
      await SecureStore.setItemAsync(TOKEN_KEYS.refresh, data.refreshToken);

      processQueue(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      // Refresh failed — clear tokens and let the auth store handle logout
      await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
      await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
