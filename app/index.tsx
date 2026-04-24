import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Entry gate — runs after the root layout has bootstrapped auth + onboarding.
 *
 * State machine:
 *
 *   A. Authenticated                        → main app (tokens valid)
 *   B. Known returning user, signed out     → Sign In screen (skip questionnaire)
 *   C. Brand-new user / fresh install       → onboarding questionnaire
 *   D. Completed onboarding, skipped auth   → main app (anonymous browse mode)
 *
 * IMPORTANT: We must not make any routing decision until:
 *   1. The onboarding store has hydrated from FileSystem (_hasHydrated)
 *   2. The auth store has finished reading SecureStore (!isLoading)
 *
 * Without these guards, both stores default to false/null and cold-launch
 * routes every user — including authenticated returning users — into
 * onboarding. The component returns null while the splash screen is still
 * visible (controlled by RootLayout), so no flash occurs.
 */
export default function Index() {
  const _hasHydrated = useOnboardingStore((s) => s._hasHydrated);
  const isCompleted = useOnboardingStore((s) => s.isCompleted);
  const hasEverSignedIn = useOnboardingStore((s) => s.hasEverSignedIn);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsLoading = useAuthStore((s) => s.isLoading);

  // ── Wait for both stores to settle before making any routing decision. ────
  // The splash screen covers the UI during this window so the user sees
  // nothing. Routing before stores are ready causes double-navigation and
  // sends existing users through onboarding on every cold start.
  if (!_hasHydrated || authIsLoading) {
    return null;
  }

  // ── A. Active session ─────────────────────────────────────────────────────
  if (isAuthenticated) {
    return <Redirect href="/(app)/train" />;
  }

  // ── B. Returning user — has signed in before but is now signed out ────────
  // hasEverSignedIn is a sticky device-level flag that survives sign-out.
  // It is only cleared by resetFull() (account deletion).
  if (hasEverSignedIn) {
    return <Redirect href={'/signin' as any} />;
  }

  // ── C. First-time user — onboarding questionnaire not yet complete ─────────
  if (!isCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

  // ── D. Completed onboarding, always skipped sign-in (anonymous mode) ──────
  return <Redirect href="/(app)/train" />;
}
