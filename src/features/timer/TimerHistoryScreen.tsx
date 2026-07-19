import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { ErrorView } from '@/shared/components/ErrorView';
import { Skeleton, SkeletonRow } from '@/shared/components/Skeleton';
import { StatCard } from '@/features/results/components/StatCard';
import { formatTime } from '@/utils/format';
import { colors } from '@/theme';
import { timerService } from './api/timerService';
import { useTimerStats } from './hooks/useTimerStats';
import { TimerSessionRow } from './components/TimerSessionRow';
import type { TimerMode } from './domain/timerEngine';

type ModeFilter = TimerMode | 'ALL';

export function TimerHistoryScreen() {
  const { t } = useTranslation('tabs');
  const [filter, setFilter] = useState<ModeFilter>('ALL');
  const statsQuery = useTimerStats();

  const sessionsQuery = useInfiniteQuery({
    queryKey: ['timer', 'sessions', filter],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      timerService.listSessions({ mode: filter === 'ALL' ? undefined : filter, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const sessions = sessionsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const isLoading = sessionsQuery.isLoading;
  const isError = sessionsQuery.isError;
  const isEmpty = !isLoading && !isError && sessions.length === 0;

  const activeStats = filter === 'DIVE' ? statsQuery.data?.dive : filter === 'BREATH_HOLD' ? statsQuery.data?.breathHold : null;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="active:opacity-60"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('back', { ns: 'common' })}
        >
          <LiIcon name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
          {t('timer_history_title')}
        </AppText>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 16, flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['ALL', 'BREATH_HOLD', 'DIVE'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setFilter(option)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: filter === option ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: filter === option ? colors.accent : colors.border,
              }}
            >
              <AppText
                variant="caption"
                weight="semibold"
                style={{ color: filter === option ? colors.inkInverse : colors.ink }}
              >
                {option === 'ALL'
                  ? t('timer_history_filter_all')
                  : option === 'DIVE'
                    ? t('timer_history_filter_dive')
                    : t('timer_history_filter_breath_hold')}
              </AppText>
            </Pressable>
          ))}
        </View>

        {activeStats && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard value={formatTime(activeStats.bestDurationSeconds)} label={t('timer_history_summary_best')} />
            <StatCard
              value={formatTime(activeStats.averageDurationSeconds)}
              label={t('timer_history_summary_average')}
            />
            <StatCard value={activeStats.attemptCount} label={t('timer_history_summary_attempts')} />
          </View>
        )}

        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton width="100%" height={70} />
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonRow key={i} badge />
            ))}
          </View>
        ) : isError ? (
          <ErrorView
            fullScreen
            message={t('error_connection', { ns: 'common' })}
            onRetry={() => sessionsQuery.refetch()}
          />
        ) : isEmpty ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
              gap: 16,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: `${colors.accent}12`,
                borderWidth: 1,
                borderColor: `${colors.accent}30`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LiIcon name="stopwatch" size={30} color={colors.accent} />
            </View>
            <AppText secondary style={{ textAlign: 'center', lineHeight: 22 }}>
              {t('timer_history_empty')}
            </AppText>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TimerSessionRow session={item} />}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 24 }}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (sessionsQuery.hasNextPage && !sessionsQuery.isFetchingNextPage) {
                sessionsQuery.fetchNextPage();
              }
            }}
            ListFooterComponent={
              sessionsQuery.isFetchingNextPage ? (
                <View style={{ paddingVertical: 16 }}>
                  <Skeleton width="100%" height={60} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
