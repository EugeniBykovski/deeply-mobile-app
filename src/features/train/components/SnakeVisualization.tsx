import React, { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { PHASE_COLORS } from '@/constants/phase';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';

export const SNAKE_HEIGHT = 200;

interface SnakeVisualizationProps {
  steps: TrainingStep[];
  stepIndex: number;
  waypoints: { x: number; y: number }[];
  ballX: SharedValue<number>;
  ballY: SharedValue<number>;
}

// Ball position is driven by a withSequence launched by the parent — this
// component is purely visual and never restarts animations itself. memo ensures
// it only re-renders when stepIndex changes (segment colors update), not every
// second when the parent's timeLeft ticks.
export const SnakeVisualization = memo(function SnakeVisualization({
  steps,
  stepIndex,
  waypoints,
  ballX,
  ballY,
}: SnakeVisualizationProps) {
  const phaseColor = PHASE_COLORS[steps[stepIndex]?.phase ?? 'REST'] ?? colors.accent;

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
});
