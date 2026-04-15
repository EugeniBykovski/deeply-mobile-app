import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import { AppButton } from '@/shared/components/AppButton';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 mb-3">
      <AppText variant="heading" weight="semibold">
        {title}
      </AppText>
      {onSeeAll && (
        <AppButton
          label="See all"
          variant="ghost"
          size="sm"
          onPress={onSeeAll}
        />
      )}
    </View>
  );
}
