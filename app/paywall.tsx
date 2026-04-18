/**
 * Paywall modal — presents the RevenueCat paywall.
 *
 * Navigation:
 *   router.push('/paywall')              — always shows paywall
 *   router.push('/paywall?check=true')   — only shows if not already Pro
 *
 * The screen closes automatically after purchase/dismiss because
 * RevenueCatUI.presentPaywall() handles its own presentation.
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { usePurchases } from '@/features/purchases/usePurchases';
import { colors } from '@/theme';

export default function PaywallScreen() {
  const { check } = useLocalSearchParams<{ check?: string }>();
  const { presentPaywall, presentPaywallIfNeeded } = usePurchases();

  useEffect(() => {
    async function open() {
      let result: PAYWALL_RESULT;

      if (check === 'true') {
        result = await presentPaywallIfNeeded();
      } else {
        result = await presentPaywall();
      }

      // After the paywall closes (any result) return to the previous screen
      if (router.canGoBack()) {
        router.back();
      }
    }

    open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a loader while RevenueCatUI prepares the paywall sheet
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
