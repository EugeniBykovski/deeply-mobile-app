import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { i18n } from '@/i18n';

import { ErrorView } from '@/shared/components/ErrorView';
import { Skeleton, SkeletonRow } from '@/shared/components/Skeleton';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { trainService } from '@/api/services/train.service';
import type { TrainingDetail, TrainingStep } from '@/api/types';
import { colors } from '@/theme';

// ─── Step visualization ───────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  INHALE:  '#3BBFAD',
  HOLD:    '#D4915A',
  EXHALE:  '#5A8FBF',
  REST:    '#6B9490',
};

const PHASE_ICONS: Record<string, string> = {
  INHALE:  'water-drop-1',
  HOLD:    'stopwatch',
  EXHALE:  'beat',
  REST:    'moon-half-right-5',
};

function StepsBar({ steps }: { steps: TrainingStep[] }) {
  const totalSeconds = steps.reduce((acc, s) => acc + s.durationSeconds, 0);
  if (totalSeconds === 0) return null;

  return (
    <View style={{ flexDirection: 'row', borderRadius: 6, overflow: 'hidden', height: 12 }}>
      {steps.map((step, idx) => (
        <View
          key={idx}
          style={{
            flex: step.durationSeconds,
            backgroundColor: PHASE_COLORS[step.phase] ?? colors.primary,
          }}
        />
      ))}
    </View>
  );
}

function StepLegend({ steps }: { steps: TrainingStep[] }) {
  const { t } = useTranslation('tabs');
  const phaseLabel: Record<string, string> = {
    INHALE: t('train_phase_inhale'),
    HOLD:   t('train_phase_hold'),
    EXHALE: t('train_phase_exhale'),
    REST:   t('train_phase_rest'),
  };

  // Group by phase to show unique phases with total durations
  const seen = new Set<string>();
  const unique = steps.filter((s) => {
    if (seen.has(s.phase)) return false;
    seen.add(s.phase);
    return true;
  });

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
      {unique.map((s) => (
        <View key={s.phase} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: PHASE_COLORS[s.phase] ?? colors.primary,
            }}
          />
          <AppText variant="caption" secondary>
            {phaseLabel[s.phase] ?? s.phase}
          </AppText>
        </View>
      ))}
    </View>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────

function StepList({ steps }: { steps: TrainingStep[] }) {
  const { t } = useTranslation('tabs');
  const phaseLabel: Record<string, string> = {
    INHALE: t('train_phase_inhale'),
    HOLD:   t('train_phase_hold'),
    EXHALE: t('train_phase_exhale'),
    REST:   t('train_phase_rest'),
  };

  return (
    <View style={{ gap: 8 }}>
      {steps.map((step, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            backgroundColor: colors.surface,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: `${PHASE_COLORS[step.phase] ?? colors.primary}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LiIcon
              name={PHASE_ICONS[step.phase] ?? 'beat'}
              size={14}
              color={PHASE_COLORS[step.phase] ?? colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" weight="medium">
              {phaseLabel[step.phase] ?? step.phase}
            </AppText>
          </View>
          <AppText variant="caption" muted>
            {step.durationSeconds}s
          </AppText>
          <View
            style={{
              width: step.durationSeconds * 2,
              maxWidth: 80,
              height: 4,
              borderRadius: 2,
              backgroundColor: PHASE_COLORS[step.phase] ?? colors.primary,
            }}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

function useTrainingDetail(slug: string) {
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  return useQuery({
    queryKey: ['train', 'detail', slug, lang],
    queryFn: () => trainService.getTraining(slug, { lang }),
    enabled: !!slug,
  });
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: 'center',
        flex: 1,
      }}
    >
      <AppText variant="caption" muted style={{ marginBottom: 2 }}>
        {label}
      </AppText>
      <AppText weight="semibold">{value}</AppText>
    </View>
  );
}

export function TrainingDetailScreen() {
  const { t } = useTranslation('tabs');
  const { trainingSlug, slug: programSlug, autoStart } = useLocalSearchParams<{
    trainingSlug: string;
    slug: string;
    autoStart?: string;
  }>();

  const query = useTrainingDetail(trainingSlug ?? '');
  const training = query.data;
  const didAutoStart = useRef(false);

  function handleStart() {
    if (!training) return;
    router.push({
      pathname: '/train/run',
      params: {
        id: training.id,
        name: training.title ?? training.name ?? 'Training',
        steps: JSON.stringify(training.steps),
        estimatedMinutes: String(training.estimatedMinutes ?? 0),
        slug: trainingSlug ?? '',
        programSlug: programSlug ?? '',
        repeats: String(training.repeats ?? 1),
        saveCO2: training.saveCO2 ? '1' : '0',
      },
    } as any);
  }

  useEffect(() => {
    if (autoStart === '1' && training && !didAutoStart.current) {
      didAutoStart.current = true;
      handleStart();
    }
  }, [training, autoStart]);

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />

      {/* Back header */}
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
        <AppText variant="heading" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
          {training?.title ?? ''}
        </AppText>
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <Skeleton width="70%" height={14} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Skeleton height={60} style={{ flex: 1 }} />
            <Skeleton height={60} style={{ flex: 1 }} />
            <Skeleton height={60} style={{ flex: 1 }} />
          </View>
          <Skeleton width="100%" height={12} />
          <View style={{ gap: 8 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonRow key={i} badge />
            ))}
          </View>
        </View>
      ) : query.isError || !training ? (
        <ErrorView
          fullScreen
          message={t('error_connection', { ns: 'common' })}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          >
            {/* Description */}
            {training.description ? (
              <AppText secondary style={{ lineHeight: 22, marginBottom: 20 }}>
                {training.description}
              </AppText>
            ) : null}

            {/* Summary chips */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              {training.estimatedMinutes != null && (
                <SummaryChip
                  label={t('train_duration', { min: training.estimatedMinutes })}
                  value={`${training.estimatedMinutes} min`}
                />
              )}
              {training.intensityLevel != null && (
                <SummaryChip
                  label={t('train_intensity')}
                  value={`${training.intensityLevel}/10`}
                />
              )}
              {training.pointCount != null && (
                <SummaryChip
                  label="Points"
                  value={`${training.pointCount}`}
                />
              )}
            </View>

            {/* Steps visualization */}
            {training.steps.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <AppText weight="semibold" style={{ marginBottom: 12 }}>
                  Sequence
                </AppText>
                <StepsBar steps={training.steps} />
                <StepLegend steps={training.steps} />
                <View style={{ height: 20 }} />
                <StepList steps={training.steps} />
              </View>
            )}
          </ScrollView>

          {/* Start CTA */}
          {!training.isLocked && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 32,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Pressable
                onPress={handleStart}
                className="active:opacity-80"
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 16 }}>
                  {t('train_start')}
                </AppText>
              </Pressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
