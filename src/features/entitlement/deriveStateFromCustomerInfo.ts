import type { PurchasesEntitlementInfo } from 'react-native-purchases';
import type { EntitlementSnapshot } from './entitlement.types';

const MS_PER_DAY = 86_400_000;

/**
 * Maps RevenueCat's CustomerInfo entitlement pair (active/all, for the
 * "Deeply Pro" entitlement) to the normalized entitlement snapshot.
 * Pure function — no SDK/network access — for reuse and unit testing.
 */
export function deriveStateFromCustomerInfo(
  active: PurchasesEntitlementInfo | null | undefined,
  all: PurchasesEntitlementInfo | null | undefined,
): EntitlementSnapshot {
  const now = Date.now();

  let state: EntitlementSnapshot['state'];
  if (active && active.periodType === 'TRIAL') {
    state = 'trial_active';
  } else if (active && active.billingIssueDetectedAt) {
    state = 'billing_issue';
  } else if (active) {
    state = 'pro_active';
  } else if (all) {
    state = 'expired';
  } else {
    state = 'free';
  }

  const trialEndsAt = state === 'trial_active' ? (active?.expirationDate ?? null) : null;
  const trialDaysRemaining =
    trialEndsAt !== null
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / MS_PER_DAY))
      : null;

  return {
    state,
    hasFullAccess: state === 'trial_active' || state === 'pro_active' || state === 'billing_issue',
    isTrialActive: state === 'trial_active',
    isProActive: state === 'pro_active' || state === 'billing_issue',
    willRenew: active?.willRenew ?? null,
    periodType: active?.periodType ?? all?.periodType ?? null,
    trialEndsAt,
    trialDaysRemaining,
  };
}

/** Deterministic fallback when no CustomerInfo is available at all (cold-start failure, no cache). */
export const UNKNOWN_SNAPSHOT: EntitlementSnapshot = {
  state: 'unknown',
  hasFullAccess: false,
  isTrialActive: false,
  isProActive: false,
  willRenew: null,
  periodType: null,
  trialEndsAt: null,
  trialDaysRemaining: null,
};
