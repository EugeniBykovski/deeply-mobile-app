import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';

interface StatCardProps {
  value: number | string;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <AppText variant="title" weight="bold" accent>
        {value}
      </AppText>
      <AppText variant="caption" secondary style={{ textAlign: 'center' }}>
        {label}
      </AppText>
    </View>
  );
}
