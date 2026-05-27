import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';

const N_DOTS = 32;
const DOT_SIZE = 7;
export const WAVE_HEIGHT = 120;

const PHASE_AMPLITUDE: Record<string, number> = {
  INHALE: 30,
  HOLD:   26,
  EXHALE: 8,
  REST:   5,
};

const PHASE_SPEED: Record<string, number> = {
  INHALE: 2.2,
  HOLD:   0.9,
  EXHALE: 1.6,
  REST:   0.6,
};

interface WaveDotProps {
  index: number;
  time: SharedValue<number>;
  amplitude: SharedValue<number>;
  color: DerivedValue<string>;
}

function WaveDot({ index, time, amplitude, color }: WaveDotProps) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const phaseOffset = (index / N_DOTS) * Math.PI * 2;
    const y = amplitude.value * Math.sin(time.value + phaseOffset);
    return {
      transform: [{ translateY: y }],
      backgroundColor: color.value,
    };
  });

  return (
    <Animated.View
      style={[{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 }, style]}
    />
  );
}

interface WaveVisualizationProps {
  phase: string;
  isRunning: boolean;
  color: DerivedValue<string>;
}

export function WaveVisualization({ phase, isRunning, color }: WaveVisualizationProps) {
  const time = useSharedValue(0);
  const amplitude = useSharedValue(PHASE_AMPLITUDE.REST ?? 5);
  const speed = useSharedValue(PHASE_SPEED.REST ?? 0.6);
  const running = useSharedValue(isRunning ? 1 : 0);

  useEffect(() => {
    running.value = isRunning ? 1 : 0;
  }, [isRunning]);

  useEffect(() => {
    amplitude.value = withTiming(PHASE_AMPLITUDE[phase] ?? 5, {
      duration: 600,
      easing: Easing.inOut(Easing.quad),
    });
    speed.value = withTiming(PHASE_SPEED[phase] ?? 0.6, { duration: 800 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (running.value === 0) return;
    time.value += speed.value * ((frameInfo.timeSincePreviousFrame ?? 16) / 1000);
  });

  return (
    <View
      style={{
        width: '100%',
        height: WAVE_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
      }}
    >
      {Array.from({ length: N_DOTS }, (_, i) => (
        <WaveDot key={i} index={i} time={time} amplitude={amplitude} color={color} />
      ))}
    </View>
  );
}
