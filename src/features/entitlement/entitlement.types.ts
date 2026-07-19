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
