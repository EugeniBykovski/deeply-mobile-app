import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './AppText';

interface LoadingViewProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingView({
  message,
  fullScreen = false,
}: LoadingViewProps) {
  return (
    <View
      className={`items-center justify-center gap-3 ${fullScreen ? 'flex-1' : 'py-12'}`}
    >
      <ActivityIndicator size="large" color={colors.accent} />
      {message ? (
        <AppText variant="caption" secondary>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
