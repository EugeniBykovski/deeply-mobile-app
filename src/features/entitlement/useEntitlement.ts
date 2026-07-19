import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useAuthStore } from '@/store/authStore';
import { purchaseService } from '@/api/services/purchase.service';
import { deriveStateFromCustomerInfo, UNKNOWN_SNAPSHOT } from './deriveStateFromCustomerInfo';
import type { EntitlementSnapshot } from './entitlement.types';

/**
 * The one hook screens use to read subscription/trial state. Wraps
 * RevenueCat's local CustomerInfo (primary — works for anonymous and
 * signed-in users, offline-capable) and the backend's confirmatory
 * /purchases/me response (only available once signed in).
 *
 * RC-local is never downgraded by a not-yet-synced backend response —
 * access is the OR of both, so a webhook delay never flickers a user
 * from unlocked back to locked.
 */
export function useEntitlement() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const rcIsLoading = usePurchaseStore((s) => s.isLoading);
  const entitlementActive = usePurchaseStore((s) => s.entitlementActive);
  const entitlementAny = usePurchaseStore((s) => s.entitlementAny);

  const backendQuery = useQuery({
    queryKey: ['purchases', 'me'],
    queryFn: () => purchaseService.getStatus(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const rcSnapshot: EntitlementSnapshot = useMemo(() => {
    if (rcIsLoading && !entitlementActive && !entitlementAny) return UNKNOWN_SNAPSHOT;
    return deriveStateFromCustomerInfo(entitlementActive, entitlementAny);
  }, [rcIsLoading, entitlementActive, entitlementAny]);

  const backendHasFullAccess = isAuthenticated ? (backendQuery.data?.hasFullAccess ?? false) : false;
  const hasFullAccess = rcSnapshot.hasFullAccess || backendHasFullAccess;

  // Prefer whichever snapshot actually reports full access for display copy;
  // fall back to RC-local (fresher/more-local signal) when both agree or neither does.
  const preferBackend = !rcSnapshot.hasFullAccess && backendHasFullAccess && backendQuery.data;

  const state = preferBackend ? backendQuery.data!.state : rcSnapshot.state;
  const isTrialActive = preferBackend ? backendQuery.data!.isTrialActive : rcSnapshot.isTrialActive;
  const isProActive = preferBackend ? backendQuery.data!.isProActive : rcSnapshot.isProActive;
  const trialDaysRemaining = preferBackend
    ? (backendQuery.data!.trialDaysRemaining ?? null)
    : rcSnapshot.trialDaysRemaining;
  const trialEndsAt = preferBackend ? (backendQuery.data!.trialEndsAt ?? null) : rcSnapshot.trialEndsAt;
  const willRenew = preferBackend ? (backendQuery.data!.willRenew ?? null) : rcSnapshot.willRenew;

  return {
    state,
    isLoading: rcIsLoading && rcSnapshot.state === 'unknown',
    hasFullAccess,
    isTrialActive,
    isProActive,
    /** Phase A: identical to hasFullAccess. */
    canAccessPractice: hasFullAccess,
    trialDaysRemaining,
    trialEndsAt,
    willRenew,
  };
}
