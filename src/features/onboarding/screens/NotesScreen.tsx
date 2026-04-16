import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors } from '@/theme';

type Choice = 'yes' | 'no';

export function NotesScreen() {
  const { t } = useTranslation('onboarding');
  const { data, setWantsNotes } = useOnboardingStore();
  const [choice, setChoice] = useState<Choice | null>(
    data.wantsNotes === null ? null : data.wantsNotes ? 'yes' : 'no',
  );

  const handleContinue = () => {
    if (choice === null) return;
    setWantsNotes(choice === 'yes');
    router.push('/(onboarding)/level');
  };

  const OPTIONS: { key: Choice; icon: string; label: string }[] = [
    { key: 'yes', icon: 'check-circle-1', label: t('notes_yes') },
    { key: 'no', icon: 'xmark-circle', label: t('notes_no') },
  ];

  return (
    <OnboardingLayout
      step={4}
      totalSteps={5}
      title={t('notes_title')}
      subtitle={t('notes_subtitle')}
      onContinue={handleContinue}
      onBack={() => router.back()}
      continueDisabled={choice === null}
    >
      <View className="gap-4">
        {OPTIONS.map((opt) => {
          const isSelected = choice === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setChoice(opt.key)}
              className="active:opacity-80"
            >
              <View
                className="rounded-brand-xl border p-6 items-center gap-3"
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(59,191,173,0.12)'
                    : colors.surface,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderWidth: isSelected ? 1.5 : 1,
                }}
              >
                <LiIcon
                  name={opt.icon}
                  size={40}
                  color={isSelected ? colors.accent : colors.inkMuted}
                />
                <AppText
                  weight="medium"
                  className="text-center leading-relaxed"
                  style={{ color: isSelected ? colors.accent : colors.ink }}
                >
                  {opt.label}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
