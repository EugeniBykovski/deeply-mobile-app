export type EntitlementState =
  | 'trial_active'
  | 'pro_active'
  | 'free'
  | 'expired'
  | 'billing_issue'
  | 'unknown';

export interface EntitlementSnapshot {
  state: EntitlementState;
  hasFullAccess: boolean;
  isTrialActive: boolean;
  isProActive: boolean;
  willRenew: boolean | null;
  periodType: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
}

/**
 * Centralized lock rule shared by every screen that can be reached to play
 * a practice — list screens, detail screens, and the run/session screens
 * themselves (the latter guard against deep links bypassing the former).
 */
export function isPracticeLocked(isPremium: boolean, hasFullAccess: boolean): boolean {
  return isPremium && !hasFullAccess;
}
