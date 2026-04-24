import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/shared/components/AppText';
import { AppleAuthButton } from '@/features/auth/AppleAuthButton';
import { useAppleAuth } from '@/features/auth/useAppleAuth';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

const openTerms = () => router.push('/legal/terms');
const openPrivacy = () => router.push('/legal/privacy');

export function SignInScreen() {
  const { t } = useTranslation('onboarding');
  const { complete } = useOnboardingStore();
  const { signIn, isLoading, error } = useAppleAuth();
  const [consentVisible, setConsentVisible] = useState(false);

  const handleSignInPress = () => {
    setConsentVisible(true);
  };

  const handleConsentAccept = async () => {
    setConsentVisible(false);
    await signIn();
    // Only proceed if auth actually succeeded
    if (!useAuthStore.getState().isAuthenticated) return;
    complete();
    router.replace('/(app)/train');
  };

  const handleConsentDecline = () => {
    setConsentVisible(false);
  };

  const handleSkip = () => {
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
            onPress={handleSignInPress}
            isLoading={isLoading}
            error={error}
            variant="sign_up"
          />

          <Pressable
            onPress={() => router.push('/signin' as any)}
            className="items-center py-2 active:opacity-60"
          >
            <AppText variant="caption" muted>
              {t('already_have_account')}{' '}
              <AppText variant="caption" style={{ color: colors.accent }}>
                {t('sign_in', { ns: 'auth' })}
              </AppText>
            </AppText>
          </Pressable>

          <Pressable onPress={handleSkip} className="items-center py-2 active:opacity-60">
            <AppText muted variant="caption">
              {t('skip', { ns: 'common' })} for now
            </AppText>
          </Pressable>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
            <AppText variant="caption" muted>{t('consent_agree')}</AppText>
            <Pressable onPress={openTerms}>
              <AppText variant="caption" style={{ color: colors.accent, textDecorationLine: 'underline' }}>
                {t('consent_terms')}
              </AppText>
            </Pressable>
            <AppText variant="caption" muted>{t('consent_and')}</AppText>
            <Pressable onPress={openPrivacy}>
              <AppText variant="caption" style={{ color: colors.accent, textDecorationLine: 'underline' }}>
                {t('consent_privacy')}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* iOS-style consent modal */}
      <Modal
        visible={consentVisible}
        transparent
        animationType="slide"
        onRequestClose={handleConsentDecline}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        >
          <View
            style={{
              backgroundColor: '#112224',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 24,
              paddingTop: 28,
              paddingBottom: 40,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignSelf: 'center',
                marginBottom: 4,
              }}
            />

            <AppText variant="heading" weight="bold" style={{ textAlign: 'center' }}>
              {t('consent_title')}
            </AppText>

            <AppText secondary style={{ textAlign: 'center', lineHeight: 22 }}>
              {t('consent_body')}
            </AppText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
              <AppText variant="caption" muted>{t('consent_agree')}</AppText>
              <Pressable onPress={openTerms}>
                <AppText variant="caption" style={{ color: colors.accent, textDecorationLine: 'underline' }}>
                  {t('consent_terms')}
                </AppText>
              </Pressable>
              <AppText variant="caption" muted>{t('consent_and')}</AppText>
              <Pressable onPress={openPrivacy}>
                <AppText variant="caption" style={{ color: colors.accent, textDecorationLine: 'underline' }}>
                  {t('consent_privacy')}
                </AppText>
              </Pressable>
            </View>

            <Pressable
              onPress={handleConsentAccept}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 4,
              }}
              className="active:opacity-80"
            >
              <AppText weight="bold" style={{ color: '#fff', fontSize: 16 }}>
                {t('consent_cta')}
              </AppText>
            </Pressable>

            <Pressable
              onPress={handleConsentDecline}
              style={{ alignItems: 'center', paddingVertical: 10 }}
              className="active:opacity-60"
            >
              <AppText muted variant="caption">{t('consent_decline')}</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
