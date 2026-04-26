import { useCallback } from 'react';
import { Alert } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { usePurchaseStore, PRO_ENTITLEMENT } from '@/store/purchaseStore';
import { purchaseService } from '@/api/services/purchase.service';
import { queryClient } from '@/shared/lib/queryClient';

export function usePurchases() {
  const { isPro, proExpiresAt, isLoading, isPurchasing } = usePurchaseStore();
  const setFromBackend = usePurchaseStore((s) => s.setFromBackend);

  // ─── Present paywall (only if not already subscribed) ───────────────────────

  const presentPaywallIfNeeded = useCallback(async () => {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT,
    });

    if (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED
    ) {
      await syncAfterPurchase();
    }

    return result;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Always present paywall ──────────────────────────────────────────────────

  const presentPaywall = useCallback(async () => {
    const result = await RevenueCatUI.presentPaywall();

    if (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED
    ) {
      await syncAfterPurchase();
    }

    return result;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Purchase a specific package ─────────────────────────────────────────────

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage) => {
      usePurchaseStore.setState({ isPurchasing: true });
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const isNowPro =
          customerInfo.entitlements.active[PRO_ENTITLEMENT] !== undefined;

        if (isNowPro) {
          await syncAfterPurchase();
        }

        return { success: isNowPro, customerInfo };
      } catch (err: any) {
        if (err?.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          Alert.alert(
            'Purchase failed',
            err?.message ?? 'Something went wrong. Please try again.',
          );
        }
        return { success: false, customerInfo: null };
      } finally {
        usePurchaseStore.setState({ isPurchasing: false });
      }
    },
    [],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Restore purchases ───────────────────────────────────────────────────────

  const restorePurchases = useCallback(async () => {
    usePurchaseStore.setState({ isPurchasing: true });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isNowPro =
        customerInfo.entitlements.active[PRO_ENTITLEMENT] !== undefined;

      if (isNowPro) {
        await syncAfterPurchase();
      }

      return { success: isNowPro };
    } catch (err: any) {
      Alert.alert('Restore failed', err?.message ?? 'Something went wrong.');
      return { success: false };
    } finally {
      usePurchaseStore.setState({ isPurchasing: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Open Customer Center ────────────────────────────────────────────────────

  const openCustomerCenter = useCallback(async () => {
    await RevenueCatUI.presentCustomerCenter();
  }, []);

  return {
    isPro,
    proExpiresAt,
    isLoading,
    isPurchasing,
    presentPaywall,
    presentPaywallIfNeeded,
    purchasePackage,
    restorePurchases,
    openCustomerCenter,
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function syncAfterPurchase() {
  try {
    const status = await purchaseService.sync();
    usePurchaseStore.getState().setFromBackend(status);
  } catch {
    // Backend sync failure is non-fatal — SDK state is already updated
    await usePurchaseStore.getState().refreshFromSdk();
  }

  // The backend now computes isLocked per-user, so all cached content
  // responses that held isLocked: true for premium items must be
  // re-fetched immediately so the UI reflects the unlocked state
  // without requiring the user to restart the app.
  queryClient.invalidateQueries({ queryKey: ['train'] });
  queryClient.invalidateQueries({ queryKey: ['dive'] });
}
