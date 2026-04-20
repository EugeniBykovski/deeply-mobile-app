import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';
import type { VisualizationMode } from '@/store/trainingPrefsStore';

interface ModeToggleProps {
  mode: VisualizationMode;
  onChange: (m: VisualizationMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 3,
        alignSelf: 'center',
      }}
    >
      {(['timer', 'snake'] as VisualizationMode[]).map((m) => {
        const selected = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            className="active:opacity-75"
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 9,
              backgroundColor: selected ? colors.accent : 'transparent',
            }}
          >
            <AppText
              variant="caption"
              weight={selected ? 'semibold' : 'medium'}
              style={{ color: selected ? colors.inkInverse : colors.inkMuted }}
            >
              {m === 'timer' ? 'Timer' : 'Snake'}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
