import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { useOnboardingStore, type ExperienceLevel } from '@/store/onboardingStore';
import { colors } from '@/theme';

const LEVELS: {
  key: ExperienceLevel;
  icon: string;
  labelKey: string;
  descKey: string;
}[] = [
  { key: 'beginner', icon: 'leaf-1', labelKey: 'level_beginner', descKey: 'level_beginner_desc' },
  { key: 'intermediate', icon: 'water-drop-1', labelKey: 'level_intermediate', descKey: 'level_intermediate_desc' },
  { key: 'regular', icon: 'heart', labelKey: 'level_regular', descKey: 'level_regular_desc' },
  { key: 'pro', icon: 'line-height', labelKey: 'level_pro', descKey: 'level_pro_desc' },
];

export function LevelScreen() {
  const { t } = useTranslation('onboarding');
  const { data, setLevel } = useOnboardingStore();
  const [selected, setSelected] = useState<ExperienceLevel | null>(data.level);

  const handleContinue = () => {
    if (!selected) return;
    setLevel(selected);
    router.push('/(onboarding)/auth');
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      title={t('level_title')}
      subtitle={t('level_subtitle')}
      onContinue={handleContinue}
      onBack={() => router.back()}
      continueDisabled={!selected}
    >
      <View className="gap-3">
        {LEVELS.map((level) => {
          const isSelected = selected === level.key;
          return (
            <Pressable
              key={level.key}
              onPress={() => setSelected(level.key)}
              className="active:opacity-80"
            >
              <View
                className="flex-row items-center gap-4 rounded-brand-lg border p-4"
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(59,191,173,0.12)'
                    : colors.surface,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderWidth: isSelected ? 1.5 : 1,
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isSelected
                      ? 'rgba(59,191,173,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <LiIcon
                    name={level.icon}
                    size={22}
                    color={isSelected ? colors.accent : colors.inkMuted}
                  />
                </View>

                <View className="flex-1">
                  <AppText
                    weight="semibold"
                    style={{ color: isSelected ? colors.accent : colors.ink }}
                  >
                    {t(level.labelKey)}
                  </AppText>
                  <AppText variant="caption" secondary className="mt-0.5">
                    {t(level.descKey)}
                  </AppText>
                </View>

                {isSelected && (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LiIcon name="checkmark" size={12} color={colors.inkInverse} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
