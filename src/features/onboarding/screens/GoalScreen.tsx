import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { AppText } from '@/shared/components/AppText';
import { useOnboardingStore, type OnboardingGoal } from '@/store/onboardingStore';
import { colors } from '@/theme';

const GOALS: { key: OnboardingGoal; icon: string; labelKey: string }[] = [
  { key: 'stress', icon: '🧘', labelKey: 'goal_stress' },
  { key: 'breathing', icon: '💨', labelKey: 'goal_breathing' },
  { key: 'training', icon: '🏋️', labelKey: 'goal_training' },
  { key: 'oxygen', icon: '📊', labelKey: 'goal_oxygen' },
  { key: 'freediving', icon: '🤿', labelKey: 'goal_freediving' },
  { key: 'sleep', icon: '🌙', labelKey: 'goal_sleep' },
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
                <AppText className="text-xl w-8 text-center">{goal.icon}</AppText>
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
                    <AppText
                      className="text-xs font-bold"
                      style={{ color: colors.inkInverse }}
                    >
                      ✓
                    </AppText>
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
