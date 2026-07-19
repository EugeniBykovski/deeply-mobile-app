import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { pushOnboardingStep } from '../utils/navigate';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { trackEvent } from '@/shared/lib/analytics';
import { colors } from '@/theme';

const POINTS: { icon: string; key: string }[] = [
  { icon: 'crown', key: 'trial_point_full_access' },
  { icon: 'lock-open', key: 'trial_point_free_after' },
  { icon: 'sparkles', key: 'trial_point_pro' },
];

export function TrialScreen() {
  const { t } = useTranslation('onboarding');
  const { review } = useLocalSearchParams<{ review?: string }>();

  useEffect(() => {
    trackEvent('onboarding_step_viewed', { step: 'trial' });
  }, []);

  const handleContinue = () => {
    trackEvent('onboarding_completed_trial_step');
    if (review === '1') {
      router.replace('/settings' as any);
      return;
    }
    pushOnboardingStep('/(onboarding)/auth');
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      title={t('trial_title')}
      subtitle={t('trial_subtitle')}
      continueLabel={review === '1' ? t('done', { ns: 'common' }) : undefined}
      onContinue={handleContinue}
      onBack={() => router.back()}
    >
      <View className="gap-3" style={{ marginBottom: 20 }}>
        {POINTS.map((point) => (
          <View
            key={point.key}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 14,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: `${colors.accent}18`,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LiIcon name={point.icon} size={17} color={colors.accent} />
            </View>
            <AppText secondary style={{ flex: 1, lineHeight: 20 }}>
              {t(point.key)}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="caption" muted style={{ lineHeight: 18 }}>
        {t('trial_disclosure')}
      </AppText>
    </OnboardingLayout>
  );
}
