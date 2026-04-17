import React, { useCallback } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { ErrorView } from '@/shared/components/ErrorView';
import { Skeleton, SkeletonRow, SkeletonStatRow } from '@/shared/components/Skeleton';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { PageTopBar } from '@/shared/components/PageTopBar';

import { useAuthStore } from '@/store/authStore';
import { resultsService } from '@/api/services/results.service';
import type { ResultsSummary } from '@/api/types';
import { colors } from '@/theme';

function useResultsSummary() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['results', 'summary'],
    queryFn: () => resultsService.getSummary(),
    enabled: isAuthenticated,
    retry: false,
  });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 bg-brand-surface border border-brand-border rounded-brand-lg p-4 items-center">
      <AppText variant="title" weight="bold" accent>
        {value}
      </AppText>
      <AppText variant="caption" secondary className="mt-1 text-center">
        {label}
      </AppText>
    </View>
  );
}

// ─── Empty / unauthenticated state ────────────────────────────────────────────

function EmptyResultsState() {
  const { t } = useTranslation('tabs');
  return (
    <View className="flex-1 items-center justify-center px-8 gap-6 py-20">
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(59,191,173,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(59,191,173,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LiIcon name="trend-up-1" size={30} color={colors.accent} />
      </View>
      <AppText secondary className="text-center leading-relaxed">
        {t('results_empty_hint')}
      </AppText>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ResultsScreen() {
  const { t } = useTranslation('tabs');
  const { isAuthenticated } = useAuthStore();
  const query = useResultsSummary();

  const handleRefresh = useCallback(() => query.refetch(), [query]);

  const summary = query.data as ResultsSummary | undefined;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />

      {/* Inline page header — stays visible during loading/error/empty */}
      <PageTopBar title={t('results_title')} />

      {/* Body */}
      {!isAuthenticated ? (
        <EmptyResultsState />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 16, paddingTop: 4 }}>
          <SkeletonStatRow />
          <Skeleton width="40%" height={18} />
          <View style={{ gap: 10 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonRow key={i} badge />
            ))}
          </View>
          <Skeleton width="40%" height={18} />
          <View style={{ gap: 10 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height={64} />
            ))}
          </View>
        </View>
      ) : query.isError ? (
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={handleRefresh}
        />
      ) : !summary ? (
        <EmptyResultsState />
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
          {/* Overall stats */}
          <View className="flex-row gap-3 px-5 pt-2 mb-6">
            <StatCard value={summary.overall.totalRuns} label={t('results_total_runs')} />
            <StatCard value={summary.overall.currentStreakDays} label={t('results_streak')} />
          </View>

          {/* Achievements */}
          <View className="px-5 mb-6">
            <AppText variant="heading" weight="semibold" className="mb-3">
              {t('results_achievements')}
            </AppText>
            {summary.achievements.length === 0 ? (
              <View className="bg-brand-surface border border-brand-border rounded-brand-lg p-5 items-center">
                <AppText secondary className="text-center">
                  {t('results_no_achievements')}
                </AppText>
              </View>
            ) : (
              <View className="gap-2">
                {summary.achievements.map((a, i) => (
                  <View
                    key={i}
                    className="flex-row items-center gap-3 bg-brand-surface border border-brand-border rounded-brand-lg p-4"
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(59,191,173,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LiIcon name="trend-up-1" size={18} color={colors.accent} />
                    </View>
                    <View className="flex-1">
                      <AppText weight="medium">
                        {a.type.replace(/_/g, ' ')}
                      </AppText>
                      <AppText variant="caption" muted>
                        {new Date(a.unlockedAt).toLocaleDateString()}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Program progress */}
          {summary.programs.length > 0 && (
            <View className="px-5 mb-6">
              <AppText variant="heading" weight="semibold" className="mb-3">
                {t('results_programs')}
              </AppText>
              <View className="gap-2">
                {summary.programs.map((prog) => {
                  const pct =
                    prog.mainTotal > 0
                      ? Math.round((prog.completedMain / prog.mainTotal) * 100)
                      : 0;
                  return (
                    <View
                      key={prog.key}
                      className="bg-brand-surface border border-brand-border rounded-brand-lg p-4"
                    >
                      <View className="flex-row justify-between mb-2">
                        <AppText weight="medium">{prog.title}</AppText>
                        <AppText variant="caption" accent>{pct}%</AppText>
                      </View>
                      <View
                        className="rounded-full overflow-hidden"
                        style={{ height: 4, backgroundColor: colors.border }}
                      >
                        <View
                          style={{
                            width: `${pct}%`,
                            height: 4,
                            backgroundColor: colors.accent,
                            borderRadius: 2,
                          }}
                        />
                      </View>
                      <AppText variant="caption" muted className="mt-1.5">
                        {prog.completedMain}/{prog.mainTotal} sessions
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Private trainings */}
          {summary.privateTrainings.length > 0 && (
            <View className="px-5 mb-6">
              <AppText variant="heading" weight="semibold" className="mb-3">
                {t('results_private')}
              </AppText>
              <View className="gap-2">
                {summary.privateTrainings.map((pt) => (
                  <View
                    key={pt.id}
                    className="flex-row items-center gap-3 bg-brand-surface border border-brand-border rounded-brand-lg p-4"
                  >
                    <View className="flex-1">
                      <AppText weight="medium">{pt.name}</AppText>
                      <AppText variant="caption" muted className="mt-0.5">
                        {pt.runsCount} runs
                        {pt.bestTotalSeconds != null &&
                          ` · Best: ${Math.floor(pt.bestTotalSeconds / 60)}m ${pt.bestTotalSeconds % 60}s`}
                      </AppText>
                    </View>
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
