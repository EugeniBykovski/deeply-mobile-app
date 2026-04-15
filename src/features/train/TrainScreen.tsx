import React, { useCallback } from 'react';
import { ScrollView, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { LoadingView } from '@/shared/components/LoadingView';
import { ErrorView } from '@/shared/components/ErrorView';
import { EmptyView } from '@/shared/components/EmptyView';
import { AppText } from '@/shared/components/AppText';

import { TrainBlockCard } from '@/features/home/components/TrainBlockCard';
import { SectionHeader } from '@/features/home/components/SectionHeader';
import { useTrainBlocks } from '@/features/home/hooks/useHomeData';
import type { TrainBlock } from '@/api/types';

export function TrainScreen() {
  const { t } = useTranslation('tabs');
  const query = useTrainBlocks();

  const handleRefresh = useCallback(() => query.refetch(), [query]);

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
        <LoadingView fullScreen />
      </SafeAreaView>
    );
  }

  if (query.isError) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  const blocks = query.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={handleRefresh}
            tintColor="#3BBFAD"
            colors={['#3BBFAD']}
          />
        }
      >
        {/* Page header */}
        <View className="px-5 pt-6 pb-4">
          <AppText variant="title" weight="bold">
            {t('train_title')}
          </AppText>
        </View>

        {/* Programs */}
        {blocks.length === 0 ? (
          <EmptyView message={t('train_empty')} />
        ) : (
          <FlatList
            data={blocks}
            keyExtractor={(item: TrainBlock) => item.key}
            renderItem={({ item }) => <TrainBlockCard block={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            snapToInterval={212}
            decelerationRate="fast"
            scrollEnabled
          />
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
