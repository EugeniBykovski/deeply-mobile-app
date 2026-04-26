import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.bg, '#0D2326', '#0B1C1D']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo mark */}
        <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 32 }}>
          <Image
            source={require('../../../../assets/logo.png')}
            style={{ width: 80, height: 80, borderRadius: 20 }}
            resizeMode="contain"
          />
          <AppText
            variant="display"
            weight="bold"
            style={{ marginTop: 16, letterSpacing: 2 }}
          >
            deeply
          </AppText>
          <AppText variant="caption" muted style={{ letterSpacing: 4, textTransform: 'uppercase', marginTop: 4 }}>
            breathe · dive · focus
          </AppText>
        </View>

        {/* Title */}
        <AppText variant="title" weight="bold" style={{ marginBottom: 8 }}>
          {t('intro_title')}
        </AppText>
        <AppText secondary style={{ marginBottom: 24, lineHeight: 22 }}>
          {t('intro_subtitle')}
        </AppText>

        {/* Benefits */}
        <View style={{ gap: 12, marginBottom: 32 }}>
          {BENEFITS.map((b) => (
            <View
              key={b.titleKey}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
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
              <View style={{ flex: 1 }}>
                <AppText weight="semibold" style={{ marginBottom: 2 }}>
                  {t(b.titleKey)}
                </AppText>
                <AppText variant="caption" secondary style={{ lineHeight: 18 }}>
                  {t(b.descKey)}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* CTA — in normal document flow, always below the last card */}
        <View style={{ gap: 12 }}>
          <AppButton
            label={t('continue', { ns: 'common' })}
            variant="primary"
            size="lg"
            className="w-full"
            onPress={() => router.push('/(onboarding)/goals')}
          />

          {/* Returning users on fresh install can skip the questionnaire */}
          <Pressable
            onPress={() => router.push('/signin' as any)}
            style={{ alignItems: 'center', paddingVertical: 8 }}
            className="active:opacity-60"
          >
            <AppText variant="caption" muted>
              {t('already_have_account')}{' '}
              <AppText variant="caption" style={{ color: colors.accent }}>
                {t('sign_in', { ns: 'auth' })}
              </AppText>
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
