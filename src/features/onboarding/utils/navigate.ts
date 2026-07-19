import { router } from 'expo-router';

/**
 * Forwards the `review` query param (set when onboarding was reopened from
 * Settings, see `SettingsScreen.tsx`) through every step of the flow, so a
 * screen deep in the chain still knows it's being replayed rather than
 * completed for the first time — without needing separate global state.
 */
export function pushOnboardingStep(pathname: string, review?: string) {
  if (review === '1') {
    router.push({ pathname, params: { review: '1' } } as any);
  } else {
    router.push(pathname as any);
  }
}
