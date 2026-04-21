import React, { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { ErrorView } from '@/shared/components/ErrorView';
import { SkeletonArticleCard } from '@/shared/components/Skeleton';
import { EmptyView } from '@/shared/components/EmptyView';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { PageTopBar } from '@/shared/components/PageTopBar';

import { cultureService } from '@/api/services/culture.service';
import { useLang } from '@/hooks/useLang';
import type { CultureSection, CultureArticleListItem } from '@/api/types';
import { colors } from '@/theme';

// ─── Queries ──────────────────────────────────────────────────────────────────

function useCultureSections() {
  return useQuery({
    queryKey: ['culture', 'sections'],
    queryFn: () => cultureService.getSections(),
  });
}

function useCultureArticles(section?: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ['culture', 'articles', section ?? 'all', lang],
    queryFn: () =>
      cultureService.getArticles({ section: section ?? undefined, lang, limit: 20 }),
    select: (data) => data.items,
    // Keep showing previous section's articles while new ones load so the
    // filter bar never triggers a full skeleton flash on filter tap.
    placeholderData: keepPreviousData,
  });
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-75">
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: active ? colors.accent : colors.surface,
          borderWidth: 1,
          borderColor: active ? colors.accent : colors.border,
        }}
      >
        <AppText
          variant="caption"
          weight={active ? 'semibold' : 'regular'}
          style={{ color: active ? colors.inkInverse : colors.ink }}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: CultureArticleListItem }) {
  const { t } = useTranslation('tabs');

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/culture/[slug]',
          params: { slug: article.slug },
        } as any)
      }
      className="active:opacity-75"
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {article.coverImageUrl ? (
          <Image
            source={{ uri: article.coverImageUrl }}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 160,
              backgroundColor: '#122628',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LiIcon name="books-2" size={40} color={colors.inkMuted} />
          </View>
        )}

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: colors.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <AppText variant="label" muted>{article.section}</AppText>
            </View>
            {article.readTimeMinutes != null && (
              <AppText variant="caption" muted>
                {t('culture_min_read', { count: article.readTimeMinutes })}
              </AppText>
            )}
          </View>

          <AppText weight="semibold" numberOfLines={2} style={{ marginBottom: 4 }}>
            {article.title}
          </AppText>
          {article.description && (
            <AppText variant="caption" secondary numberOfLines={2} style={{ lineHeight: 18 }}>
              {article.description}
            </AppText>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function CultureScreen() {
  const { t } = useTranslation('tabs');
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const sectionsQuery = useCultureSections();
  const articlesQuery = useCultureArticles(activeSection ?? undefined);

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    await Promise.allSettled([sectionsQuery.refetch(), articlesQuery.refetch()]);
    setIsRefreshing(false);
    refreshingRef.current = false;
  }, [sectionsQuery, articlesQuery]);

  const isLoading = sectionsQuery.isLoading || articlesQuery.isLoading;
  const isError = sectionsQuery.isError && articlesQuery.isError;

  const sections: CultureSection[] = sectionsQuery.data ?? [];
  const articles: CultureArticleListItem[] = articlesQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />

      {/* Inline page header */}
      <PageTopBar title={t('culture_title')} />

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 16, paddingTop: 4 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonArticleCard key={i} />
          ))}
        </View>
      ) : isError ? (
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={handleRefresh}
        />
      ) : (
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Articles scroll — padded top so content starts below the floating filter */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            contentContainerStyle={{
              paddingTop: sections.length > 0 ? 52 : 8,
              paddingHorizontal: 20,
              // Ensure the last article can always be scrolled fully above the
              // bottom system UI (home indicator / nav bar). The tab bar takes 60px
              // in the layout flow; insets.bottom covers any remaining system gap.
              paddingBottom: 32 + 60 + insets.bottom,
              gap: 16,
            }}
          >
            {articles.length === 0 ? (
              <EmptyView message={t('culture_empty')} />
            ) : (
              articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            )}
          </ScrollView>

          {/* Floating translucent filter bar — overlays the scroll content */}
          {sections.length > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(11,28,29,0.90)',
                zIndex: 10,
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 8,
                  paddingBottom: 8,
                  gap: 8,
                }}
              >
                <FilterChip
                  label={t('culture_all', { defaultValue: 'All' })}
                  active={activeSection === null}
                  onPress={() => setActiveSection(null)}
                />
                {sections.map((sec) => (
                  <FilterChip
                    key={sec.key}
                    label={sec.title}
                    active={activeSection === sec.key}
                    onPress={() =>
                      setActiveSection((prev) => (prev === sec.key ? null : sec.key))
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
