import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme';

// Per-digit timing constants.
const HOLD_MS    = 700; // how long each digit is fully visible
const FADE_MS    = 180; // fade-out to next digit

interface CountdownOverlayProps {
  onDone: () => void;
}

export function CountdownOverlay({ onDone }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  // ── Why opacity = 1 and scale = 1.0 ─────────────────────────────────────────
  // opacity=1: the digit must be visible on the FIRST rendered frame. The
  //   previous impl used opacity=0 and relied on useEffect to fade in.
  //   useEffect fires after React commit, but on cold-start in TestFlight the
  //   JS thread is under load and the effect can fire 100-400 ms late → blank.
  //
  // scale=1.0 (not 1.35): a scale > 1 on a large font (88 px) can clip the
  //   text against the parent View bounds on small screens (iPhone SE / 375 pt),
  //   making it appear blank. Start at 1.0 — always visible, no clipping risk.
  //   Subsequent digits (2, 1, Go!) start at 1.3 (set in advanceCount below)
  //   and punch in to 1.0 via withTiming — that start scale is only held for
  //   the ~8 ms between advanceCount() and the requestAnimationFrame callback,
  //   which is imperceptible.
  const opacity = useSharedValue(1);
  const scale   = useSharedValue(1.0);

  // Stable ref prevents stale closure when onDone reference changes between
  // renders (e.g. if parent re-renders while countdown is running).
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  // Refs hold timer/raf IDs so cleanups in useEffect don't race with each other.
  const rafRef   = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // advanceCount is called on the JS thread (via runOnJS) after each digit
  // fades out. It either shows the next digit or fires onDone.
  const advanceCount = useCallback((next: number) => {
    if (next < 0) {
      onDoneRef.current();
      return;
    }
    // Set shared values synchronously BEFORE setState. When React commits the
    // new count value the Animated.View will already have opacity=1 / scale=1.3
    // applied, so there is no blank frame between digits.
    opacity.value = 1;
    scale.value   = 1.3;  // slight overshoot; punches in to 1.0 via raf below
    setCount(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Cancel anything left from the previous digit.
    if (rafRef.current   !== null) cancelAnimationFrame(rafRef.current);
    if (timerRef.current !== null) clearTimeout(timerRef.current);

    // ── requestAnimationFrame guarantees the digit is painted before we start
    //    any animation or the countdown timer.  On cold start, useEffect fires
    //    after React's commit phase but BEFORE the native layer paints the
    //    frame.  Deferring to the next RAF means the digit is on-screen for at
    //    least one full native frame before anything else happens.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      // Punch-in: animate scale from wherever advanceCount left it (1.3 for
      // digits 2/1/Go!, 1.0 for the initial "3") down to 1.0.
      scale.value = withTiming(1.0, {
        duration: 230,
        easing: Easing.out(Easing.back(1.3)),
      });

      // After HOLD_MS the digit fades out; the withTiming callback triggers
      // the next digit (or session start) on the JS thread via runOnJS.
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        opacity.value = withTiming(
          0,
          { duration: FADE_MS, easing: Easing.in(Easing.quad) },
          (finished) => {
            'worklet';
            if (!finished) return; // animation was cancelled — do nothing
            runOnJS(advanceCount)(count - 1);
          },
        );
      }, HOLD_MS);
    });

    return () => {
      if (rafRef.current   !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  // advanceCount has a stable identity (useCallback + empty deps).
  // count is the only real trigger here.
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
      <Animated.View style={animStyle}>
        {/* Plain Text (not AppText / NativeWind) so this component has zero
            dependency on class resolution or the NativeWind runtime. The
            system font is always present — no font-load race on cold start. */}
        <Text style={[styles.digit, { color: isGo ? colors.accent : colors.ink }]}>
          {isGo ? 'Go!' : String(count)}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 88,
    lineHeight: 96,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false, // Android: removes extra top padding
  },
});
