import React, { useCallback } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { LoadingView } from '@/shared/components/LoadingView';
import { ErrorView } from '@/shared/components/ErrorView';
import { AppText } from '@/shared/components/AppText';
import { AppButton } from '@/shared/components/AppButton';

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
  });
}

export function ResultsScreen() {
  const { t } = useTranslation('tabs');
  const { isAuthenticated } = useAuthStore();
  const query = useResultsSummary();

  const handleRefresh = useCallback(() => query.refetch(), [query]);

  // Unauthenticated wall
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
        <StatusBar style="light" />
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <AppText className="text-5xl text-center">🏅</AppText>
          <AppText variant="heading" weight="semibold" className="text-center">
            {t('results_title')}
          </AppText>
          <AppText secondary className="text-center leading-relaxed">
            {t('results_sign_in_prompt')}
          </AppText>
          <AppButton
            label={t('sign_in', { ns: 'auth' })}
            variant="primary"
            size="md"
            onPress={() => {}}
            className="w-full"
          />
        </View>
      </SafeAreaView>
    );
  }

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

  const summary = query.data as ResultsSummary;

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
        <View className="px-5 pt-6 pb-4">
          <AppText variant="title" weight="bold">{t('results_title')}</AppText>
        </View>

        {/* Overall stats */}
        <View className="flex-row gap-3 px-5 mb-6">
          <View className="flex-1 bg-brand-surface border border-brand-border rounded-brand-lg p-4 items-center">
            <AppText variant="title" weight="bold" accent>
              {summary.overall.totalRuns}
            </AppText>
            <AppText variant="caption" secondary className="mt-1 text-center">
              {t('results_total_runs')}
            </AppText>
          </View>
          <View className="flex-1 bg-brand-surface border border-brand-border rounded-brand-lg p-4 items-center">
            <AppText variant="title" weight="bold" accent>
              {summary.overall.currentStreakDays}
            </AppText>
            <AppText variant="caption" secondary className="mt-1 text-center">
              {t('results_streak')}
            </AppText>
          </View>
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
                  <AppText className="text-xl">🏅</AppText>
                  <View className="flex-1">
                    <AppText weight="medium">{a.type.replace(/_/g, ' ')}</AppText>
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
        <View className="px-5 mb-6">
          <AppText variant="heading" weight="semibold" className="mb-3">
            {t('results_programs')}
          </AppText>
          <View className="gap-2">
            {summary.programs.map((prog) => {
              const pct = prog.mainTotal > 0
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
                  {/* Progress bar */}
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
                    {prog.completedMain}/{prog.mainTotal} main sessions
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
