import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { pushOnboardingStep } from '../utils/navigate';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { useOnboardingStore } from '@/store/onboardingStore';
import { trackEvent } from '@/shared/lib/analytics';
import { colors } from '@/theme';

const SAFETY_POINTS: { icon: string; key: string }[] = [
  { icon: 'water-drop-1', key: 'safety_point_no_solo' },
  { icon: 'beat', key: 'safety_point_no_hyperventilate' },
  { icon: 'xmark-circle', key: 'safety_point_stop_if_unwell' },
  { icon: 'stethoscope-1', key: 'safety_point_not_medical_advice' },
];

export function SafetyScreen() {
  const { t } = useTranslation('onboarding');
  const { review } = useLocalSearchParams<{ review?: string }>();
  const { safetyAcknowledged, setSafetyAcknowledged } = useOnboardingStore();
  const [checked, setChecked] = useState(safetyAcknowledged);

  useEffect(() => {
    trackEvent('onboarding_step_viewed', { step: 'safety' });
  }, []);

  const handleContinue = () => {
    if (!checked) return;
    setSafetyAcknowledged(true);
    trackEvent('onboarding_safety_acknowledged');
    pushOnboardingStep('/(onboarding)/trial', review);
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={5}
      title={t('safety_title')}
      subtitle={t('safety_subtitle')}
      onContinue={handleContinue}
      onBack={() => router.back()}
      continueDisabled={!checked}
    >
      <View className="gap-3" style={{ marginBottom: 20 }}>
        {SAFETY_POINTS.map((point) => (
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
                backgroundColor: `${colors.warning}18`,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LiIcon name={point.icon} size={17} color={colors.warning} />
            </View>
            <AppText secondary style={{ flex: 1, lineHeight: 20 }}>
              {t(point.key)}
            </AppText>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => setChecked((c) => !c)}
        className="active:opacity-80"
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={t('safety_acknowledge')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: checked ? colors.accent : colors.border,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            borderWidth: 1.5,
            borderColor: checked ? colors.accent : colors.inkMuted,
            backgroundColor: checked ? colors.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {checked && <LiIcon name="checkmark" size={14} color={colors.inkInverse} />}
        </View>
        <AppText secondary style={{ flex: 1, lineHeight: 20 }}>
          {t('safety_acknowledge')}
        </AppText>
      </Pressable>
    </OnboardingLayout>
  );
}
