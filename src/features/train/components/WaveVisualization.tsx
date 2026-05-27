import React, { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSequence,
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

// ─── Crossfade timings ────────────────────────────────────────────────────────
// The dim and amplitude/speed transitions fire SIMULTANEOUSLY so there is never
// a "frozen dim" pause between them (previous callback-chain approach had a
// 130 ms dead zone that was visible as a snap on tight frame budgets).
const DIM_DURATION  = 120; // ms — how long opacity drops to DIM_TARGET
const DIM_TARGET    = 0.3; // opacity floor during crossfade
const FADE_DURATION = 220; // ms — how long opacity returns to 1

interface WaveDotProps {
  index: number;
  time: SharedValue<number>;
  amplitude: SharedValue<number>;
  color: DerivedValue<string>;
}

// React.memo prevents re-registration of the 32 useAnimatedStyle worklets on
// every elapsed/timeLeft tick in TrainingRunScreen. All props are stable
// SharedValue references — their .value changes on the UI thread independently
// of React renders, so memo-equality is always true during running steps.
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
  const time        = useSharedValue(0);
  const amplitude   = useSharedValue(PHASE_AMPLITUDE[phase] ?? 5);
  const speed       = useSharedValue(PHASE_SPEED[phase] ?? 0.6);
  const running     = useSharedValue(isRunning ? 1 : 0);
  const waveOpacity = useSharedValue(1);

  const isFirstPhase = useRef(true);

  useEffect(() => {
    running.value = isRunning ? 1 : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  useEffect(() => {
    const targetAmplitude = PHASE_AMPLITUDE[phase] ?? 5;
    const targetSpeed     = PHASE_SPEED[phase] ?? 0.6;

    if (isFirstPhase.current) {
      isFirstPhase.current = false;
      amplitude.value = targetAmplitude;
      speed.value     = targetSpeed;
      return;
    }

    // All three animations start at the same time:
    //
    //   waveOpacity: 1 → DIM_TARGET (DIM_DURATION ms)
    //                    → 1          (FADE_DURATION ms)
    //
    //   amplitude:   current → target (520 ms, eased)
    //   speed:       current → target (650 ms, eased)
    //
    // The dim masks the first frame of the amplitude jump. By the time opacity
    // returns to 1 (~340 ms), amplitude is already mid-transition and the wave
    // looks smooth. There is NEVER a pause between dim and transition start.
    waveOpacity.value = withSequence(
      withTiming(DIM_TARGET, { duration: DIM_DURATION, easing: Easing.out(Easing.quad) }),
      withTiming(1,          { duration: FADE_DURATION, easing: Easing.in(Easing.quad) }),
    );
    amplitude.value = withTiming(targetAmplitude, {
      duration: 520,
      easing: Easing.inOut(Easing.quad),
    });
    speed.value = withTiming(targetSpeed, { duration: 650 });
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
