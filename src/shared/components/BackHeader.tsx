import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { AppText } from './AppText';
import { LiIcon } from './LiIcon';
import { colors } from '@/theme';

interface BackHeaderProps {
  title: string;
  onBack?: () => void;
  bordered?: boolean;
}

export function BackHeader({ title, onBack, bordered = true }: BackHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 12,
        ...(bordered ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}),
      }}
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        className="active:opacity-60"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <LiIcon name="arrow-left" size={22} color={colors.ink} />
      </Pressable>
      <AppText variant="heading" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );
}
