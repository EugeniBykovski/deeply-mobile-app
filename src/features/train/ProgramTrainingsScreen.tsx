import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { i18n } from '@/i18n';

import { ErrorView } from '@/shared/components/ErrorView';
import { SkeletonRow } from '@/shared/components/Skeleton';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { trainService } from '@/api/services/train.service';
import type { TrainingListItem } from '@/api/types';
import { colors } from '@/theme';

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useProgramTrainings(slug: string) {
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  return useQuery({
    queryKey: ['train', 'program', slug, lang],
    queryFn: () => trainService.getProgramTrainings(slug, { lang }),
    enabled: !!slug,
  });
}

// ─── Lock sheet ───────────────────────────────────────────────────────────────

function LockedSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation('tabs');
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 28,
              paddingBottom: 44,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: `${colors.warning}22`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <LiIcon name="lock" size={22} color={colors.warning} />
            </View>
            <AppText variant="heading" weight="bold" style={{ marginBottom: 10, textAlign: 'center' }}>
              {t('train_locked_title')}
            </AppText>
            <AppText secondary style={{ textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              {t('train_locked_body')}
            </AppText>
            <Pressable
              onPress={onClose}
              className="active:opacity-75"
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
              }}
            >
              <AppText weight="semibold" style={{ color: colors.ink }}>
                {t('train_locked_cta')}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Training card ────────────────────────────────────────────────────────────

function TrainingCard({
  item,
  programSlug,
  onLockedPress,
}: {
  item: TrainingListItem;
  programSlug: string;
  onLockedPress: () => void;
}) {
  const { t } = useTranslation('tabs');

  function handlePress() {
    if (item.isLocked) {
      onLockedPress();
    } else {
      router.push({
        pathname: '/train/[slug]/[trainingSlug]',
        params: { slug: programSlug, trainingSlug: item.slug },
      } as any);
    }
  }

  const statusColor =
    item.lastRunStatus === 'completed'
      ? '#3BBFAD'
      : item.lastRunStatus === 'in_progress'
      ? '#D4915A'
      : null;

  return (
    <Pressable onPress={handlePress} className="active:opacity-75">
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: item.isLocked ? 0.55 : 1,
        }}
      >
        {/* Intensity badge */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: item.isLocked ? colors.border : `${colors.accent}22`,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {item.isLocked ? (
            <LiIcon name="lock" size={16} color={colors.inkMuted} />
          ) : (
            <AppText
              variant="label"
              weight="semibold"
              style={{ color: colors.accent }}
            >
              {item.intensityLevel ?? '—'}
            </AppText>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <AppText weight="medium" numberOfLines={1}>
            {item.title}
          </AppText>
          {item.subtitle ? (
            <AppText variant="caption" secondary numberOfLines={1}>
              {item.subtitle}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            {item.estimatedMinutes != null && (
              <AppText variant="caption" muted>
                {t('train_duration', { min: item.estimatedMinutes })}
              </AppText>
            )}
            {item.isLocked && (
              <AppText variant="caption" style={{ color: colors.warning }}>
                {t('train_locked')}
              </AppText>
            )}
          </View>
        </View>

        {/* Run-status badge — top-right corner */}
        {!item.isLocked && item.lastRunStatus !== null && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: `${statusColor}18`,
              borderRadius: 20,
              padding: 3,
            }}
          >
            <LiIcon
              name={
                item.lastRunStatus === 'completed'
                  ? 'checkmark-circle-fill'
                  : 'clock-fill'
              }
              size={16}
              color={statusColor!}
            />
          </View>
        )}

        {!item.isLocked && item.lastRunStatus === null && (
          <LiIcon name="chevron-right" size={14} color={colors.inkMuted} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ProgramTrainingsScreen() {
  const { t } = useTranslation('tabs');
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [lockedSheetVisible, setLockedSheetVisible] = useState(false);

  const query = useProgramTrainings(slug ?? '');

  const handleRefresh = useCallback(() => query.refetch(), [query]);

  const program = query.data?.program;
  const items = query.data?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
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
        >
          <LiIcon name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" weight="bold" style={{ flex: 1 }}>
          {program ? program.key.charAt(0) + program.key.slice(1).toLowerCase().replace('_', ' ') : ''}
        </AppText>
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <SkeletonRow key={i} badge />
          ))}
        </View>
      ) : query.isError ? (
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={handleRefresh}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: TrainingListItem) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TrainingCard
              item={item}
              programSlug={slug ?? ''}
              onLockedPress={() => setLockedSheetVisible(true)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 16, gap: 6 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {items.filter((i) => i.lastRunStatus === 'completed').length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <LiIcon name="checkmark-circle-fill" size={13} color="#3BBFAD" />
                    <AppText variant="caption" style={{ color: '#3BBFAD' }}>
                      {items.filter((i) => i.lastRunStatus === 'completed').length} done
                    </AppText>
                  </View>
                )}
                {items.filter((i) => i.lastRunStatus === 'in_progress').length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <LiIcon name="clock-fill" size={13} color="#D4915A" />
                    <AppText variant="caption" style={{ color: '#D4915A' }}>
                      {items.filter((i) => i.lastRunStatus === 'in_progress').length} in progress
                    </AppText>
                  </View>
                )}
                <AppText variant="caption" secondary>
                  {items.filter((i) => !i.isLocked).length} free · {items.filter((i) => i.isLocked).length} locked
                </AppText>
              </View>
            </View>
          }
        />
      )}

      <LockedSheet
        visible={lockedSheetVisible}
        onClose={() => setLockedSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
