import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { AppButton } from '@/shared/components/AppButton';
import { colors } from '@/theme';

interface AppleAuthButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  error?: string | null;
  variant?: 'sign_in' | 'sign_up';
}

export function AppleAuthButton({
  onPress,
  isLoading = false,
  error,
  variant = 'sign_in',
}: AppleAuthButtonProps) {
  const { t } = useTranslation('auth');

  const buttonType = variant === 'sign_up'
    ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
    : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN;

  if (Platform.OS !== 'ios') {
    return (
      <View className="items-center gap-3">
        <AppText secondary className="text-center">
          {t('apple_sign_in')} is only available on iOS.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {isLoading ? (
        <View className="h-14 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={buttonType}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={14}
          style={{ width: '100%', height: 56 }}
          onPress={onPress}
        />
      )}

      {error ? (
        <AppText
          variant="caption"
          className="text-center"
          style={{ color: colors.error }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/**
 * Fallback sign-in button for non-iOS platforms (dev/testing only).
 * Never shown to real users.
 */
export function FallbackAuthButton({
  onPress,
  isLoading,
}: Pick<AppleAuthButtonProps, 'onPress' | 'isLoading'>) {
  const { t } = useTranslation('auth');
  return (
    <AppButton
      label={t('apple_sign_in')}
      variant="secondary"
      loading={isLoading}
      onPress={onPress}
      className="w-full h-14"
    />
  );
}
