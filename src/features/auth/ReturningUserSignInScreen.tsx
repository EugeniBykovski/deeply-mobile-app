import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/shared/components/AppText';
import { AppleAuthButton } from './AppleAuthButton';
import { useAppleAuth } from './useAppleAuth';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors } from '@/theme';

/**
 * Returning-user screen — shown when the user has previously signed in with
 * Apple on this device but is currently signed out (e.g. after explicit logout
 * or token expiry with no valid refresh token).
 *
 * Also shown on a fresh install when FileSystem state is gone but the user
 * taps "Already have an account?" from the onboarding intro.
 *
 * Routing after sign-in:
 *   isNewUser: false → existing account → main app (no onboarding)
 *   isNewUser: true  → brand-new account reached here accidentally →
 *                      onboarding questionnaire
 */
export function ReturningUserSignInScreen() {
  const { t } = useTranslation('auth');
  const { complete } = useOnboardingStore();
  const { signIn, isLoading, isNewUser, error } = useAppleAuth();

  const handleSignIn = async () => {
    await signIn();

    if (!useAuthStore.getState().isAuthenticated) return;

    if (isNewUser) {
      // This Apple account had no Deeply profile — treat as new user and
      // send them through the onboarding questionnaire.
      router.replace('/(onboarding)');
    } else {
      // Existing account. Ensure isCompleted is set so that on a fresh
      // install (where FileSystem state was wiped) we don't route through
      // onboarding again after the next logout/cold-start cycle.
      complete();
      router.replace('/(app)/train');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.bg, '#0D2326', '#0F2A2A']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View className="flex-1 px-6 justify-between py-8">
        {/* Top — logo rings */}
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

          <AppText
            variant="display"
            weight="bold"
            className="mt-5 tracking-wider"
          >
            deeply
          </AppText>
          <AppText variant="caption" muted className="tracking-widest uppercase mt-1">
            breathe · dive · focus
          </AppText>
        </View>

        {/* Middle — welcome back copy */}
        <View className="items-center gap-3">
          <AppText variant="title" weight="bold" className="text-center">
            {t('welcome_back_title')}
          </AppText>
          <AppText secondary className="text-center leading-relaxed px-4">
            {t('welcome_back_subtitle')}
          </AppText>
        </View>

        {/* Bottom — CTA */}
        <View className="gap-4">
          <AppleAuthButton
            onPress={handleSignIn}
            isLoading={isLoading}
            error={error}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
            <AppText variant="caption" muted>{t('sign_in_terms_prefix')}</AppText>
            <Pressable onPress={() => Linking.openURL('https://deeplyocean.com/terms')}>
              <AppText variant="caption" style={{ color: colors.accent, textDecorationLine: 'underline' }}>
                {t('sign_in_terms_link')}
              </AppText>
            </Pressable>
            <AppText variant="caption" muted>{t('sign_in_terms_and')}</AppText>
            <Pressable onPress={() => Linking.openURL('https://deeplyocean.com/privacy')}>
              <AppText variant="caption" style={{ color: colors.accent, textDecorationLine: 'underline' }}>
                {t('sign_in_privacy_link')}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
