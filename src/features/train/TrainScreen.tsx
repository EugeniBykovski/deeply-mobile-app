import React, { useCallback } from 'react';
import { ScrollView, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { LoadingView } from '@/shared/components/LoadingView';
import { ErrorView } from '@/shared/components/ErrorView';
import { EmptyView } from '@/shared/components/EmptyView';
import { PageTopBar } from '@/shared/components/PageTopBar';

import { TrainBlockCard } from '@/features/home/components/TrainBlockCard';
import { useTrainBlocks } from '@/features/home/hooks/useHomeData';
import type { TrainBlock } from '@/api/types';
import { colors } from '@/theme';

export function TrainScreen() {
  const { t } = useTranslation('tabs');
  const query = useTrainBlocks();

  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />

      {/* Inline page header — replaces the removed native nav bar */}
      <PageTopBar title={t('train_title')} />

      {query.isLoading ? (
        <LoadingView fullScreen />
      ) : query.isError ? (
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={handleRefresh}
        />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {(query.data ?? []).length === 0 ? (
            <EmptyView message={t('train_empty')} />
          ) : (
            <FlatList
              data={query.data ?? []}
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
      )}
    </SafeAreaView>
  );
}
