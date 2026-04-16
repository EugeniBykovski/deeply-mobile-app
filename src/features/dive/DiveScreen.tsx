import React, { useCallback } from 'react';
import { ScrollView, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { LoadingView } from '@/shared/components/LoadingView';
import { ErrorView } from '@/shared/components/ErrorView';
import { EmptyView } from '@/shared/components/EmptyView';
import { AppText } from '@/shared/components/AppText';
import { PageTopBar } from '@/shared/components/PageTopBar';

import { DivePreviewCard } from '@/features/home/components/DivePreviewCard';
import { useDiveTemplates } from '@/features/home/hooks/useHomeData';
import type { DiveTemplateItem } from '@/api/types';
import { colors } from '@/theme';

export function DiveScreen() {
  const { t } = useTranslation('tabs');
  const query = useDiveTemplates();

  const handleRefresh = useCallback(() => query.refetch(), [query]);
  const items = query.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />

      {/* Inline page header */}
      <PageTopBar title={t('dive_title')} />

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
          {items.length === 0 ? (
            <EmptyView message={t('dive_empty')} />
          ) : (
            <View className="gap-4">
              {/* Horizontal scroll preview */}
              <FlatList
                data={items.slice(0, 5)}
                keyExtractor={(item: DiveTemplateItem) => item.id}
                renderItem={({ item }) => <DivePreviewCard item={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                snapToInterval={172}
                decelerationRate="fast"
              />

              {/* Full list */}
              <View className="px-5 mt-2">
                <AppText variant="heading" weight="semibold" className="mb-3">
                  {t('dive_all', { defaultValue: 'All templates' })}
                </AppText>
                {items.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row items-center bg-brand-surface rounded-brand-lg border border-brand-border p-4 mb-2"
                  >
                    <View className="flex-1">
                      <AppText weight="medium">{item.title}</AppText>
                      <View className="flex-row gap-3 mt-1">
                        <AppText variant="caption" secondary>
                          {item.difficulty}
                        </AppText>
                        <AppText variant="caption" accent>
                          {item.maxDepthMeters}m
                        </AppText>
                      </View>
                    </View>
                    {item.isLocked && (
                      <AppText variant="caption" muted>
                        {t('dive_locked', { defaultValue: 'Locked' })}
                      </AppText>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
