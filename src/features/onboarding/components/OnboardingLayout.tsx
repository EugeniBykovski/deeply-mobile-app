import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { AppButton } from '@/shared/components/AppButton';
import { LiIcon } from '@/shared/components/LiIcon';
import { OnboardingProgress } from './OnboardingProgress';
import { colors } from '@/theme';

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  continueLabel?: string;
  onContinue: () => void;
  onBack?: () => void;
  continueDisabled?: boolean;
  children: React.ReactNode;
}

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  continueLabel,
  onContinue,
  onBack,
  continueDisabled = false,
  children,
}: OnboardingLayoutProps) {
  const { t } = useTranslation('common');

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <LinearGradient
        colors={[colors.bg, '#0D2326', '#0B1C1D']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header row: back button (optional) + progress */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center gap-3">
            {onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="active:opacity-60"
                style={{ padding: 4 }}
              >
                <LiIcon name="arrow-left" size={20} color={colors.inkMuted} />
              </Pressable>
            ) : (
              <View style={{ width: 28 }} />
            )}
            <View className="flex-1">
              <OnboardingProgress current={step} total={totalSteps} />
            </View>
            {/* Spacer to mirror back-button width for centering */}
            <View style={{ width: 28 }} />
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title block */}
          <View className="mt-8 mb-8">
            <AppText variant="title" weight="bold" className="mb-2 leading-tight">
              {title}
            </AppText>
            {subtitle ? (
              <AppText secondary className="leading-relaxed">
                {subtitle}
              </AppText>
            ) : null}
          </View>

          {/* Screen-specific content */}
          {children}
        </ScrollView>

        {/* Sticky footer */}
        <View className="px-6 pb-6 pt-3">
          <AppButton
            label={continueLabel ?? t('continue')}
            variant="primary"
            size="lg"
            onPress={onContinue}
            disabled={continueDisabled}
            className="w-full"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
