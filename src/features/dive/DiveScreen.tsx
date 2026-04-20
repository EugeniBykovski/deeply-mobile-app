import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorView } from '@/shared/components/ErrorView';
import { SkeletonRow } from '@/shared/components/Skeleton';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { PageTopBar } from '@/shared/components/PageTopBar';
import { LockedSheet } from '@/shared/components/LockedSheet';
import { useDiveTemplates } from './hooks/useDiveTemplates';
import type { DiveTemplateItem } from '@/api/types';
import { colors } from '@/theme';

// ─── Difficulty helpers ───────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY:   '#3BBFAD',
  MEDIUM: '#D4B95A',
  HARD:   '#D4915A',
};

function difficultyLabel(d: string): string {
  if (d === 'EASY')   return 'Easy';
  if (d === 'MEDIUM') return 'Medium';
  if (d === 'HARD')   return 'Hard';
  return d;
}

function formatHold(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0 && sec > 0) return `${m}m ${sec}s`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

// ─── Dive card ────────────────────────────────────────────────────────────────

function DiveCard({ item, onLockedPress }: { item: DiveTemplateItem; onLockedPress: () => void }) {
  const diffColor = DIFFICULTY_COLOR[item.difficulty] ?? colors.accent;

  function handlePress() {
    if (item.isLocked) {
      onLockedPress();
    } else {
      router.push({ pathname: '/dive/[slug]', params: { slug: item.slug } } as any);
    }
  }

  return (
    <Pressable onPress={handlePress} className="active:opacity-75">
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: item.isLocked ? colors.border : `${diffColor}30`,
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          opacity: item.isLocked ? 0.6 : 1,
        }}
      >
        <View
          style={{
            width: 52, height: 52, borderRadius: 14,
            backgroundColor: item.isLocked ? colors.border : `${diffColor}18`,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {item.isLocked ? (
            <LiIcon name="lock" size={20} color={colors.inkMuted} />
          ) : (
            <>
              <AppText weight="bold" style={{ color: diffColor, fontSize: 16, lineHeight: 20 }}>
                {item.maxDepthMeters}
              </AppText>
              <AppText variant="label" style={{ color: diffColor, opacity: 0.8 }}>m</AppText>
            </>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <AppText weight="semibold" numberOfLines={1}>{item.title}</AppText>
          {item.subtitle ? (
            <AppText variant="caption" secondary numberOfLines={1} style={{ marginTop: 1 }}>
              {item.subtitle}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'center' }}>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: `${diffColor}18` }}>
              <AppText variant="label" style={{ color: diffColor }}>{difficultyLabel(item.difficulty)}</AppText>
            </View>
            {item.targetHoldSeconds != null && (
              <AppText variant="caption" muted>{formatHold(item.targetHoldSeconds)} hold</AppText>
            )}
          </View>
        </View>

        {item.isLocked ? (
          <AppText variant="label" style={{ color: colors.warning }}>Premium</AppText>
        ) : (
          <LiIcon name="chevron-right" size={14} color={colors.inkMuted} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 20 }}>
      <AppText variant="heading" weight="semibold">{title}</AppText>
      <AppText variant="caption" muted>{count}</AppText>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DiveScreen() {
  const { t } = useTranslation('tabs');
  const query = useDiveTemplates();
  const [lockedVisible, setLockedVisible] = useState(false);

  const handleRefresh = useCallback(() => query.refetch(), [query]);
  const items: DiveTemplateItem[] = query.data ?? [];

  const freeItems   = items.filter((i) => !i.isLocked);
  const lockedItems = items.filter((i) => i.isLocked);

  type ListItem =
    | { type: 'section'; key: string; title: string; count: number }
    | { type: 'card'; item: DiveTemplateItem };

  const listData: ListItem[] = [];
  if (freeItems.length > 0) {
    listData.push({ type: 'section', key: 'free-header', title: t('dive_section_free'), count: freeItems.length });
    freeItems.forEach((item) => listData.push({ type: 'card', item }));
  }
  if (lockedItems.length > 0) {
    listData.push({ type: 'section', key: 'premium-header', title: t('dive_section_premium'), count: lockedItems.length });
    lockedItems.forEach((item) => listData.push({ type: 'card', item }));
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />
      <PageTopBar title={t('dive_title')} />

      {query.isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 10, paddingTop: 8 }}>
          {Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} badge />)}
        </View>
      ) : query.isError ? (
        <ErrorView fullScreen message={t('error_connection', { ns: 'common' })} onRetry={handleRefresh} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.type === 'section' ? item.key : item.item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ItemSeparatorComponent={({ leadingItem }) =>
            leadingItem?.type === 'card' ? <View style={{ height: 10 }} /> : null
          }
          renderItem={({ item }) =>
            item.type === 'section' ? (
              <SectionLabel title={item.title} count={item.count} />
            ) : (
              <DiveCard item={item.item} onLockedPress={() => setLockedVisible(true)} />
            )
          }
        />
      )}

      <LockedSheet
        visible={lockedVisible}
        onClose={() => setLockedVisible(false)}
        title={t('dive_locked_title')}
        body={t('dive_locked_body')}
        ctaLabel={t('dive_locked_cta')}
      />
    </SafeAreaView>
  );
}
