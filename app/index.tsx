import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Entry gate — runs after the root layout has bootstrapped auth + onboarding state.
 *
 * Three possible states:
 *
 * 1. Authenticated — tokens present and valid → main app
 * 2. Returning unauthenticated — previously signed in but currently signed out
 *    → direct Apple sign-in screen (skip the questionnaire entirely)
 * 3. First-time user — no account history on this device
 *    → full onboarding questionnaire flow
 *
 * The edge case of "completed onboarding but always skipped sign-in" falls
 * through to the main app in unauthenticated mode (Results shows an empty
 * state; all other tabs work without auth).
 */
export default function Index() {
  const isCompleted = useOnboardingStore((s) => s.isCompleted);
  const hasEverSignedIn = useOnboardingStore((s) => s.hasEverSignedIn);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ── 1. Active session ──────────────────────────────────────────────────────
  if (isAuthenticated) {
    return <Redirect href="/(app)/train" />;
  }

  // ── 2. Returning user — has signed in before but is now signed out ─────────
  // Do NOT force them through the onboarding questionnaire again.
  if (hasEverSignedIn) {
    return <Redirect href={'/signin' as any} />;
  }

  // ── 3. Onboarding not yet complete — first-time user ──────────────────────
  if (!isCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

  // ── 4. Completed onboarding but always skipped sign-in ────────────────────
  // Allow unauthenticated browse mode. Results/profile features show
  // appropriate empty states.
  return <Redirect href="/(app)/train" />;
}
