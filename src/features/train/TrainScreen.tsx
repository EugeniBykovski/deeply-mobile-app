import React, { useCallback } from 'react';
import { View, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorView } from '@/shared/components/ErrorView';
import { EmptyView } from '@/shared/components/EmptyView';
import { SkeletonProgramCard } from '@/shared/components/Skeleton';
import { AppText } from '@/shared/components/AppText';
import { PageTopBar } from '@/shared/components/PageTopBar';
import { LiIcon } from '@/shared/components/LiIcon';
import { useTrainBlocks } from '@/features/home/hooks/useHomeData';
import { ProgramCard } from './components/ProgramCard';
import type { TrainBlock } from '@/api/types';
import { colors } from '@/theme';

export function TrainScreen() {
  const { t } = useTranslation('tabs');
  const query = useTrainBlocks();

  const handleRefresh = useCallback(() => query.refetch(), [query]);

  const allBlocks    = query.data ?? [];
  const programs     = allBlocks.filter((b) => b.key !== 'PRIVATE');
  const privateBlock = allBlocks.find((b) => b.key === 'PRIVATE');

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />
      <PageTopBar title={t('train_title')} />

      {query.isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonProgramCard />
              <SkeletonProgramCard />
            </View>
          ))}
        </View>
      ) : query.isError ? (
        <ErrorView fullScreen message={t('error_connection', { ns: 'common' })} onRetry={handleRefresh} />
      ) : programs.length === 0 ? (
        <EmptyView message={t('train_empty')} />
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item: TrainBlock) => item.key}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          renderItem={({ item }) => <ProgramCard block={item} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListFooterComponent={
            privateBlock ? (
              <Pressable
                onPress={() => router.push('/train/private/new' as any)}
                className="active:opacity-70"
                style={{ marginTop: 4 }}
              >
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.accent,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: `${colors.accent}22`,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <LiIcon name="user-4" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold">{privateBlock.title}</AppText>
                    <AppText variant="caption" secondary numberOfLines={1}>
                      {privateBlock.description}
                    </AppText>
                  </View>
                  <LiIcon name="arrow-right" size={16} color={colors.accent} />
                </View>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
