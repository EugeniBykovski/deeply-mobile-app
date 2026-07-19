import type { PurchasesEntitlementInfo } from 'react-native-purchases';
import { deriveStateFromCustomerInfo } from './deriveStateFromCustomerInfo';

function entitlement(overrides: Partial<PurchasesEntitlementInfo>): PurchasesEntitlementInfo {
  return {
    identifier: 'Deeply Pro',
    isActive: true,
    willRenew: true,
    periodType: 'NORMAL',
    latestPurchaseDate: new Date().toISOString(),
    latestPurchaseDateMillis: Date.now(),
    originalPurchaseDate: new Date().toISOString(),
    originalPurchaseDateMillis: Date.now(),
    expirationDate: null,
    expirationDateMillis: null,
    store: 'APP_STORE',
    productIdentifier: 'deeply_pro_monthly',
    productPlanIdentifier: null,
    isSandbox: false,
    unsubscribeDetectedAt: null,
    unsubscribeDetectedAtMillis: null,
    billingIssueDetectedAt: null,
    billingIssueDetectedAtMillis: null,
    ownershipType: 'PURCHASED',
    verification: 'NOT_REQUESTED' as any,
    ...overrides,
  } as PurchasesEntitlementInfo;
}

describe('deriveStateFromCustomerInfo', () => {
  it('resolves no active/all entitlement to free (never purchased or trialed)', () => {
    const snapshot = deriveStateFromCustomerInfo(null, null);
    expect(snapshot.state).toBe('free');
    expect(snapshot.hasFullAccess).toBe(false);
  });

  it('resolves an active TRIAL periodType to trial_active with days remaining', () => {
    const expirationDate = new Date(Date.now() + 3 * 86_400_000 + 1000).toISOString();
    const active = entitlement({ periodType: 'TRIAL', expirationDate });
    const snapshot = deriveStateFromCustomerInfo(active, active);
    expect(snapshot.state).toBe('trial_active');
    expect(snapshot.hasFullAccess).toBe(true);
    expect(snapshot.isTrialActive).toBe(true);
    expect(snapshot.trialDaysRemaining).toBe(4);
  });

  it('resolves an active NORMAL periodType to pro_active', () => {
    const active = entitlement({ periodType: 'NORMAL' });
    const snapshot = deriveStateFromCustomerInfo(active, active);
    expect(snapshot.state).toBe('pro_active');
    expect(snapshot.hasFullAccess).toBe(true);
    expect(snapshot.isProActive).toBe(true);
  });

  it('keeps a cancelled-but-still-active subscription as pro_active with willRenew=false', () => {
    const active = entitlement({
      periodType: 'NORMAL',
      willRenew: false,
      unsubscribeDetectedAt: new Date().toISOString(),
    });
    const snapshot = deriveStateFromCustomerInfo(active, active);
    expect(snapshot.state).toBe('pro_active');
    expect(snapshot.hasFullAccess).toBe(true);
    expect(snapshot.willRenew).toBe(false);
  });

  it('resolves an active subscription with a billing issue to billing_issue, access retained', () => {
    const active = entitlement({
      periodType: 'NORMAL',
      billingIssueDetectedAt: new Date().toISOString(),
    });
    const snapshot = deriveStateFromCustomerInfo(active, active);
    expect(snapshot.state).toBe('billing_issue');
    expect(snapshot.hasFullAccess).toBe(true);
  });

  it('resolves active=undefined but all=present to expired (lapsed or trial that did not convert)', () => {
    const lapsed = entitlement({ periodType: 'NORMAL', expirationDate: new Date(Date.now() - 1000).toISOString() });
    const snapshot = deriveStateFromCustomerInfo(null, lapsed);
    expect(snapshot.state).toBe('expired');
    expect(snapshot.hasFullAccess).toBe(false);
  });
});
