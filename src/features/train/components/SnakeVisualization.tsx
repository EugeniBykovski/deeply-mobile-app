import React, { useEffect, memo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { PHASE_COLORS } from '@/constants/phase';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';

export const SNAKE_HEIGHT = 200;

interface SnakeVisualizationProps {
  steps: TrainingStep[];
  stepIndex: number;
  /** Pass a ref (not the value) so this component doesn't re-render every second. */
  timeLeftRef: React.MutableRefObject<number>;
  runState: 'idle' | 'running' | 'paused' | 'done';
  waypoints: { x: number; y: number }[];
  ballX: SharedValue<number>;
  ballY: SharedValue<number>;
}

// memo: only re-renders when steps/stepIndex/runState/waypoints/ballX/ballY
// change — NOT every second when the parent's timeLeft state ticks.
export const SnakeVisualization = memo(function SnakeVisualization({
  steps,
  stepIndex,
  timeLeftRef,
  runState,
  waypoints,
  ballX,
  ballY,
}: SnakeVisualizationProps) {
  const phaseColor = PHASE_COLORS[steps[stepIndex]?.phase ?? 'REST'] ?? colors.accent;

  // Trigger a single smooth animation per step (or per resume).
  // Using [stepIndex, runState] as deps means we start one continuous
  // withTiming per step instead of restarting every second.
  useEffect(() => {
    if (runState === 'paused' || runState === 'idle') {
      cancelAnimation(ballX);
      cancelAnimation(ballY);
      return;
    }
    if (runState === 'done' || !steps[stepIndex]) return;

    const remaining = timeLeftRef.current;
    const from = waypoints[stepIndex]     ?? { x: 0, y: 0 };
    const to   = waypoints[stepIndex + 1] ?? from;

    // Snap ball to its correct current position (no animation) so we don't
    // animate from the wrong starting point after a step change or resume.
    const total   = steps[stepIndex].durationSeconds;
    const elapsed = total > 0 ? total - remaining : 0;
    const progress = total > 0 ? elapsed / total : 0;
    ballX.value = from.x + (to.x - from.x) * progress;
    ballY.value = from.y + (to.y - from.y) * progress;

    // One smooth withTiming for the remaining duration.
    const duration = Math.max(remaining * 1000, 16);
    ballX.value = withTiming(to.x, { duration, easing: Easing.linear });
    ballY.value = withTiming(to.y, { duration, easing: Easing.linear });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, runState]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ballX.value - 12 },
      { translateY: ballY.value - 12 },
    ],
  }));

  return (
    <View style={{ width: '100%', height: SNAKE_HEIGHT, position: 'relative' }}>
      {waypoints.slice(0, -1).map((from, i) => {
        const to = waypoints[i + 1]!;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 1) return null;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const segColor = PHASE_COLORS[steps[i]?.phase ?? 'REST'] ?? colors.accent;
        const isDone    = i < stepIndex;
        const isCurrent = i === stepIndex;

        return (
          <View
            key={`seg-${i}`}
            style={{
              position: 'absolute',
              left: (from.x + to.x) / 2 - length / 2,
              top:  (from.y + to.y) / 2 - 2,
              width: length,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDone || isCurrent ? segColor : colors.border,
              opacity: isDone ? 0.4 : isCurrent ? 1 : 0.3,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {waypoints.map((pt, i) => {
        const ptPhase = steps[i]?.phase ?? steps[i - 1]?.phase ?? 'REST';
        const ptColor = PHASE_COLORS[ptPhase] ?? colors.accent;
        const isPast  = i <= stepIndex;

        return (
          <View
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: pt.x - 5,
              top:  pt.y - 5,
              width:  10,
              height: 10,
              borderRadius: 5,
              backgroundColor: isPast ? ptColor : colors.border,
              opacity: isPast ? 0.65 : 0.35,
            }}
          />
        );
      })}

      <Animated.View
        style={[
          {
            position: 'absolute',
            width:  24,
            height: 24,
            borderRadius: 12,
            backgroundColor: phaseColor,
            shadowColor: phaseColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.85,
            shadowRadius: 8,
            elevation: 6,
          },
          ballStyle,
        ]}
      />
    </View>
  );
}
