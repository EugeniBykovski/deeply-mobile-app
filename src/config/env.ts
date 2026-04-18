/**
 * Centralized environment configuration.
 *
 * All EXPO_PUBLIC_ vars are inlined at build time by Metro bundler.
 * Never put secrets here — this is client-side only.
 */

const API_BASE_URL =
  process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3000/api';

// RevenueCat Apple SDK key — publishable, safe in bundle.
const RC_APPLE_KEY = process.env['EXPO_PUBLIC_REVENUECAT_APPLE_KEY'] ?? '';

export const env = {
  apiBaseUrl: API_BASE_URL,
  rcAppleKey: RC_APPLE_KEY,
  isDev: __DEV__,
} as const;
