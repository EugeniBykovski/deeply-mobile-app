import React from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/shared/components/AppText';
import { AppButton } from '@/shared/components/AppButton';
import { LiIcon } from '@/shared/components/LiIcon';
import { colors } from '@/theme';

const BENEFITS: { icon: string; accent: string; titleKey: string; descKey: string }[] = [
  { icon: 'water-drop-1', accent: '#3BBFAD', titleKey: 'benefit_1_title', descKey: 'benefit_1_desc' },
  { icon: 'stopwatch',    accent: '#D4915A', titleKey: 'benefit_2_title', descKey: 'benefit_2_desc' },
  { icon: 'trend-up-1',  accent: '#5A8FBF', titleKey: 'benefit_3_title', descKey: 'benefit_3_desc' },
  { icon: 'books-2',     accent: '#8B7BB5', titleKey: 'benefit_4_title', descKey: 'benefit_4_desc' },
];

export function IntroScreen() {
  const { t } = useTranslation('onboarding');

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.bg, '#0D2326', '#0B1C1D']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View className="flex-1 px-6">
        {/* Logo mark */}
        <View className="items-center pt-12 pb-10">
          <Image
            source={require('../../../../assets/logo.png')}
            style={{ width: 80, height: 80, borderRadius: 20 }}
            resizeMode="contain"
          />
          <AppText
            variant="display"
            weight="bold"
            className="mt-4 tracking-wider"
          >
            deeply
          </AppText>
          <AppText variant="caption" muted className="tracking-widest uppercase mt-1">
            breathe · dive · focus
          </AppText>
        </View>

        {/* Title */}
        <AppText variant="title" weight="bold" className="mb-2">
          {t('intro_title')}
        </AppText>
        <AppText secondary className="mb-8 leading-relaxed">
          {t('intro_subtitle')}
        </AppText>

        {/* Benefits */}
        <View className="gap-3 flex-1">
          {BENEFITS.map((b) => (
            <View
              key={b.titleKey}
              className="flex-row items-center gap-4 bg-brand-surface rounded-brand-lg p-4 border border-brand-border"
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: `${b.accent}18`,
                  borderWidth: 1,
                  borderColor: `${b.accent}30`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LiIcon name={b.icon} size={22} color={b.accent} />
              </View>
              <View className="flex-1">
                <AppText weight="semibold" className="mb-0.5">
                  {t(b.titleKey)}
                </AppText>
                <AppText variant="caption" secondary className="leading-relaxed">
                  {t(b.descKey)}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View className="pb-6 pt-6">
          <AppButton
            label={t('continue', { ns: 'common' })}
            variant="primary"
            size="lg"
            className="w-full"
            onPress={() => router.push('/(onboarding)/goals')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
