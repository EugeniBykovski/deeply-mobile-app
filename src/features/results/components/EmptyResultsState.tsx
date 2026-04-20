import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { colors } from '@/theme';

export function EmptyResultsState() {
  const { t } = useTranslation('tabs');
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 80,
        gap: 16,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: `${colors.accent}12`,
          borderWidth: 1,
          borderColor: `${colors.accent}30`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LiIcon name="trend-up-1" size={30} color={colors.accent} />
      </View>
      <AppText secondary style={{ textAlign: 'center', lineHeight: 22 }}>
        {t('results_empty_hint')}
      </AppText>
    </View>
  );
}
