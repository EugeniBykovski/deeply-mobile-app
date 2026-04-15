import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';

/**
 * Entry gate — runs after the root layout has bootstrapped auth + onboarding state.
 * Redirects to the correct flow based on persisted state.
 */
export default function Index() {
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted);

  if (!isOnboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(app)/train" />;
}
