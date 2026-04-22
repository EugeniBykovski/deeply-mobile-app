import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { trainService } from '@/api/services/train.service';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';
import { PHASE_COLORS, PHASE_SCALE_FROM, PHASE_SCALE_TO } from '@/constants/phase';
import { formatTime } from '@/utils/format';
import { buildSnakePath } from '@/utils/snakePath';
import { useTrainingPrefsStore } from '@/store/trainingPrefsStore';
import { useTrainingSessionStore } from '@/store/trainingSessionStore';
import { SnakeVisualization, SNAKE_HEIGHT } from './components/SnakeVisualization';
import { ModeToggle } from './components/ModeToggle';
import { Co2RatingPicker } from './components/Co2RatingPicker';

// ─── Constants ────────────────────────────────────────────────────────────────

const CIRCLE_SIZE = Math.min(Dimensions.get('window').width - 80, 220);

type RunState = 'idle' | 'running' | 'paused' | 'done';

// ─── Main screen ──────────────────────────────────────────────────────────────

export function TrainingRunScreen() {
  const { t } = useTranslation('tabs');
  const queryClient = useQueryClient();
  const { width: screenWidth } = useWindowDimensions();

  const params = useLocalSearchParams<{
    id: string;
    name: string;
    steps: string;
    estimatedMinutes: string;
    slug: string;
    programSlug: string;
    repeats: string;
    saveCO2: string;
  }>();

  const steps: TrainingStep[] = params.steps ? JSON.parse(params.steps) : [];
  const trainingId   = params.id;
  const trainingName = params.name ?? 'Training';
  const trainingSlug = params.slug;
  const programSlug  = params.programSlug;
  const totalRounds  = Math.max(1, parseInt(params.repeats ?? '1', 10) || 1);
  const trackCO2     = params.saveCO2 === '1';

  const { visualizationMode, setVisualizationMode } = useTrainingPrefsStore();
  const { addRun, setInProgress, updateRunId } = useTrainingSessionStore();

  const [runState,   setRunState]   = useState<RunState>('idle');
  const [stepIndex,  setStepIndex]  = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(steps[0]?.durationSeconds ?? 0);
  const [elapsed,    setElapsed]    = useState(0);
  const [co2Score,   setCo2Score]   = useState<number | null>(null);

  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef       = useRef(0);
  const isSavingRef      = useRef(false);
  const runIdRef         = useRef<string | null>(null);
  const pendingFinishRef = useRef(false);
  const roundIndexRef    = useRef(0);

  const currentStep = steps[stepIndex];
  const phaseColor  = PHASE_COLORS[currentStep?.phase ?? 'REST'] ?? colors.accent;

  const phaseLabel: Record<string, string> = {
    INHALE: t('train_phase_inhale'),
    HOLD:   t('train_phase_hold'),
    EXHALE: t('train_phase_exhale'),
    REST:   t('train_phase_rest'),
  };

  // ─── Snake waypoints ─────────────────────────────────────────────────────────

  const snakeContainerWidth = screenWidth - 48;
  const snakeWaypoints = useMemo(
    () => buildSnakePath(steps.length + 1, snakeContainerWidth, SNAKE_HEIGHT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps.length, snakeContainerWidth],
  );

  // ─── Animated values ─────────────────────────────────────────────────────────

  const breathScale   = useSharedValue(PHASE_SCALE_FROM[steps[0]?.phase ?? 'REST'] ?? 0.55);
  const circleOpacity = useSharedValue(0.18);
  const ballX = useSharedValue(snakeWaypoints[0]?.x ?? 0);
  const ballY = useSharedValue(snakeWaypoints[0]?.y ?? 0);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: circleOpacity.value,
  }));

  // ─── Timer mode animation ─────────────────────────────────────────────────────
  // Mirror timeLeft into a ref so the animation effect can read the current
  // remaining time without having it as a dependency (which would restart
  // withTiming every second, causing 1-second choppiness in production).
  const timerTimeLeftRef = useRef(timeLeft);
  useEffect(() => { timerTimeLeftRef.current = timeLeft; }, [timeLeft]);

  useEffect(() => {
    if (runState === 'paused' || runState === 'idle') {
      cancelAnimation(breathScale);
      return;
    }
    if (runState !== 'running' || !currentStep || visualizationMode !== 'timer') return;

    const total     = currentStep.durationSeconds;
    const remaining = timerTimeLeftRef.current;
    const elapsed   = total - remaining;
    const progress  = total > 0 ? elapsed / total : 0;
    const from      = PHASE_SCALE_FROM[currentStep.phase] ?? 0.55;
    const to        = PHASE_SCALE_TO[currentStep.phase]   ?? 0.55;

    // Snap to the correct mid-step position, then animate to the final target
    // over the FULL remaining duration — one smooth animation per step instead
    // of restarting every second.
    breathScale.value = from + (to - from) * progress;
    breathScale.value = withTiming(to, {
      duration: Math.max(remaining * 1000, 16),
      easing: Easing.inOut(Easing.quad),
    });
    circleOpacity.value = withTiming(
      currentStep.phase === 'HOLD' ? 0.28 : 0.18,
      { duration: 400 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, runState, visualizationMode]);

  // ─── Interval control ─────────────────────────────────────────────────────────

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ─── Cache invalidation ───────────────────────────────────────────────────────

  function invalidateCaches() {
    queryClient.invalidateQueries({ queryKey: ['results'] });
    queryClient.invalidateQueries({ queryKey: ['train', 'program'] });
  }

  // ─── Run persistence ──────────────────────────────────────────────────────────

  const finishRun = useCallback(
    async (completed: boolean, metrics?: Record<string, unknown>) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const localId = `local-${Date.now()}`;
      if (trainingId) {
        addRun({
          id: localId,
          trainingId,
          trainingName,
          trainingSlug,
          programSlug,
          completedAt: new Date().toISOString(),
          totalSeconds: elapsedRef.current,
          completed,
        });
      }

      try {
        if (runIdRef.current) {
          await trainService.updateRun(runIdRef.current, {
            completed,
            totalSeconds: elapsedRef.current > 0 ? elapsedRef.current : undefined,
            ...(metrics ? { metrics } : {}),
          });
          // Sync local ID to the real backend run ID so deletion works
          if (trainingId) updateRunId(localId, runIdRef.current);
        } else if (trainingId) {
          const saved = await trainService.saveRun({ templateId: trainingId, completed, totalSeconds: elapsedRef.current });
          updateRunId(localId, saved.id);
        }
      } catch {
        // Non-fatal — guest users will hit 401 here.
      } finally {
        invalidateCaches();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trainingId, trainingName, queryClient, addRun, updateRunId],
  );

  // ─── Step advance ──────────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setStepIndex((prevStep) => {
      const nextStep = prevStep + 1;
      if (nextStep < steps.length) {
        setTimeLeft(steps[nextStep].durationSeconds);
        return nextStep;
      }

      const nextRound = roundIndexRef.current + 1;
      if (nextRound >= totalRounds) {
        stopInterval();
        setRunState('done');
        pendingFinishRef.current = true;
        return prevStep;
      }

      roundIndexRef.current = nextRound;
      setRoundIndex(nextRound);
      ballX.value = snakeWaypoints[0]?.x ?? 0;
      ballY.value = snakeWaypoints[0]?.y ?? 0;
      setTimeLeft(steps[0].durationSeconds);
      return 0;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, totalRounds, stopInterval]);

  useEffect(() => {
    if (runState === 'done' && pendingFinishRef.current) {
      pendingFinishRef.current = false;
      if (!trackCO2) finishRun(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runState, finishRun]);

  useEffect(() => {
    if (runState !== 'running') return;

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed((e) => e + 1);
      setTimeLeft((t) => {
        if (t <= 1) { advance(); return 0; }
        return t - 1;
      });
    }, 1000);

    return stopInterval;
  }, [runState, advance, stopInterval]);

  // ─── Controls ─────────────────────────────────────────────────────────────────

  async function handleStart() {
    if (steps.length === 0) return;
    setRunState('running');

    if (trainingId) {
      setInProgress(trainingId);
      trainService
        .saveRun({ templateId: trainingId, completed: false })
        .then((r) => {
          runIdRef.current = r.id;
          queryClient.invalidateQueries({ queryKey: ['train', 'program'] });
        })
        .catch(() => {});
    }
  }

  function handlePause() {
    stopInterval();
    cancelAnimation(breathScale);
    cancelAnimation(ballX);
    cancelAnimation(ballY);
    setRunState('paused');
  }

  function handleResume() { setRunState('running'); }

  function handleStop() {
    stopInterval();
    cancelAnimation(breathScale);
    cancelAnimation(ballX);
    cancelAnimation(ballY);
    finishRun(false);
    router.back();
  }

  async function handleDone() {
    if (trackCO2) {
      await finishRun(true, co2Score != null ? { co2Score } : undefined);
    }
    router.back();
  }

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const isDone    = runState === 'done';
  const isIdle    = runState === 'idle';
  const isPaused  = runState === 'paused';
  const progress  = steps.length > 0 ? (stepIndex + 1) / steps.length : 0;
  const showRounds = totalRounds > 1;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
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

      {/* Progress bar */}
      {!isDone && (
        <View style={{ height: 3, backgroundColor: colors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 8 }}>
          <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: phaseColor, borderRadius: 2 }} />
        </View>
      )}

      {/* Main area */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        {isDone ? (
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 80, height: 80, borderRadius: 24,
                backgroundColor: `${colors.accent}22`,
                alignItems: 'center', justifyContent: 'center', marginBottom: 24,
              }}
            >
              <LiIcon name="check-circle-1" size={44} color={colors.accent} />
            </View>
            <AppText variant="heading" weight="bold" style={{ marginBottom: 8, fontSize: 28, textAlign: 'center' }}>
              {t('train_run_done')}
            </AppText>
            <AppText secondary style={{ marginBottom: 4 }}>{formatTime(elapsed)}</AppText>
            <AppText variant="caption" muted>
              {steps.length * totalRounds} {t('train_run_steps_completed')}
            </AppText>

            {trackCO2 && (
              <Co2RatingPicker
                value={co2Score}
                onChange={setCo2Score}
                title={t('train_co2_rating_title')}
                hint={t('train_co2_rating_hint')}
              />
            )}
          </View>

        ) : (
          <>
            {isIdle && (
              <View style={{ marginBottom: 20 }}>
                <ModeToggle mode={visualizationMode} onChange={setVisualizationMode} />
              </View>
            )}

            {visualizationMode === 'timer' ? (
              <View
                style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
              >
                <Animated.View
                  style={[
                    { position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, backgroundColor: phaseColor },
                    animatedCircleStyle,
                  ]}
                />
                <View
                  style={{
                    position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE,
                    borderRadius: CIRCLE_SIZE / 2, borderWidth: 2.5,
                    borderColor: isIdle ? colors.border : phaseColor,
                  }}
                />
                {isIdle ? (
                  <AppText variant="caption" muted style={{ textAlign: 'center', paddingHorizontal: 32 }}>
                    {t('train_run_tap_to_start')}
                  </AppText>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <AppText weight="bold" style={{ fontSize: 52, color: phaseColor, lineHeight: 56 }}>
                      {formatTime(timeLeft)}
                    </AppText>
                    <AppText weight="semibold" style={{ color: phaseColor, marginTop: 4, letterSpacing: 0.5 }}>
                      {phaseLabel[currentStep?.phase ?? ''] ?? currentStep?.phase}
                    </AppText>
                  </View>
                )}
              </View>

            ) : (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <SnakeVisualization
                  steps={steps}
                  stepIndex={stepIndex}
                  timeLeft={timeLeft}
                  runState={runState}
                  waypoints={snakeWaypoints}
                  ballX={ballX}
                  ballY={ballY}
                />
                {isIdle ? (
                  <AppText variant="caption" muted style={{ textAlign: 'center', marginTop: 12 }}>
                    {t('train_run_tap_to_start')}
                  </AppText>
                ) : (
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <AppText weight="bold" style={{ fontSize: 42, color: phaseColor, lineHeight: 46 }}>
                      {formatTime(timeLeft)}
                    </AppText>
                    <AppText weight="semibold" style={{ color: phaseColor, marginTop: 2, letterSpacing: 0.5 }}>
                      {phaseLabel[currentStep?.phase ?? ''] ?? currentStep?.phase}
                    </AppText>
                  </View>
                )}
              </View>
            )}

            {!isIdle && (
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                {showRounds && (
                  <AppText weight="semibold" style={{ color: phaseColor, marginBottom: 2, letterSpacing: 0.3 }}>
                    {t('train_run_round', { current: roundIndex + 1, total: totalRounds })}
                  </AppText>
                )}
                <AppText variant="caption" muted>
                  {t('train_run_step', { current: stepIndex + 1, total: steps.length })}
                </AppText>
                <AppText variant="caption" muted style={{ marginTop: 2 }}>
                  {formatTime(elapsed)}
                </AppText>
              </View>
            )}

            {visualizationMode === 'timer' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', maxWidth: 280, marginBottom: 24 }}>
                {steps.map((s, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor:
                        idx < stepIndex ? PHASE_COLORS[s.phase] ?? colors.accent
                        : idx === stepIndex && runState === 'running' ? phaseColor
                        : colors.border,
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Controls */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8, flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
        {isDone ? (
          <Pressable
            onPress={handleDone}
            disabled={trackCO2 && co2Score === null}
            className="active:opacity-80"
            style={{
              flex: 1,
              backgroundColor: trackCO2 && co2Score === null ? colors.border : colors.accent,
              borderRadius: 16, paddingVertical: 18, alignItems: 'center',
            }}
          >
            <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 16 }}>
              {trackCO2 ? t('train_co2_rating_save') : t('done', { ns: 'common' })}
            </AppText>
          </Pressable>

        ) : isIdle ? (
          <Pressable
            onPress={handleStart}
            className="active:opacity-80"
            style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
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
                flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                borderRadius: 16, paddingVertical: 18, alignItems: 'center',
              }}
            >
              <AppText weight="semibold">{t('train_run_stop')}</AppText>
            </Pressable>
            <Pressable
              onPress={handleResume}
              className="active:opacity-80"
              style={{ flex: 2, backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
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
                flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                borderRadius: 16, paddingVertical: 18, alignItems: 'center',
              }}
            >
              <AppText weight="semibold">{t('train_run_pause')}</AppText>
            </Pressable>
            <Pressable
              onPress={handleStop}
              className="active:opacity-75"
              style={{
                flex: 1, backgroundColor: colors.surface, borderWidth: 1,
                borderColor: `${colors.error}66`, borderRadius: 16, paddingVertical: 18, alignItems: 'center',
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
