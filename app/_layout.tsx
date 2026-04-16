import '../global.css';
import '@/i18n'; // initialise i18next synchronously before any render

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { SplashView } from '@/shared/components/SplashView';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  const restoreSession = useAuthStore((s) => s.restoreSession);
  const savedLanguage = useOnboardingStore((s) => s.language);

  useEffect(() => {
    async function bootstrap() {
      try {
        // Apply persisted language selection
        if (savedLanguage && i18n.language !== savedLanguage) {
          await i18n.changeLanguage(savedLanguage);
        }
        // Restore auth session from SecureStore
        await restoreSession();
      } catch {
        // Non-fatal — proceed with defaults
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSplash = !appReady || !splashDone;

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(app)" />
            {/* Returning-user sign-in — shown after logout when hasEverSignedIn is true */}
            <Stack.Screen
              name="signin"
              options={{
                animation: 'fade',
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            />
            <Stack.Screen
              name="culture/[slug]"
              options={{
                animation: 'slide_from_right',
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>

          {showSplash && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <SplashView
                isReady={appReady}
                onAnimationEnd={() => setSplashDone(true)}
              />
            </View>
          )}
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
