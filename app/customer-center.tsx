/**
 * Customer Center screen — RevenueCat's built-in subscription management UI.
 *
 * Lets users:
 *  - Cancel subscription
 *  - Restore purchases
 *  - Contact support
 *  - View billing history
 *
 * Navigation: router.push('/customer-center')
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import { colors } from '@/theme';

export default function CustomerCenterScreen() {
  useEffect(() => {
    async function open() {
      await RevenueCatUI.presentCustomerCenter();
      if (router.canGoBack()) {
        router.back();
      }
    }
    open();
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
