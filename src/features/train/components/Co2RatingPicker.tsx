import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';

interface Co2RatingPickerProps {
  value: number | null;
  onChange: (score: number) => void;
  title: string;
  hint: string;
}

export function Co2RatingPicker({ value, onChange, title, hint }: Co2RatingPickerProps) {
  return (
    <View style={{ marginTop: 28, width: '100%', alignItems: 'center' }}>
      <AppText weight="semibold" style={{ marginBottom: 4 }}>
        {title}
      </AppText>
      <AppText variant="caption" secondary style={{ marginBottom: 16, textAlign: 'center' }}>
        {hint}
      </AppText>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: 10 }, (_, i) => {
          const score = i + 1;
          const selected = value === score;
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.border,
              }}
            >
              <AppText
                variant="caption"
                weight="semibold"
                style={{ color: selected ? colors.inkInverse : colors.ink }}
              >
                {score}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
