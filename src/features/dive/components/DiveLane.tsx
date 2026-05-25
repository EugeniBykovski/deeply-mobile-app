import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppText } from '@/shared/components/AppText';
import { LANE_HEIGHT, DIVER_SIZE, ACCENT_COLOR, TICK_MS } from '../diveSession.constants';

interface DiveLaneProps {
  maxDepthMeters: number;
  currentDepth: number;
  meterProgress: number; // 0..1 fractional within the current metre
  isHolding: boolean;
  statusLabel: string;
}

export const DiveLane = memo(function DiveLane({
  maxDepthMeters,
  currentDepth,
  meterProgress,
  isHolding,
  statusLabel,
}: DiveLaneProps) {
  const tapeMarkers = useMemo(() => {
    const markers: number[] = [];
    for (let m = 0; m <= maxDepthMeters; m++) markers.push(m);
    return markers;
  }, [maxDepthMeters]);

  const metres = currentDepth;
  const centimetres = Math.min(99, Math.floor(meterProgress * 100));

  // Smooth diver Y — animates between ticks so movement appears continuous
  const diverY = useSharedValue(0);
  useEffect(() => {
    const fullDepth = currentDepth + meterProgress;
    const target = maxDepthMeters > 0
      ? (fullDepth / maxDepthMeters) * (LANE_HEIGHT - DIVER_SIZE)
      : 0;
    diverY.value = withTiming(target, { duration: TICK_MS, easing: Easing.linear });
  // diverY identity is stable — not a dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDepth, meterProgress, maxDepthMeters]);

  // Fade instruction label between states
  const labelOpacity = useSharedValue(0.38);
  useEffect(() => {
    labelOpacity.value = withTiming(isHolding ? 1 : 0.38, { duration: 280 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHolding]);

  const diverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: diverY.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <>
      {/* Depth counter: "2 m 00 cm" */}
      <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <AppText
            weight="bold"
            style={{ fontSize: 54, lineHeight: 60, color: 'rgba(255,255,255,0.95)' }}
          >
            {metres}
          </AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.35)', fontSize: 18, marginRight: 14 }}>
            m
          </AppText>
          <AppText
            weight="bold"
            style={{ fontSize: 54, lineHeight: 60, color: 'rgba(255,255,255,0.72)' }}
          >
            {String(centimetres).padStart(2, '0')}
          </AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }}>
            cm
          </AppText>
        </View>

        {/* Instruction text — fades in/out as state changes */}
        <Animated.View style={[{ marginTop: 3 }, labelStyle]}>
          <AppText
            style={{
              color: isHolding ? ACCENT_COLOR : 'rgba(255,255,255,0.38)',
              fontSize: 12,
              letterSpacing: 0.3,
              textAlign: 'center',
            }}
          >
            {statusLabel}
          </AppText>
        </Animated.View>
      </View>

      {/* Depth tape + diver — always visible */}
      <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 20, paddingTop: 4 }}>
        {/* Left: metre tape */}
        <View
          style={{
            width: 52,
            height: LANE_HEIGHT,
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingRight: 10,
          }}
        >
          {tapeMarkers.map((m) => {
            const isMajor = m % 5 === 0 || m === maxDepthMeters;
            return (
              <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <View
                  style={{
                    width: isMajor ? 8 : 4,
                    height: 1,
                    backgroundColor: isMajor
                      ? 'rgba(255,255,255,0.25)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                />
                <AppText
                  style={{
                    color: isMajor ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.16)',
                    fontSize: isMajor ? 10 : 8,
                    lineHeight: 10,
                  }}
                >
                  {isMajor ? `${m}m` : `${m}`}
                </AppText>
              </View>
            );
          })}
        </View>

        {/* Centre: rail + target + smooth animated diver */}
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Rail */}
          <View
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: 2,
              height: LANE_HEIGHT,
              backgroundColor: 'rgba(255,255,255,0.08)',
              marginLeft: -1,
              borderRadius: 1,
            }}
          />
          {/* Target marker */}
          <View
            style={{
              position: 'absolute',
              left: '50%',
              top: LANE_HEIGHT - 2,
              width: 24,
              height: 2,
              marginLeft: -12,
              backgroundColor: 'rgba(59,191,173,0.5)',
              borderRadius: 1,
            }}
          />

          {/* Diver — Reanimated translateY for smooth sub-tick motion */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: '50%',
                top: 0,
                width: DIVER_SIZE,
                height: DIVER_SIZE,
                marginLeft: -(DIVER_SIZE / 2),
                alignItems: 'center',
                justifyContent: 'center',
              },
              diverStyle,
            ]}
          >
            <View
              style={{
                position: 'absolute',
                width: DIVER_SIZE + 20,
                height: DIVER_SIZE + 20,
                borderRadius: (DIVER_SIZE + 20) / 2,
                backgroundColor: isHolding
                  ? 'rgba(59,191,173,0.15)'
                  : 'rgba(255,255,255,0.06)',
              }}
            />
            <View
              style={{
                width: DIVER_SIZE * 0.55,
                height: DIVER_SIZE * 0.55,
                borderRadius: (DIVER_SIZE * 0.55) / 2,
                backgroundColor: isHolding ? ACCENT_COLOR : 'rgba(255,255,255,0.75)',
              }}
            />
          </Animated.View>
        </View>

        {/* Right spacer mirrors tape width */}
        <View style={{ width: 52 }} />
      </View>
    </>
  );
});
