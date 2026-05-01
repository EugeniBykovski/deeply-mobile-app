import React, { memo } from 'react';
import { View } from 'react-native';
import { PHASE_COLORS } from '@/constants/phase';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';

export const SNAKE_HEIGHT = 200;

interface SnakeVisualizationProps {
  steps: TrainingStep[];
  stepIndex: number;
  waypoints: { x: number; y: number }[];
}

export const SnakeVisualization = memo(function SnakeVisualization({
  steps,
  stepIndex,
  waypoints,
}: SnakeVisualizationProps) {
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
              opacity: isDone ? 0.45 : isCurrent ? 1 : 0.25,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

    </View>
  );
});
