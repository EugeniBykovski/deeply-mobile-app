import React from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/shared/components/AppText';

export default function NotFound() {
  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="flex-1 items-center justify-center px-8 gap-4">
        <AppText variant="title" weight="bold">
          404
        </AppText>
        <AppText secondary className="text-center">
          This screen doesn&apos;t exist.
        </AppText>
        <Link href="/">
          <AppText accent>Go home</AppText>
        </Link>
      </View>
    </SafeAreaView>
  );
}
