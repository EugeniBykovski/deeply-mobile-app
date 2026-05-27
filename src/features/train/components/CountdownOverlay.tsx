import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';

interface CountdownOverlayProps {
  onDone: () => void;
}

export function CountdownOverlay({ onDone }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.5);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 520 }),
      withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
    );
    scale.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.back(1.2)) }),
      withTiming(1, { duration: 480 }),
      withTiming(0.82, { duration: 200 }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    if (count <= 0) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [count, onDone]);

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
