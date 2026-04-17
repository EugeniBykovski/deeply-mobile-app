import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { trainService } from '@/api/services/train.service';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';

// ─── Phase visuals ────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  INHALE: '#3BBFAD',
  HOLD:   '#D4915A',
  EXHALE: '#5A8FBF',
  REST:   '#6B9490',
};

type RunState = 'idle' | 'running' | 'paused' | 'done';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function TrainingRunScreen() {
  const { t } = useTranslation('tabs');
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    steps: string;
    estimatedMinutes: string;
  }>();

  const steps: TrainingStep[] = params.steps ? JSON.parse(params.steps) : [];
  const trainingId = params.id;
  const trainingName = params.name ?? 'Training';

  const [runState, setRunState] = useState<RunState>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(steps[0]?.durationSeconds ?? 0);
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const isSavingRef = useRef(false);

  const currentStep = steps[stepIndex];
  const phaseColor = PHASE_COLORS[currentStep?.phase ?? 'REST'] ?? colors.accent;

  const phaseLabel: Record<string, string> = {
    INHALE: t('train_phase_inhale'),
    HOLD:   t('train_phase_hold'),
    EXHALE: t('train_phase_exhale'),
    REST:   t('train_phase_rest'),
  };

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const saveRun = useCallback(
    async (completed: boolean) => {
      if (!trainingId || isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        await trainService.saveRun({
          templateId: trainingId,
          completed,
          totalSeconds: elapsedRef.current,
        });

        // Immediately refresh the Results tab — both summary and any
        // program/training-level detail queries that might be cached.
        queryClient.invalidateQueries({ queryKey: ['results'] });
      } catch {
        // Non-fatal: user still sees the done state.
        // Most common reason is the user being a guest (no auth token);
        // silently skipping is correct behaviour in that case.
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trainingId, queryClient],
  );

  const advance = useCallback(() => {
    setStepIndex((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        stopInterval();
        setRunState('done');
        saveRun(true);
        return prev;
      }
      setTimeLeft(steps[next].durationSeconds);
      return next;
    });
  }, [steps, stopInterval, saveRun]);

  useEffect(() => {
    if (runState !== 'running') return;

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed((e) => e + 1);
      setTimeLeft((t) => {
        if (t <= 1) {
          advance();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return stopInterval;
  }, [runState, advance, stopInterval]);

  function handleStart() {
    if (steps.length === 0) return;
    setRunState('running');
  }

  function handlePause() {
    stopInterval();
    setRunState('paused');
  }

  function handleResume() {
    setRunState('running');
  }

  function handleStop() {
    stopInterval();
    saveRun(false);
    router.back();
  }

  function handleDone() {
    router.back();
  }

  const isDone = runState === 'done';
  const isIdle = runState === 'idle';
  const isRunning = runState === 'running';
  const isPaused = runState === 'paused';

  const progress = steps.length > 0 ? (stepIndex + 1) / steps.length : 0;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <AppText weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
          {trainingName}
        </AppText>
        {(isIdle || isPaused) && (
          <Pressable
            onPress={handleStop}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="active:opacity-60"
          >
            <LiIcon name="xmark-circle" size={24} color={colors.inkMuted} />
          </Pressable>
        )}
      </View>

      {/* Step progress bar */}
      {!isDone && (
        <View
          style={{
            height: 3,
            backgroundColor: colors.border,
            marginHorizontal: 20,
            borderRadius: 2,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: phaseColor,
              borderRadius: 2,
            }}
          />
        </View>
      )}

      {/* Main area */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        {isDone ? (
          // ── Done state ──────────────────────────────────────────────
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: `${colors.accent}22`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <LiIcon name="check-circle-1" size={44} color={colors.accent} />
            </View>
            <AppText
              variant="heading"
              weight="bold"
              style={{ marginBottom: 8, fontSize: 28, textAlign: 'center' }}
            >
              {t('train_run_done')}
            </AppText>
            <AppText secondary style={{ marginBottom: 4 }}>
              {formatTime(elapsed)}
            </AppText>
            <AppText variant="caption" muted>
              {steps.length} steps completed
            </AppText>
          </View>
        ) : (
          // ── Active / idle state ──────────────────────────────────────
          <>
            {/* Phase ring */}
            <View
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                borderWidth: 6,
                borderColor: isIdle ? colors.border : phaseColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              {isIdle ? (
                <AppText variant="caption" muted style={{ textAlign: 'center', paddingHorizontal: 20 }}>
                  {t('train_run_tap_to_start')}
                </AppText>
              ) : (
                <>
                  <AppText
                    weight="bold"
                    style={{ fontSize: 52, color: phaseColor, lineHeight: 56 }}
                  >
                    {formatTime(timeLeft)}
                  </AppText>
                  <AppText weight="semibold" style={{ color: phaseColor, marginTop: 4 }}>
                    {phaseLabel[currentStep?.phase ?? ''] ?? currentStep?.phase}
                  </AppText>
                </>
              )}
            </View>

            {/* Step counter */}
            {!isIdle && (
              <AppText variant="caption" muted style={{ marginBottom: 16 }}>
                {t('train_run_step', { current: stepIndex + 1, total: steps.length })}
              </AppText>
            )}

            {/* Step dots */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'center',
                maxWidth: 280,
                marginBottom: 32,
              }}
            >
              {steps.map((s, idx) => (
                <View
                  key={idx}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      idx < stepIndex
                        ? PHASE_COLORS[s.phase] ?? colors.accent
                        : idx === stepIndex
                        ? phaseColor
                        : colors.border,
                  }}
                />
              ))}
            </View>
          </>
        )}
      </View>

      {/* Controls */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          paddingTop: 8,
          flexDirection: 'row',
          gap: 16,
          justifyContent: 'center',
        }}
      >
        {isDone ? (
          <Pressable
            onPress={handleDone}
            className="active:opacity-80"
            style={{
              flex: 1,
              backgroundColor: colors.accent,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
            }}
          >
            <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 16 }}>
              {t('done', { ns: 'common' })}
            </AppText>
          </Pressable>
        ) : isIdle ? (
          <Pressable
            onPress={handleStart}
            className="active:opacity-80"
            style={{
              flex: 1,
              backgroundColor: colors.accent,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
            }}
          >
            <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 16 }}>
              {t('train_run_start')}
            </AppText>
          </Pressable>
        ) : isPaused ? (
          <>
            <Pressable
              onPress={handleStop}
              className="active:opacity-75"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
              }}
            >
              <AppText weight="semibold">{t('train_run_stop')}</AppText>
            </Pressable>
            <Pressable
              onPress={handleResume}
              className="active:opacity-80"
              style={{
                flex: 2,
                backgroundColor: colors.accent,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
              }}
            >
              <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 16 }}>
                {t('train_run_resume')}
              </AppText>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={handlePause}
              className="active:opacity-75"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
              }}
            >
              <AppText weight="semibold">{t('train_run_pause')}</AppText>
            </Pressable>
            <Pressable
              onPress={handleStop}
              className="active:opacity-75"
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: `${colors.error}66`,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
              }}
            >
              <AppText weight="semibold" style={{ color: colors.error }}>
                {t('train_run_stop')}
              </AppText>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
