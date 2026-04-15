import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

interface EmptyViewProps {
  title?: string;
  message?: string;
  fullScreen?: boolean;
}

export function EmptyView({
  title = 'Nothing here yet',
  message,
  fullScreen = false,
}: EmptyViewProps) {
  return (
    <View
      className={`items-center justify-center gap-2 px-8 ${fullScreen ? 'flex-1' : 'py-12'}`}
    >
      <AppText variant="heading" weight="medium" secondary className="text-center">
        {title}
      </AppText>
      {message ? (
        <AppText muted className="text-center leading-relaxed">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
