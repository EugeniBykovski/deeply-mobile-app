import React from 'react';
import {
  ScrollView,
  View,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { LoadingView } from '@/shared/components/LoadingView';
import { ErrorView } from '@/shared/components/ErrorView';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { cultureService } from '@/api/services/culture.service';
import { i18n } from '@/i18n';
import { colors } from '@/theme';

const PLACEHOLDER_COLOR = '#122628';

function useArticle(slug: string) {
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  return useQuery({
    queryKey: ['culture', 'article', slug, lang],
    queryFn: () => cultureService.getArticle(slug, { lang }),
    enabled: !!slug,
  });
}

export function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation('tabs');
  const query = useArticle(slug ?? '');

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
        <StatusBar style="light" />
        <LoadingView fullScreen />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
        <StatusBar style="light" />
        <View className="flex-row items-center px-4 pt-3 pb-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="active:opacity-60"
          >
            <LiIcon name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={() => query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const article = query.data;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover image */}
        {article.coverImageUrl ? (
          <Image
            source={{ uri: article.coverImageUrl }}
            style={{ width: '100%', height: 240 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 200,
              backgroundColor: PLACEHOLDER_COLOR,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LiIcon name="books-2" size={48} color={colors.inkMuted} />
          </View>
        )}

        {/* Back button — floats over image */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="active:opacity-70"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(11,28,29,0.70)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LiIcon name="arrow-left" size={18} color={colors.ink} />
        </Pressable>

        {/* Content */}
        <View className="px-5 pt-5 pb-10">
          {/* Meta row */}
          <View className="flex-row items-center gap-3 mb-3">
            <View
              style={{
                backgroundColor: colors.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
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

          {/* Title */}
          <AppText variant="title" weight="bold" className="mb-2 leading-tight">
            {article.title}
          </AppText>

          {/* Subtitle */}
          {article.subtitle && (
            <AppText variant="heading" secondary className="mb-4 leading-relaxed">
              {article.subtitle}
            </AppText>
          )}

          {/* Separator */}
          <View
            style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }}
          />

          {/* Description / excerpt */}
          {article.description && (
            <AppText secondary className="leading-relaxed mb-5">
              {article.description}
            </AppText>
          )}

          {/* Full content — rendered as plain text */}
          {article.contentMarkdown ? (
            <AppText className="leading-loose" style={{ lineHeight: 26 }}>
              {article.contentMarkdown
                .replace(/#{1,6}\s+/g, '')     // strip headings
                .replace(/\*\*(.+?)\*\*/g, '$1') // strip bold
                .replace(/\*(.+?)\*/g, '$1')     // strip italic
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip links
                .trim()}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
