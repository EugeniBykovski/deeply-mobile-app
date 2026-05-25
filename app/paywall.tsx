/**
 * Custom paywall screen — Apple 3.1.2(c) compliant.
 *
 * Rules:
 * - NEVER auto-dismisses. Close only happens when the user taps ✕.
 * - Explicit state machine: loading → ready → error (with retry).
 * - Shows subscription title, duration, localized price, restore, legal links.
 * - All purchase errors and cancellations keep the paywall open.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type PurchasesPackage,
} from 'react-native-purchases';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';
import { usePurchaseStore, PRO_ENTITLEMENT } from '@/store/purchaseStore';
import { purchaseService } from '@/api/services/purchase.service';
import { queryClient } from '@/shared/lib/queryClient';
import { openTerms, openPrivacy } from '@/shared/lib/openLegal';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'ready'; packages: PurchasesPackage[] }
  | { kind: 'error'; message: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DURATION_LABEL: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.WEEKLY]:      'per week',
  [PACKAGE_TYPE.MONTHLY]:     'per month',
  [PACKAGE_TYPE.TWO_MONTH]:   'per 2 months',
  [PACKAGE_TYPE.THREE_MONTH]: 'per 3 months',
  [PACKAGE_TYPE.SIX_MONTH]:   'per 6 months',
  [PACKAGE_TYPE.ANNUAL]:      'per year',
  [PACKAGE_TYPE.LIFETIME]:    'one-time',
};

const BEST_VALUE_TYPE: PACKAGE_TYPE = PACKAGE_TYPE.ANNUAL;

function packageLabel(pkg: PurchasesPackage) {
  const type = pkg.packageType as PACKAGE_TYPE;
  return {
    title:     pkg.product.title,
    duration:  DURATION_LABEL[type] ?? 'subscription',
    price:     pkg.product.priceString,
    isBest:    type === BEST_VALUE_TYPE,
  };
}

async function syncAfterPurchase() {
  try {
    const status = await purchaseService.sync();
    usePurchaseStore.getState().setFromBackend(status);
  } catch {
    await usePurchaseStore.getState().refreshFromSdk();
  }
  queryClient.invalidateQueries({ queryKey: ['train'] });
  queryClient.invalidateQueries({ queryKey: ['dive'] });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const [state, setState]         = useState<ScreenState>({ kind: 'loading' });
  const [selected, setSelected]   = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load offerings ──────────────────────────────────────────────────────────

  const loadOfferings = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const offerings = await Purchases.getOfferings();
      const pkgs = offerings.current?.availablePackages ?? [];
      if (pkgs.length === 0) {
        setState({ kind: 'error', message: 'No subscription plans are available right now. Please try again later.' });
        return;
      }
      setState({ kind: 'ready', packages: pkgs });
      // Default selection: annual if present, otherwise first package
      const annual = pkgs.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
      setSelected(annual ?? pkgs[0]!);
    } catch (err: any) {
      setState({
        kind: 'error',
        message: err?.message ?? 'Could not load subscription plans. Check your connection and try again.',
      });
    }
  }, []);

  useEffect(() => {
    loadOfferings();
    return () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    };
  }, [loadOfferings]);

  // ── Purchase ────────────────────────────────────────────────────────────────

  const handleSubscribe = useCallback(async () => {
    if (!selected || purchasing) return;
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selected);
      const isNowPro = customerInfo.entitlements.active[PRO_ENTITLEMENT] !== undefined;
      if (isNowPro) {
        await syncAfterPurchase();
        // Only successful purchase closes the paywall
        router.back();
      }
    } catch (err: any) {
      if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        // User cancelled — keep paywall open, no error shown
        return;
      }
      setState({
        kind: 'error',
        message: err?.message ?? 'Purchase failed. Please try again.',
      });
    } finally {
      setPurchasing(false);
    }
  }, [selected, purchasing]);

  // ── Restore ─────────────────────────────────────────────────────────────────

  const handleRestore = useCallback(async () => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      const isNowPro = info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
      if (isNowPro) {
        await syncAfterPurchase();
        router.back();
        return;
      }
      showRestoreMessage('No active subscription found.');
    } catch {
      showRestoreMessage('Restore failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [purchasing]);

  function showRestoreMessage(msg: string) {
    setRestoreMsg(msg);
    if (restoreTimer.current) clearTimeout(restoreTimer.current);
    restoreTimer.current = setTimeout(() => setRestoreMsg(null), 3500);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isReady = state.kind === 'ready';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Close button — always visible, never hidden */}
      <View style={styles.closeRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={14}
          style={styles.closeBtn}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <AppText style={styles.closeIcon}>✕</AppText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <AppText variant="title" weight="bold" style={styles.heroTitle}>
            Deeply Ocean Pro
          </AppText>
          <AppText secondary style={styles.heroSubtitle}>
            Unlock all training programs, dive templates, and full analytics.
          </AppText>
        </View>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <AppText style={styles.checkmark}>✓</AppText>
            <AppText secondary style={styles.featureText}>{f}</AppText>
          </View>
        ))}

        <View style={styles.divider} />

        {/* ── Plans ────────────────────────────────────────────────────────── */}
        {state.kind === 'loading' && (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        )}

        {state.kind === 'error' && (
          <View style={styles.errorBox}>
            <AppText secondary style={styles.errorText}>{state.message}</AppText>
            <Pressable onPress={loadOfferings} style={styles.retryBtn}>
              <AppText style={styles.retryLabel}>Try again</AppText>
            </Pressable>
          </View>
        )}

        {isReady && state.packages.map((pkg) => {
          const { title, duration, price, isBest } = packageLabel(pkg);
          const isSelected = selected?.identifier === pkg.identifier;
          return (
            <Pressable
              key={pkg.identifier}
              onPress={() => setSelected(pkg)}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={styles.planCardLeft}>
                <AppText weight="semibold" style={styles.planTitle}>{title}</AppText>
                <AppText variant="caption" secondary style={styles.planDuration}>{duration}</AppText>
              </View>
              <View style={styles.planCardRight}>
                <AppText weight="bold" style={styles.planPrice}>{price}</AppText>
                {isBest && (
                  <View style={styles.badge}>
                    <AppText style={styles.badgeText}>Best value</AppText>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        {/* Bottom padding so the fixed footer doesn't overlap content */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* ── Fixed bottom CTA + legal ─────────────────────────────────────── */}
      <View style={styles.footer}>
        {isReady && (
          <Pressable
            onPress={handleSubscribe}
            disabled={purchasing || !selected}
            style={[styles.subscribeBtn, (purchasing || !selected) && styles.subscribeBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Subscribe now"
          >
            {purchasing
              ? <ActivityIndicator color="#fff" />
              : <AppText weight="bold" style={styles.subscribeBtnLabel}>Subscribe now</AppText>
            }
          </Pressable>
        )}

        <Pressable
          onPress={handleRestore}
          disabled={purchasing}
          style={styles.restoreBtn}
          accessibilityRole="button"
        >
          <AppText variant="caption" style={styles.restoreLabel}>
            {restoreMsg ?? 'Restore purchases'}
          </AppText>
        </Pressable>

        {/* ── Required Apple 3.1.2(c) disclosure ─────────────────────────── */}
        <AppText variant="caption" muted style={styles.disclosure}>
          Subscription renews automatically unless cancelled at least 24 hours
          before the end of the current period. Manage in App Store Settings.
        </AppText>

        <View style={styles.legalRow}>
          <Pressable onPress={() => openTerms()} hitSlop={8} accessibilityRole="link">
            <AppText variant="caption" style={styles.legalLink}>Terms of Use</AppText>
          </Pressable>
          <AppText variant="caption" muted style={styles.legalSep}>·</AppText>
          <Pressable onPress={() => openPrivacy()} hitSlop={8} accessibilityRole="link">
            <AppText variant="caption" style={styles.legalLink}>Privacy Policy</AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURES = [
  'All breathing & apnea programs',
  'Full dive-session tracking',
  'Detailed training history',
  'Unlimited private trainings',
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  closeBtn: {
    padding: 10,
  },
  closeIcon: {
    color: colors.inkMuted,
    fontSize: 20,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  heroTitle: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
  },
  heroSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkmark: {
    color: colors.accent,
    fontSize: 15,
    width: 18,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  loader: {
    marginVertical: 40,
  },
  errorBox: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  errorText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  retryLabel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  planCardSelected: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}18`,
  },
  planCardLeft: {
    gap: 3,
    flex: 1,
  },
  planCardRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    marginLeft: 12,
  },
  planTitle: {
    fontSize: 15,
  },
  planDuration: {
    fontSize: 12,
  },
  planPrice: {
    fontSize: 17,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  footerSpacer: {
    height: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  subscribeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  subscribeBtnDisabled: {
    opacity: 0.55,
  },
  subscribeBtnLabel: {
    color: '#fff',
    fontSize: 16,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  restoreLabel: {
    color: colors.accent,
  },
  disclosure: {
    textAlign: 'center',
    lineHeight: 17,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  legalSep: {
    fontSize: 10,
  },
});
