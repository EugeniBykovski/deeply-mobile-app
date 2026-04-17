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
import type { TrainBlock } from '@/api/types';
import { colors } from '@/theme';

// ─── Block meta ───────────────────────────────────────────────────────────────

const BLOCK_META: Record<string, { icon: string; accent: string }> = {
  BEGINNER:     { icon: 'water-drop-1',   accent: '#2A7A6F' },
  INTERMEDIATE: { icon: 'beat',           accent: '#2E6B8A' },
  PRO:          { icon: 'trend-up-1',     accent: '#5A3D8A' },
  SQUARE:       { icon: 'line-height',    accent: '#4A6A3F' },
  CALMING:      { icon: 'moon-half-right-5', accent: '#3A5F6F' },
  DYNAMIC:      { icon: 'stopwatch',      accent: '#7A5A2F' },
  STATIC:       { icon: 'stethoscope-1',  accent: '#5F3A4A' },
  WARM_UP:      { icon: 'leaf-1',         accent: '#2F6A4A' },
  PRIVATE:      { icon: 'user-4',         accent: '#1F4A43' },
};

// ─── Program card ─────────────────────────────────────────────────────────────

function ProgramCard({ block }: { block: TrainBlock }) {
  const { t } = useTranslation('tabs');
  const meta = BLOCK_META[block.key] ?? { icon: 'aimass', accent: colors.primary };
  const isPrivate = block.key === 'PRIVATE';

  function handlePress() {
    if (isPrivate) {
      router.push('/train/private/new' as any);
    } else {
      router.push({ pathname: '/train/[slug]', params: { slug: block.slug } } as any);
    }
  }

  return (
    <Pressable onPress={handlePress} className="active:opacity-75" style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
          minHeight: 140,
        }}
      >
        {/* Icon badge */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${meta.accent}33`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <LiIcon name={meta.icon} size={20} color={meta.accent} />
        </View>

        {/* Title */}
        <AppText weight="semibold" numberOfLines={2} style={{ marginBottom: 6 }}>
          {block.title}
        </AppText>

        {/* Footer */}
        {isPrivate ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto' }}>
            <AppText variant="caption" style={{ color: colors.accent }}>
              {t('train_private_new')}
            </AppText>
            <LiIcon name="arrow-right" size={12} color={colors.accent} style={{ marginLeft: 4 }} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="caption" muted>
              {block.freeTrainings} {t('train_free')}
            </AppText>
            {block.premiumTrainings > 0 && (
              <>
                <AppText variant="caption" muted>·</AppText>
                <AppText variant="caption" muted>
                  {block.premiumTrainings} {t('train_premium')}
                </AppText>
              </>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function TrainScreen() {
  const { t } = useTranslation('tabs');
  const query = useTrainBlocks();

  const handleRefresh = useCallback(() => query.refetch(), [query]);

  // Separate preset programs from private block
  const allBlocks = query.data ?? [];
  const programs = allBlocks.filter((b) => b.key !== 'PRIVATE');
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
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={handleRefresh}
        />
      ) : programs.length === 0 ? (
        <EmptyView message={t('train_empty')} />
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item: TrainBlock) => item.key}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24,
          }}
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
                className="active:opacity-75"
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
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: `${colors.accent}22`,
                      alignItems: 'center',
                      justifyContent: 'center',
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
