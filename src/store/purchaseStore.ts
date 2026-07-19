import { create } from 'zustand';
import Purchases, { type PurchasesEntitlementInfo } from 'react-native-purchases';
import { env } from '@/config/env';
import type { SubscriptionStatus } from '@/api/types';

// Guards against adding the customerInfo listener more than once
// (configure() may be called from multiple call sites after SDK init).
let _listenerAdded = false;

export const PRO_ENTITLEMENT = 'Deeply Pro';

interface PurchaseState {
  isPro: boolean;
  proExpiresAt: string | null;
  /** entitlements.active['Deeply Pro'] — undefined when not currently active */
  entitlementActive: PurchasesEntitlementInfo | null;
  /** entitlements.all['Deeply Pro'] — undefined if never purchased/trialed at all */
  entitlementAny: PurchasesEntitlementInfo | null;
  /** True while the SDK hasn't returned customer info yet */
  isLoading: boolean;
  /** True while a purchase / restore is in progress */
  isPurchasing: boolean;

  /** Configure and warm-up the RevenueCat SDK. Call once on app start. */
  configure: (userId?: string) => void;
  /** Associate SDK with a logged-in user. Call after successful sign-in. */
  identify: (userId: string) => Promise<void>;
  /** Reset to anonymous state on logout. */
  logout: () => Promise<void>;
  /** Refresh customer info from RevenueCat SDK (no network call to our backend). */
  refreshFromSdk: () => Promise<void>;
  /** Update store state from our backend response. */
  setFromBackend: (status: SubscriptionStatus) => void;
}

function entitlementFieldsFromInfo(info: {
  entitlements: { active: Record<string, PurchasesEntitlementInfo>; all: Record<string, PurchasesEntitlementInfo> };
}) {
  const active = info.entitlements.active[PRO_ENTITLEMENT] ?? null;
  const any = info.entitlements.all[PRO_ENTITLEMENT] ?? null;
  return {
    isPro: active !== null,
    proExpiresAt: active?.expirationDate ?? null,
    entitlementActive: active,
    entitlementAny: any,
    isLoading: false,
  };
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  isPro: false,
  proExpiresAt: null,
  entitlementActive: null,
  entitlementAny: null,
  isLoading: true,
  isPurchasing: false,

  configure() {
    if (!env.rcAppleKey) {
      console.warn('[Purchases] EXPO_PUBLIC_REVENUECAT_APPLE_KEY is not set');
      set({ isLoading: false });
      return;
    }

    // SDK initialisation (Purchases.configure + setLogLevel) is done in
    // app/_layout.tsx before this is called. This method only wires up the
    // real-time listener and warms up the customer-info cache.
    if (!_listenerAdded) {
      Purchases.addCustomerInfoUpdateListener((info) => {
        set(entitlementFieldsFromInfo(info));
      });
      _listenerAdded = true;
    }

    // Warm up: fetch current customer info
    get().refreshFromSdk();
  },

  async identify(userId) {
    if (!userId) return;
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      set(entitlementFieldsFromInfo(customerInfo));
    } catch (err) {
      console.warn('[Purchases] identify error:', err);
    }
  },

  async logout() {
    try {
      await Purchases.logOut();
    } catch {
      // Ignore — SDK may already be anonymous
    }
    set({ isPro: false, proExpiresAt: null, entitlementActive: null, entitlementAny: null });
  },

  async refreshFromSdk() {
    try {
      const info = await Purchases.getCustomerInfo();
      set(entitlementFieldsFromInfo(info));
    } catch (err) {
      console.warn('[Purchases] refreshFromSdk error:', err);
      set({ isLoading: false });
    }
  },

  setFromBackend(status) {
    set({
      isPro: status.isPro,
      proExpiresAt: status.proExpiresAt,
      isLoading: false,
    });
  },
}));
