import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { AppText } from '@/shared/components/AppText';
import { useOnboardingStore, type SessionMode } from '@/store/onboardingStore';
import { colors } from '@/theme';

const MODES: { value: SessionMode; labelKey: string; desc: string }[] = [
  { value: '5', labelKey: 'mode_5', desc: 'Quick breathing reset' },
  { value: '10', labelKey: 'mode_10', desc: 'Focused practice' },
  { value: '20', labelKey: 'mode_20', desc: 'Deep training session' },
  { value: '40', labelKey: 'mode_40', desc: 'Full immersion protocol' },
];

export function ModeScreen() {
  const { t } = useTranslation('onboarding');
  const { data, setSessionMode } = useOnboardingStore();
  const [selected, setSelected] = useState<SessionMode | null>(data.sessionMode);

  const handleContinue = () => {
    if (!selected) return;
    setSessionMode(selected);
    router.push('/(onboarding)/notes');
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={5}
      title={t('mode_title')}
      subtitle={t('mode_subtitle')}
      onContinue={handleContinue}
      continueDisabled={!selected}
    >
      <View className="gap-3">
        {MODES.map((mode) => {
          const isSelected = selected === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => setSelected(mode.value)}
              className="active:opacity-80"
            >
              <View
                className="rounded-brand-lg border p-5 flex-row items-center gap-4"
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(59,191,173,0.12)'
                    : colors.surface,
                  borderColor: isSelected ? colors.accent : colors.border,
                }}
              >
                {/* Radio indicator */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.accent : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? colors.accent
                      : 'transparent',
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.inkInverse,
                      }}
                    />
                  )}
                </View>

                <View className="flex-1">
                  <AppText
                    variant="heading"
                    weight="semibold"
                    style={{ color: isSelected ? colors.accent : colors.ink }}
                  >
                    {t(mode.labelKey)}
                  </AppText>
                  <AppText variant="caption" secondary className="mt-0.5">
                    {mode.desc}
                  </AppText>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
