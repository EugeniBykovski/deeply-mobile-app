import React from 'react';
import { View } from 'react-native';
import { colors } from '@/theme';

interface OnboardingProgressProps {
  current: number;
  total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  return (
    <View className="flex-row gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 3,
            flex: i === current - 1 ? 2 : 1,
            borderRadius: 2,
            backgroundColor:
              i < current ? colors.accent : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </View>
  );
}
