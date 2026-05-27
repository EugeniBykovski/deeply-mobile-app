import React, { useEffect, useRef } from 'react';
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

// React.memo is critical: WaveDot props are all stable SharedValue references
// whose VALUES change on the UI thread. Without memo, every elapsed/timeLeft
// state update in TrainingRunScreen re-renders all 32 WaveDots, causing
// Reanimated to re-register each useAnimatedStyle worklet on the UI thread.
// That re-registration creates a ~1 frame gap with no style → visible snap.
const WaveDot = React.memo(function WaveDot({ index, time, amplitude, color }: WaveDotProps) {
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
});

interface WaveVisualizationProps {
  phase: string;
  isRunning: boolean;
  color: DerivedValue<string>;
}

export function WaveVisualization({ phase, isRunning, color }: WaveVisualizationProps) {
  const time      = useSharedValue(0);
  const amplitude = useSharedValue(PHASE_AMPLITUDE[phase] ?? 5);
  const speed     = useSharedValue(PHASE_SPEED[phase] ?? 0.6);
  const running   = useSharedValue(isRunning ? 1 : 0);
  // Container opacity used for the crossfade on phase change — never touches
  // individual dot worklets so no re-registration occurs.
  const waveOpacity = useSharedValue(1);

  // Track whether this is the initial mount so we skip the crossfade on the
  // very first phase value (no previous state to transition from).
  const isFirstPhase = useRef(true);

  useEffect(() => {
    running.value = isRunning ? 1 : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  useEffect(() => {
    // Capture target values as primitives so they're safe inside the worklet
    // closure (worklets cannot close over arbitrary JS objects).
    const targetAmplitude = PHASE_AMPLITUDE[phase] ?? 5;
    const targetSpeed     = PHASE_SPEED[phase] ?? 0.6;

    if (isFirstPhase.current) {
      isFirstPhase.current = false;
      // Set immediately on first mount — no previous state to crossfade from.
      amplitude.value = targetAmplitude;
      speed.value     = targetSpeed;
      return;
    }

    // Phase boundary crossfade:
    //   0 – 130 ms  : container dims to 40 % opacity
    //   130 ms      : amplitude + speed start transitioning (UI thread)
    //   130 – 310 ms: container brightens back to full while amplitude moves
    //
    // The dim hides the single frame where dots may snap from old→new sine
    // values before withTiming has had a chance to ease the amplitude.
    waveOpacity.value = withTiming(
      0.35,
      { duration: 130, easing: Easing.out(Easing.quad) },
      (finished) => {
        'worklet';
        if (!finished) return;
        amplitude.value = withTiming(targetAmplitude, {
          duration: 520,
          easing: Easing.inOut(Easing.quad),
        });
        speed.value = withTiming(targetSpeed, { duration: 650 });
        waveOpacity.value = withTiming(1, {
          duration: 200,
          easing: Easing.in(Easing.quad),
        });
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (running.value === 0) return;
    time.value += speed.value * ((frameInfo.timeSincePreviousFrame ?? 16) / 1000);
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: '100%',
          height: WAVE_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
        },
        containerStyle,
      ]}
    >
      {Array.from({ length: N_DOTS }, (_, i) => (
        <WaveDot key={i} index={i} time={time} amplitude={amplitude} color={color} />
      ))}
    </Animated.View>
  );
}
