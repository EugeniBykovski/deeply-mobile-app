import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/shared/components/AppText';

export function HomeHeader() {
  return (
    <View className="px-5 pt-4 pb-6">
      <AppText variant="label" muted className="mb-1">
        Welcome to
      </AppText>
      <AppText variant="title" weight="bold">
        Deeply
      </AppText>
      <AppText variant="body" secondary className="mt-1">
        Breathe. Dive. Focus.
      </AppText>
    </View>
  );
}
