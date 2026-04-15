import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorView({
  message = 'Something went wrong. Please try again.',
  onRetry,
  fullScreen = false,
}: ErrorViewProps) {
  return (
    <View
      className={`items-center justify-center gap-4 px-8 ${fullScreen ? 'flex-1' : 'py-12'}`}
    >
      <AppText variant="heading" weight="semibold" className="text-center">
        Unable to load
      </AppText>
      <AppText secondary className="text-center leading-relaxed">
        {message}
      </AppText>
      {onRetry ? (
        <AppButton
          label="Try again"
          variant="secondary"
          size="sm"
          onPress={onRetry}
          className="mt-2"
        />
      ) : null}
    </View>
  );
}
