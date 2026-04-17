/**
 * Skeleton — animated placeholder for async content.
 *
 * Uses a gentle opacity pulse so it works on any background.
 * Keep skeleton shapes visually close to the eventual content.
 *
 * Usage:
 *   <Skeleton width="100%" height={20} />
 *   <Skeleton width={80} height={80} borderRadius={40} />
 */
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        animStyle,
        style,
      ]}
    />
  );
}

// ─── Composite helpers ────────────────────────────────────────────────────────

/** A single skeleton row with optional leading circle/square badge */
export function SkeletonRow({
  badge = false,
  lines = 2,
}: {
  badge?: boolean;
  lines?: number;
}) {
  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {badge && (
        <Skeleton width={36} height={36} borderRadius={10} style={{ flexShrink: 0 }} />
      )}
      <Animated.View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="65%" height={14} />
        {lines >= 2 && <Skeleton width="45%" height={12} />}
      </Animated.View>
    </Animated.View>
  );
}

/** A skeleton card for the 2-column program grid */
export function SkeletonProgramCard() {
  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        minHeight: 140,
        gap: 10,
      }}
    >
      <Skeleton width={40} height={40} borderRadius={12} />
      <Skeleton width="80%" height={14} />
      <Skeleton width="55%" height={12} />
      <Skeleton width="40%" height={12} style={{ marginTop: 'auto' as any }} />
    </Animated.View>
  );
}

/** A skeleton article card for Culture screen */
export function SkeletonArticleCard() {
  return (
    <Animated.View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Skeleton width="100%" height={160} borderRadius={0} />
      <Animated.View style={{ padding: 16, gap: 8 }}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="85%" height={16} />
        <Skeleton width="65%" height={12} />
      </Animated.View>
    </Animated.View>
  );
}

/** A skeleton stat chip pair for Results screen */
export function SkeletonStatRow() {
  return (
    <Animated.View style={{ flexDirection: 'row', gap: 12 }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Skeleton width={40} height={24} borderRadius={6} />
        <Skeleton width="70%" height={12} />
      </Animated.View>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Skeleton width={40} height={24} borderRadius={6} />
        <Skeleton width="70%" height={12} />
      </Animated.View>
    </Animated.View>
  );
}
