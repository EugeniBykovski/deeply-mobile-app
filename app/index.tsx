import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

/**
 * Entry gate — runs after the root layout has bootstrapped auth + onboarding.
 *
 * State machine:
 *   A. Authenticated                        → main app
 *   B. Known returning user, signed out     → Sign In screen
 *   C. Brand-new user / fresh install       → onboarding
 *   D. Completed onboarding, skipped auth   → main app (anonymous)
 *
 * IMPORTANT: never returns null. During async hydration a branded loader is
 * shown so Apple Review (and real users) never see a blank black frame.
 */
export default function Index() {
  const _hasHydrated   = useOnboardingStore((s) => s._hasHydrated);
  const isCompleted    = useOnboardingStore((s) => s.isCompleted);
  const hasEverSignedIn = useOnboardingStore((s) => s.hasEverSignedIn);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsLoading   = useAuthStore((s) => s.isLoading);

  // Show a full-screen branded loader while stores are hydrating.
  // The native splash screen may still be animating out at this point;
  // this prevents any blank frame between the two.
  if (!_hasHydrated || authIsLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // A. Active session
  if (isAuthenticated) return <Redirect href="/(app)/train" />;

  // B. Returning user — previously signed in but now signed out
  if (hasEverSignedIn) return <Redirect href={'/signin' as any} />;

  // C. First-time user — questionnaire not yet completed
  if (!isCompleted) return <Redirect href="/(onboarding)" />;

  // D. Completed onboarding, always skipped sign-in (anonymous mode)
  return <Redirect href="/(app)/train" />;
}
