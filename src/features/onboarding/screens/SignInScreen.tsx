import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/shared/components/AppText';
import { AppleAuthButton } from '@/features/auth/AppleAuthButton';
import { useAppleAuth } from '@/features/auth/useAppleAuth';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors } from '@/theme';

export function SignInScreen() {
  const { t } = useTranslation('onboarding');
  const { complete, markSignedIn } = useOnboardingStore();
  const { signIn, isLoading, error } = useAppleAuth();

  const handleSignIn = async () => {
    await signIn();
    // Record that this device has had a successful Apple sign-in.
    // This prevents re-showing the onboarding questionnaire on future sign-outs.
    markSignedIn();
    complete();
    router.replace('/(app)/train');
  };

  const handleSkip = () => {
    // User skips sign-in — they stay in unauthenticated browse mode.
    // We do NOT call markSignedIn() here because they haven't actually
    // authenticated. If they sign out later from an authenticated session
    // (after eventually signing in), hasEverSignedIn will already be true.
    complete();
    router.replace('/(app)/train');
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.bg, '#0D2326', '#0F2A2A']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View className="flex-1 px-6 justify-between py-8">
        {/* Top — logo + rings */}
        <View className="items-center pt-8">
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 1,
              borderColor: 'rgba(59,191,173,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 86,
                height: 86,
                borderRadius: 43,
                borderWidth: 1,
                borderColor: 'rgba(59,191,173,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(59,191,173,0.15)',
                  borderWidth: 1.5,
                  borderColor: colors.accent,
                }}
              />
            </View>
          </View>
        </View>

        {/* Middle — text */}
        <View className="items-center gap-4">
          <AppText variant="title" weight="bold" className="text-center">
            {t('signin_title')}
          </AppText>
          <AppText secondary className="text-center leading-relaxed px-4">
            {t('signin_subtitle')}
          </AppText>
        </View>

        {/* Bottom — CTA */}
        <View className="gap-4">
          <AppleAuthButton
            onPress={handleSignIn}
            isLoading={isLoading}
            error={error}
            variant="sign_up"
          />

          <View
            onTouchEnd={handleSkip}
            className="items-center py-3 active:opacity-60"
          >
            <AppText muted variant="caption">
              {t('skip', { ns: 'common' })} for now
            </AppText>
          </View>

          <AppText
            variant="caption"
            muted
            className="text-center leading-relaxed"
          >
            {t('signin_terms')}
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}
