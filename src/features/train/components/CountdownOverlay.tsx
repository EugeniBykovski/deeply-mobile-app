import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';

// How long each number is fully visible before the fade-out begins.
const HOLD_MS = 680;
// Fade-out duration. Total per-digit = HOLD_MS + FADE_OUT_MS ≈ 900 ms.
const FADE_OUT_MS = 200;

interface CountdownOverlayProps {
  onDone: () => void;
}

export function CountdownOverlay({ onDone }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  // ── opacity starts at 1, NOT 0 ──────────────────────────────────────────────
  // The previous implementation started at 0 and relied on useEffect to fade in.
  // useEffect fires asynchronously after the commit. Under JS-thread load in
  // TestFlight the effect can fire 100–400 ms late, leaving a blank overlay.
  // Starting at 1 guarantees the number is visible on the very first frame.
  const opacity = useSharedValue(1);
  const scale   = useSharedValue(1.35); // punch-in: starts slightly large

  // Stable ref so worklet callbacks never close over a stale onDone.
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  // advanceCount is called from the UI thread (via runOnJS) after the fade-out
  // animation completes. It either advances the displayed digit or fires onDone.
  const advanceCount = useCallback((next: number) => {
    if (next < 0) {
      // "Go!" just displayed and faded — end the overlay.
      onDoneRef.current();
      return;
    }
    // Reset to fully visible BEFORE the React re-render so that when React
    // commits the new digit it is immediately at opacity 1 (no blank frame).
    opacity.value = 1;
    scale.value   = 1.35;
    setCount(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Punch-in animation for whichever digit just appeared.
    // opacity is already 1 (set in advanceCount or initial value), so we only
    // need to animate scale: 1.35 → 1.
    scale.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.back(1.4)),
    });

    // After HOLD_MS, fade out and call advanceCount on the UI thread.
    const t = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
        (finished) => {
          'worklet';
          if (!finished) return;
          runOnJS(advanceCount)(count - 1);
        },
      );
    }, HOLD_MS);

    return () => clearTimeout(t);
  // advanceCount is stable (useCallback with empty deps), so this effect only
  // re-runs when count changes — exactly what we want.
  }, [count, advanceCount]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const isGo = count <= 0;

  return (
    <View
      pointerEvents="box-only"
      style={[StyleSheet.absoluteFillObject, styles.container]}
    >
      <Animated.View style={[styles.label, animStyle]}>
        <AppText
          weight="bold"
          style={{
            fontSize: 88,
            lineHeight: 96,
            textAlign: 'center',
            color: isGo ? colors.accent : colors.ink,
          }}
        >
          {isGo ? 'Go!' : String(count)}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    alignItems: 'center',
  },
});
