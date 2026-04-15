import '../global.css';

import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { SplashView } from '@/shared/components/SplashView';

// Prevent the native splash from auto-hiding — we control it manually
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already dismissed in edge cases — safe to ignore
});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashAnimDone, setSplashAnimDone] = useState(false);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    async function prepare() {
      try {
        // Restore auth session (reads SecureStore)
        await restoreSession();
        // Future: load fonts, prefetch critical data here
      } catch {
        // Non-fatal — app proceeds unauthenticated
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [restoreSession]);

  // Keep the custom splash visible until both app is ready AND its animation completes
  const showSplash = !appReady || !splashAnimDone;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="+not-found" />
        </Stack>

        {/* Animated custom splash — overlays the Stack until dismissed */}
        {showSplash && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <SplashView
              isReady={appReady}
              onAnimationEnd={() => setSplashAnimDone(true)}
            />
          </View>
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
