import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { useOnboardingStore, type OnboardingGoal } from '@/store/onboardingStore';
import { colors } from '@/theme';

const GOALS: { key: OnboardingGoal; icon: string; labelKey: string }[] = [
  { key: 'stress', icon: 'aimass', labelKey: 'goal_stress' },
  { key: 'breathing', icon: 'beat', labelKey: 'goal_breathing' },
  { key: 'training', icon: 'user-4', labelKey: 'goal_training' },
  { key: 'oxygen', icon: 'stethoscope-1', labelKey: 'goal_oxygen' },
  { key: 'freediving', icon: 'books-2', labelKey: 'goal_freediving' },
  { key: 'sleep', icon: 'moon-half-right-5', labelKey: 'goal_sleep' },
];

export function GoalScreen() {
  const { t } = useTranslation('onboarding');
  const { data, setGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<OnboardingGoal[]>(data.goals);

  const toggle = (key: OnboardingGoal) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key],
    );
  };

  const handleContinue = () => {
    setGoals(selected);
    router.push('/(onboarding)/mode');
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      title={t('goal_title')}
      subtitle={t('goal_subtitle')}
      onContinue={handleContinue}
      onBack={() => router.back()}
      continueDisabled={selected.length === 0}
    >
      <View className="gap-2.5">
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.key);
          return (
            <Pressable
              key={goal.key}
              onPress={() => toggle(goal.key)}
              className="active:opacity-80"
            >
              <View
                className="flex-row items-center gap-4 rounded-brand-lg p-4 border"
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(59,191,173,0.12)'
                    : colors.surface,
                  borderColor: isSelected ? colors.accent : colors.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isSelected
                      ? 'rgba(59,191,173,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LiIcon
                    name={goal.icon}
                    size={18}
                    color={isSelected ? colors.accent : colors.inkMuted}
                  />
                </View>
                <AppText
                  weight={isSelected ? 'semibold' : 'regular'}
                  style={{ color: isSelected ? colors.accent : colors.ink }}
                  className="flex-1"
                >
                  {t(goal.labelKey)}
                </AppText>
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
