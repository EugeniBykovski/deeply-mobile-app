import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

interface SplashViewProps {
  /** Set to true when the app has finished its initialization */
  isReady: boolean;
  /** Called when the exit animation has fully completed */
  onAnimationEnd: () => void;
}

/**
 * Custom animated splash screen.
 *
 * - Entry: logo fades + slides up gently
 * - Exit: entire screen fades out once `isReady` becomes true
 */
export function SplashView({ isReady, onAnimationEnd }: SplashViewProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(16)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Entry animation — runs immediately on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslate, {
        toValue: 0,
        duration: 700,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoTranslate]);

  // Exit animation — runs when app is ready
  useEffect(() => {
    if (!isReady) return;

    // Brief hold so the entry animation can breathe
    const timeout = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onAnimationEnd();
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [isReady, screenOpacity, onAnimationEnd]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={[colors.bg, '#0F2626', colors.card]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo / wordmark area */}
      <Animated.View
        style={[
          styles.logoArea,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslate }],
          },
        ]}
      >
        {/* Wave rings — purely CSS/View based, no SVG dependency */}
        <View style={styles.ringOuter}>
          <View style={styles.ringMiddle}>
            <View style={styles.ringInner} />
          </View>
        </View>

        {/* App name */}
        <Animated.Text style={styles.wordmark}>deeply</Animated.Text>
        <Animated.Text style={styles.tagline}>breathe · dive · focus</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    gap: 16,
  },
  ringOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(59, 191, 173, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMiddle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(59, 191, 173, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 191, 173, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 191, 173, 0.4)',
  },
  wordmark: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
