/**
 * Custom paywall screen — Apple 3.1.2(c) compliant.
 *
 * Rules:
 * - NEVER auto-dismisses. Close only happens when the user taps ✕.
 * - Explicit state machine: loading → ready → error (with retry).
 * - Shows subscription title, duration, localized price, restore, legal links.
 * - All purchase errors and cancellations keep the paywall open.
 * - Never claims a free trial on a specific plan unless the store's own
 *   product data (introPrice) confirms one exists for that exact SKU.
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
import { useTranslation } from 'react-i18next';
import Purchases, { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { colors } from '@/theme';
import { usePurchases } from '@/features/purchases/usePurchases';
import { useEntitlement } from '@/features/entitlement/useEntitlement';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'ready'; packages: PurchasesPackage[] }
  | { kind: 'error'; message: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BEST_VALUE_TYPE: PACKAGE_TYPE = PACKAGE_TYPE.ANNUAL;

const PERIOD_KEY: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.WEEKLY]: 'period_week',
  [PACKAGE_TYPE.MONTHLY]: 'period_month',
  [PACKAGE_TYPE.TWO_MONTH]: 'period_2_months',
  [PACKAGE_TYPE.THREE_MONTH]: 'period_3_months',
  [PACKAGE_TYPE.SIX_MONTH]: 'period_6_months',
  [PACKAGE_TYPE.ANNUAL]: 'period_year',
};

const FEATURE_KEYS = [
  'feature_programs',
  'feature_timer',
  'feature_dive_tracking',
  'feature_history',
  'feature_private',
] as const;

/** Only ever surfaces a trial if the store's own product data confirms a
 *  zero-cost introductory offer on this exact package — never assumed. */
function getFreeTrialDays(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0 || intro.periodUnit !== 'DAY') return null;
  return intro.periodNumberOfUnits;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const { t } = useTranslation('paywall');
  const { t: tCommon } = useTranslation('common');
  const { purchasePackage, restorePurchases, isPurchasing } = usePurchases();
  const { isTrialActive, trialDaysRemaining } = useEntitlement();

  const [state, setState] = useState<ScreenState>({ kind: 'loading' });
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load offerings ──────────────────────────────────────────────────────────

  const loadOfferings = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const offerings = await Purchases.getOfferings();
      const pkgs = offerings.current?.availablePackages ?? [];
      if (pkgs.length === 0) {
        setState({ kind: 'error', message: t('error_no_plans') });
        return;
      }
      setState({ kind: 'ready', packages: pkgs });
      // Default selection: annual if present, otherwise first package
      const annual = pkgs.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
      setSelected(annual ?? pkgs[0]!);
    } catch (err: any) {
      setState({
        kind: 'error',
        message: err?.message ?? t('error_load_failed'),
      });
    }
  }, [t]);

  useEffect(() => {
    loadOfferings();
    return () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    };
  }, [loadOfferings]);

  // ── Purchase ────────────────────────────────────────────────────────────────

  const handleSubscribe = useCallback(async () => {
    if (!selected || isPurchasing) return;
    const result = await purchasePackage(selected);
    if (result.success) {
      // Only a successful purchase closes the paywall — cancellations and
      // failures keep it open (usePurchases already surfaces failure alerts).
      router.back();
    }
  }, [selected, isPurchasing, purchasePackage]);

  // ── Restore ─────────────────────────────────────────────────────────────────

  const handleRestore = useCallback(async () => {
    if (isPurchasing) return;
    const result = await restorePurchases();
    if (result.success) {
      router.back();
      return;
    }
    showRestoreMessage(t('restore_purchases_none_found'));
  }, [isPurchasing, restorePurchases, t]);

  function showRestoreMessage(msg: string) {
    setRestoreMsg(msg);
    if (restoreTimer.current) clearTimeout(restoreTimer.current);
    restoreTimer.current = setTimeout(() => setRestoreMsg(null), 3500);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isReady = state.kind === 'ready';
  const heroSubtitle =
    isTrialActive && trialDaysRemaining != null
      ? t('hero_subtitle_trial_active', { count: trialDaysRemaining })
      : t('hero_subtitle_eligible');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Close button — always visible, never hidden */}
      <View style={styles.closeRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={14}
          style={styles.closeBtn}
          accessibilityLabel={t('close')}
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
            {t('hero_title')}
          </AppText>
          <AppText secondary style={styles.heroSubtitle}>
            {heroSubtitle}
          </AppText>
        </View>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        {FEATURE_KEYS.map((key) => (
          <View key={key} style={styles.featureRow}>
            <AppText style={styles.checkmark}>✓</AppText>
            <AppText secondary style={styles.featureText}>{t(key)}</AppText>
          </View>
        ))}

        {/* ── After your trial ────────────────────────────────────────────── */}
        <View style={styles.afterTrialBox}>
          <View style={styles.afterTrialIcon}>
            <LiIcon name="lock-open" size={16} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" style={{ marginBottom: 2 }}>
              {t('after_trial_title')}
            </AppText>
            <AppText variant="caption" secondary style={{ lineHeight: 18 }}>
              {t('after_trial_body')}
            </AppText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Plans ────────────────────────────────────────────────────────── */}
        {state.kind === 'loading' && (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        )}

        {state.kind === 'error' && (
          <View style={styles.errorBox}>
            <AppText secondary style={styles.errorText}>{state.message}</AppText>
            <Pressable onPress={loadOfferings} style={styles.retryBtn}>
              <AppText style={styles.retryLabel}>{tCommon('retry')}</AppText>
            </Pressable>
          </View>
        )}

        {isReady && state.packages.map((pkg) => {
          const type = pkg.packageType as PACKAGE_TYPE;
          const isSelected = selected?.identifier === pkg.identifier;
          const isBest = type === BEST_VALUE_TYPE;
          const periodKey = PERIOD_KEY[type];
          const freeTrialDays = getFreeTrialDays(pkg);

          return (
            <Pressable
              key={pkg.identifier}
              onPress={() => setSelected(pkg)}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={styles.planCardLeft}>
                <AppText weight="semibold" style={styles.planTitle}>{pkg.product.title}</AppText>
                <AppText variant="caption" secondary style={styles.planDuration}>
                  {periodKey ? tCommon(periodKey) : ''}
                </AppText>
                {freeTrialDays != null && (
                  <AppText variant="caption" style={{ color: colors.accent, marginTop: 2 }}>
                    {t('plan_trial_offer', { count: freeTrialDays, price: pkg.product.priceString })}
                  </AppText>
                )}
              </View>
              <View style={styles.planCardRight}>
                <AppText weight="bold" style={styles.planPrice}>{pkg.product.priceString}</AppText>
                {isBest && (
                  <View style={styles.badge}>
                    <AppText style={styles.badgeText}>{t('plan_best_value')}</AppText>
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
            disabled={isPurchasing || !selected}
            style={[styles.subscribeBtn, (isPurchasing || !selected) && styles.subscribeBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t('subscribe_cta')}
          >
            {isPurchasing
              ? <ActivityIndicator color="#fff" />
              : <AppText weight="bold" style={styles.subscribeBtnLabel}>{t('subscribe_cta')}</AppText>
            }
          </Pressable>
        )}

        <Pressable
          onPress={handleRestore}
          disabled={isPurchasing}
          style={styles.restoreBtn}
          accessibilityRole="button"
        >
          <AppText variant="caption" style={styles.restoreLabel}>
            {restoreMsg ?? t('restore_purchases')}
          </AppText>
        </Pressable>

        {/* ── Required Apple 3.1.2(c) disclosure ─────────────────────────── */}
        <AppText variant="caption" muted style={styles.disclosure}>
          {t('renewal_disclosure')}
        </AppText>

        <View style={styles.legalRow}>
          <Pressable onPress={() => router.push('/legal/terms' as any)} hitSlop={8} accessibilityRole="link">
            <AppText variant="caption" style={styles.legalLink}>{t('terms_of_use')}</AppText>
          </Pressable>
          <AppText variant="caption" muted style={styles.legalSep}>·</AppText>
          <Pressable onPress={() => router.push('/legal/privacy' as any)} hitSlop={8} accessibilityRole="link">
            <AppText variant="caption" style={styles.legalLink}>{t('privacy_policy')}</AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

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
  afterTrialBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  afterTrialIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${colors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
