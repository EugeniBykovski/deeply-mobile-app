import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/shared/components/AppText';
import { AppButton } from '@/shared/components/AppButton';
import { OnboardingProgress } from './OnboardingProgress';
import { colors } from '@/theme';

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  continueLabel?: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  children: React.ReactNode;
}

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  continueLabel = 'Continue',
  onContinue,
  continueDisabled = false,
  children,
}: OnboardingLayoutProps) {
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
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <OnboardingProgress current={step} total={totalSteps} />
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
            label={continueLabel}
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
