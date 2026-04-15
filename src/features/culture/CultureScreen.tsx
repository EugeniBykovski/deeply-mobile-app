import React, { useCallback } from 'react';
import { ScrollView, View, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { LoadingView } from '@/shared/components/LoadingView';
import { ErrorView } from '@/shared/components/ErrorView';
import { EmptyView } from '@/shared/components/EmptyView';
import { AppText } from '@/shared/components/AppText';

import { cultureService } from '@/api/services/culture.service';
import { i18n } from '@/i18n';
import type { CultureSection, CultureArticleListItem } from '@/api/types';
import { colors } from '@/theme';

function useCultureSections() {
  return useQuery({
    queryKey: ['culture', 'sections'],
    queryFn: () => cultureService.getSections(),
  });
}

function useCultureArticles(section?: string) {
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  return useQuery({
    queryKey: ['culture', 'articles', section, lang],
    queryFn: () =>
      cultureService.getArticles({ section, lang, limit: 20 }),
    select: (data) => data.items,
  });
}

export function CultureScreen() {
  const { t } = useTranslation('tabs');
  const sectionsQuery = useCultureSections();
  const articlesQuery = useCultureArticles();

  const handleRefresh = useCallback(() => {
    sectionsQuery.refetch();
    articlesQuery.refetch();
  }, [sectionsQuery, articlesQuery]);

  const isLoading = sectionsQuery.isLoading || articlesQuery.isLoading;
  const isError = sectionsQuery.isError && articlesQuery.isError;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
        <LoadingView fullScreen />
      </SafeAreaView>
    );
  }

  if (isError) {
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

  const sections = sectionsQuery.data ?? [];
  const articles = articlesQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={(sectionsQuery.isFetching || articlesQuery.isFetching) && !isLoading}
            onRefresh={handleRefresh}
            tintColor="#3BBFAD"
            colors={['#3BBFAD']}
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-4">
          <AppText variant="title" weight="bold">{t('culture_title')}</AppText>
        </View>

        {/* Section chips */}
        {sections.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
          >
            {sections.map((sec: CultureSection) => (
              <View
                key={sec.key}
                className="bg-brand-surface border border-brand-border rounded-full px-4 py-2"
              >
                <AppText variant="caption" weight="medium">
                  {sec.title}
                </AppText>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Articles */}
        {articles.length === 0 ? (
          <EmptyView message={t('culture_empty')} />
        ) : (
          <View className="px-5 gap-3">
            {articles.map((article: CultureArticleListItem) => (
              <Pressable
                key={article.id}
                className="active:opacity-75"
              >
                <View className="bg-brand-surface border border-brand-border rounded-brand-lg overflow-hidden">
                  {article.coverImageUrl ? (
                    <Image
                      source={{ uri: article.coverImageUrl }}
                      style={{ width: '100%', height: 160 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{ width: '100%', height: 100 }}
                      className="bg-brand-card items-center justify-center"
                    >
                      <AppText className="text-3xl">🌊</AppText>
                    </View>
                  )}

                  <View className="p-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="bg-brand-border rounded-full px-2.5 py-0.5">
                        <AppText variant="label" muted>
                          {article.section}
                        </AppText>
                      </View>
                      {article.readTimeMinutes != null && (
                        <AppText variant="caption" muted>
                          {t('culture_min_read', { count: article.readTimeMinutes })}
                        </AppText>
                      )}
                    </View>
                    <AppText weight="semibold" numberOfLines={2} className="mb-1">
                      {article.title}
                    </AppText>
                    {article.description && (
                      <AppText variant="caption" secondary numberOfLines={2} className="leading-relaxed">
                        {article.description}
                      </AppText>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
