import React, { memo } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { PHASE_COLORS } from '@/constants/phase';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';

export const SNAKE_HEIGHT = 200;

const DOT_RADIUS = 7;

interface SnakeVisualizationProps {
  steps: TrainingStep[];
  stepIndex: number;
  waypoints: { x: number; y: number }[];
  dotX: SharedValue<number> | DerivedValue<number>;
  dotY: SharedValue<number> | DerivedValue<number>;
}

export const SnakeVisualization = memo(function SnakeVisualization({
  steps,
  stepIndex,
  waypoints,
  dotX,
  dotY,
}: SnakeVisualizationProps) {
  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dotX.value - DOT_RADIUS },
      { translateY: dotY.value - DOT_RADIUS },
    ],
  }));

  const currentPhaseColor =
    PHASE_COLORS[steps[stepIndex]?.phase ?? 'REST'] ?? colors.accent;

  return (
    <View style={{ width: '100%', height: SNAKE_HEIGHT, position: 'relative' }}>
      {/* Path segments */}
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
              opacity: isDone ? 0.45 : isCurrent ? 1 : 0.25,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Animated dot — moves continuously along current segment */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: DOT_RADIUS * 2,
            height: DOT_RADIUS * 2,
            borderRadius: DOT_RADIUS,
            backgroundColor: currentPhaseColor,
            shadowColor: currentPhaseColor,
            shadowOpacity: 0.7,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            elevation: 4,
          },
          dotStyle,
        ]}
      />
    </View>
  );
});
