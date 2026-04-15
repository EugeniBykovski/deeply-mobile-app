/**
 * Centralized environment configuration.
 *
 * All EXPO_PUBLIC_ vars are inlined at build time by Metro bundler.
 * Never put secrets here — this is client-side only.
 */

const API_BASE_URL =
  process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000/api';

export const env = {
  apiBaseUrl: API_BASE_URL,
  isDev: __DEV__,
} as const;
