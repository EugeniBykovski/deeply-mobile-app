import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { usePurchases } from '@/features/purchases/usePurchases';
import { colors } from '@/theme';

export default function PaywallScreen() {
  const { check } = useLocalSearchParams<{ check?: string }>();
  const { presentPaywall, presentPaywallIfNeeded } = usePurchases();

  useEffect(() => {
    async function open() {
      try {
        if (check === 'true') {
          await presentPaywallIfNeeded();
        } else {
          await presentPaywall();
        }
      } catch (err: any) {
        const msg =
          err?.message ?? 'Could not open the paywall. Please try again later.';
        Alert.alert('Subscription unavailable', msg);
      } finally {
        if (router.canGoBack()) {
          router.back();
        }
      }
    }

    open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
