import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';

export function HomeHeader() {
  const { t } = useTranslation('tabs');

  return (
    <View className="px-5 pt-3 pb-4">
      <AppText variant="label" muted className="mb-1">
        {t('home_welcome', { defaultValue: 'Welcome to' })}
      </AppText>
      <AppText variant="title" weight="bold">
        Deeply
      </AppText>
      <AppText variant="body" secondary className="mt-0.5">
        Breathe. Dive. Focus.
      </AppText>
    </View>
  );
}
