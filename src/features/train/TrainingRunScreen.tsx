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
  type SharedValue,
} from 'react-native-reanimated';

import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { trainService } from '@/api/services/train.service';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';
import {
  useTrainingPrefsStore,
  type VisualizationMode,
} from '@/store/trainingPrefsStore';
import { useTrainingSessionStore } from '@/store/trainingSessionStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  INHALE: '#3BBFAD',
  HOLD:   '#D4915A',
  EXHALE: '#5A8FBF',
  REST:   '#6B9490',
};

const PHASE_SCALE_FROM: Record<string, number> = {
  INHALE: 0.55,
  HOLD:   1.0,
  EXHALE: 1.0,
  REST:   0.55,
};
const PHASE_SCALE_TO: Record<string, number> = {
  INHALE: 1.0,
  HOLD:   1.0,
  EXHALE: 0.55,
  REST:   0.55,
};

const CIRCLE_SIZE = Math.min(Dimensions.get('window').width - 80, 220);
const SNAKE_HEIGHT = 200;

type RunState = 'idle' | 'running' | 'paused' | 'done';

function pad(n: number) { return String(n).padStart(2, '0'); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

// ─── Snake path builder ────────────────────────────────────────────────────────
// Generates N waypoints in a boustrophedon (snake/zigzag) layout.
// For N steps we produce N+1 waypoints: ball starts at wp[0],
// advances to wp[1] during step 0, wp[2] during step 1, etc.

function buildSnakePath(
  numPoints: number,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number }[] {
  if (numPoints <= 0) return [];

  const COLS = Math.min(4, numPoints);
  const rows = Math.ceil(numPoints / COLS);
  const padH = 16;
  const padV = 20;
  const colSpacing = COLS > 1 ? (containerWidth - padH * 2) / (COLS - 1) : 0;
  const rowSpacing = rows > 1 ? (containerHeight - padV * 2) / (rows - 1) : 0;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const row = Math.floor(i / COLS);
    const posInRow = i % COLS;
    const col = row % 2 === 0 ? posInRow : COLS - 1 - posInRow;
    pts.push({ x: padH + col * colSpacing, y: padV + row * rowSpacing });
  }
  return pts;
}

// ─── Snake visualization ───────────────────────────────────────────────────────

function SnakeVisualization({
  steps,
  stepIndex,
  timeLeft,
  runState,
  waypoints,
  ballX,
  ballY,
}: {
  steps: TrainingStep[];
  stepIndex: number;
  timeLeft: number;
  runState: RunState;
  waypoints: { x: number; y: number }[];
  ballX: SharedValue<number>;
  ballY: SharedValue<number>;
}) {
  const phaseColor = PHASE_COLORS[steps[stepIndex]?.phase ?? 'REST'] ?? colors.accent;

  // Animate ball along current segment based on elapsed progress within step.
  // On step start (elapsed === 0) we cancel any in-flight animation and snap
  // the ball to the segment's start waypoint so it stays in sync with the
  // line colour change. Within a step we animate smoothly toward the current
  // interpolated position with a 950ms window.
  useEffect(() => {
    if (runState !== 'running' || !steps[stepIndex]) return;

    const total = steps[stepIndex].durationSeconds;
    const elapsed = total - timeLeft;
    const progress = total > 0 ? elapsed / total : 0;

    const from = waypoints[stepIndex]     ?? { x: 0, y: 0 };
    const to   = waypoints[stepIndex + 1] ?? from;

    const targetX = from.x + (to.x - from.x) * progress;
    const targetY = from.y + (to.y - from.y) * progress;

    if (elapsed <= 0) {
      // New step just started — snap ball to segment start so it's always
      // in sync with the line colour switch.
      cancelAnimation(ballX);
      cancelAnimation(ballY);
      ballX.value = targetX;
      ballY.value = targetY;
    } else {
      ballX.value = withTiming(targetX, { duration: 950, easing: Easing.linear });
      ballY.value = withTiming(targetY, { duration: 950, easing: Easing.linear });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, stepIndex, runState]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ballX.value - 12 },
      { translateY: ballY.value - 12 },
    ],
  }));

  return (
    <View
      style={{
        width: '100%',
        height: SNAKE_HEIGHT,
        position: 'relative',
      }}
    >
      {/* Path segments */}
      {waypoints.slice(0, -1).map((from, i) => {
        const to = waypoints[i + 1]!;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 1) return null;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const segColor = PHASE_COLORS[steps[i]?.phase ?? 'REST'] ?? colors.accent;
        const isDone    = i < stepIndex;
        const isCurrent = i === stepIndex;

        return (
          <View
            key={`seg-${i}`}
            style={{
              position: 'absolute',
              left: (from.x + to.x) / 2 - length / 2,
              top:  (from.y + to.y) / 2 - 2,
              width: length,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDone || isCurrent ? segColor : colors.border,
              opacity: isDone ? 0.4 : isCurrent ? 1 : 0.3,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Waypoint dots */}
      {waypoints.map((pt, i) => {
        const ptPhase = steps[i]?.phase ?? steps[i - 1]?.phase ?? 'REST';
        const ptColor = PHASE_COLORS[ptPhase] ?? colors.accent;
        const isPast  = i <= stepIndex;

        return (
          <View
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: pt.x - 5,
              top:  pt.y - 5,
              width:  10,
              height: 10,
              borderRadius: 5,
              backgroundColor: isPast ? ptColor : colors.border,
              opacity: isPast ? 0.65 : 0.35,
            }}
          />
        );
      })}

      {/* Animated ball */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width:  24,
            height: 24,
            borderRadius: 12,
            backgroundColor: phaseColor,
            shadowColor: phaseColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.85,
            shadowRadius: 8,
            elevation: 6,
          },
          ballStyle,
        ]}
      />
    </View>
  );
}

// ─── Mode toggle ───────────────────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: VisualizationMode;
  onChange: (m: VisualizationMode) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 3,
        alignSelf: 'center',
      }}
    >
      {(['timer', 'snake'] as VisualizationMode[]).map((m) => {
        const selected = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            className="active:opacity-75"
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 9,
              backgroundColor: selected ? colors.accent : 'transparent',
            }}
          >
            <AppText
              variant="caption"
              weight={selected ? 'semibold' : 'medium'}
              style={{ color: selected ? colors.inkInverse : colors.inkMuted }}
            >
              {m === 'timer' ? 'Timer' : 'Snake'}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  }>();

  const steps: TrainingStep[] = params.steps ? JSON.parse(params.steps) : [];
  const trainingId    = params.id;
  const trainingName  = params.name ?? 'Training';
  const trainingSlug  = params.slug;
  const programSlug   = params.programSlug;

  const { visualizationMode, setVisualizationMode } = useTrainingPrefsStore();
  const { addRun, setInProgress } = useTrainingSessionStore();

  const [runState,  setRunState]  = useState<RunState>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(steps[0]?.durationSeconds ?? 0);
  const [elapsed,   setElapsed]   = useState(0);

  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef       = useRef(0);
  const isSavingRef      = useRef(false);
  const runIdRef         = useRef<string | null>(null);
  const pendingFinishRef = useRef(false);

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
  // Ball starts at the first snake waypoint
  const ballX = useSharedValue(snakeWaypoints[0]?.x ?? 0);
  const ballY = useSharedValue(snakeWaypoints[0]?.y ?? 0);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: circleOpacity.value,
  }));

  // ─── Timer mode animation ─────────────────────────────────────────────────────

  useEffect(() => {
    if (runState !== 'running' || !currentStep || visualizationMode !== 'timer') return;

    const total   = currentStep.durationSeconds;
    const elapsed = total - timeLeft;
    const progress = total > 0 ? elapsed / total : 0;

    const from = PHASE_SCALE_FROM[currentStep.phase] ?? 0.55;
    const to   = PHASE_SCALE_TO[currentStep.phase]   ?? 0.55;

    breathScale.value = withTiming(from + (to - from) * progress, {
      duration: 950,
      easing: Easing.inOut(Easing.quad),
    });
    circleOpacity.value = withTiming(
      currentStep.phase === 'HOLD' ? 0.28 : 0.18,
      { duration: 400 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, stepIndex, runState, visualizationMode]);

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
    async (completed: boolean) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      // Optimistic local update — immediately visible in Results tab
      if (trainingId) {
        addRun({
          id: `local-${Date.now()}`,
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
          });
        } else if (trainingId) {
          await trainService.saveRun({
            templateId: trainingId,
            completed,
            totalSeconds: elapsedRef.current,
          });
        }
      } catch {
        // Non-fatal — guest users will hit 401 here.
      } finally {
        invalidateCaches();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trainingId, trainingName, queryClient, addRun],
  );

  // ─── Step advance ──────────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setStepIndex((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        stopInterval();
        setRunState('done');
        pendingFinishRef.current = true;
        return prev;
      }
      setTimeLeft(steps[next].durationSeconds);
      return next;
    });
  }, [steps, stopInterval]);

  // Call finishRun outside of a state-updater callback to avoid
  // "update while rendering" errors from the Zustand store update.
  useEffect(() => {
    if (runState === 'done' && pendingFinishRef.current) {
      pendingFinishRef.current = false;
      finishRun(true);
    }
  }, [runState, finishRun]);

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

  function handleResume() {
    setRunState('running');
  }

  function handleStop() {
    stopInterval();
    cancelAnimation(breathScale);
    cancelAnimation(ballX);
    cancelAnimation(ballY);
    finishRun(false);
    router.back();
  }

  function handleDone() {
    router.back();
  }

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const isDone    = runState === 'done';
  const isIdle    = runState === 'idle';
  const isPaused  = runState === 'paused';
  const progress  = steps.length > 0 ? (stepIndex + 1) / steps.length : 0;

  // ─── Render ───────────────────────────────────────────────────────────────────

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

      {/* Overall step progress bar */}
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
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        {isDone ? (
          // ── Done state ──────────────────────────────────────────────────────
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
              {steps.length} {t('train_run_steps_completed')}
            </AppText>
          </View>

        ) : (
          // ── Active / idle state ─────────────────────────────────────────────
          <>
            {/* Mode toggle — only shown in idle state before the session starts */}
            {isIdle && (
              <View style={{ marginBottom: 20 }}>
                <ModeToggle
                  mode={visualizationMode}
                  onChange={setVisualizationMode}
                />
              </View>
            )}

            {/* ── Timer mode ── */}
            {visualizationMode === 'timer' ? (
              <View
                style={{
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                {/* Animated fill */}
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: CIRCLE_SIZE,
                      height: CIRCLE_SIZE,
                      borderRadius: CIRCLE_SIZE / 2,
                      backgroundColor: phaseColor,
                    },
                    animatedCircleStyle,
                  ]}
                />
                {/* Ring */}
                <View
                  style={{
                    position: 'absolute',
                    width: CIRCLE_SIZE,
                    height: CIRCLE_SIZE,
                    borderRadius: CIRCLE_SIZE / 2,
                    borderWidth: 2.5,
                    borderColor: isIdle ? colors.border : phaseColor,
                  }}
                />
                {/* Inner content */}
                {isIdle ? (
                  <AppText
                    variant="caption"
                    muted
                    style={{ textAlign: 'center', paddingHorizontal: 32 }}
                  >
                    {t('train_run_tap_to_start')}
                  </AppText>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <AppText
                      weight="bold"
                      style={{ fontSize: 52, color: phaseColor, lineHeight: 56 }}
                    >
                      {formatTime(timeLeft)}
                    </AppText>
                    <AppText
                      weight="semibold"
                      style={{ color: phaseColor, marginTop: 4, letterSpacing: 0.5 }}
                    >
                      {phaseLabel[currentStep?.phase ?? ''] ?? currentStep?.phase}
                    </AppText>
                  </View>
                )}
              </View>

            ) : (
              // ── Snake mode ──
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
                  <AppText
                    variant="caption"
                    muted
                    style={{ textAlign: 'center', marginTop: 12 }}
                  >
                    {t('train_run_tap_to_start')}
                  </AppText>
                ) : (
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <AppText
                      weight="bold"
                      style={{ fontSize: 42, color: phaseColor, lineHeight: 46 }}
                    >
                      {formatTime(timeLeft)}
                    </AppText>
                    <AppText
                      weight="semibold"
                      style={{ color: phaseColor, marginTop: 2, letterSpacing: 0.5 }}
                    >
                      {phaseLabel[currentStep?.phase ?? ''] ?? currentStep?.phase}
                    </AppText>
                  </View>
                )}
              </View>
            )}

            {/* Step counter + elapsed — only while active */}
            {!isIdle && (
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <AppText variant="caption" muted>
                  {t('train_run_step', {
                    current: stepIndex + 1,
                    total:   steps.length,
                  })}
                </AppText>
                <AppText variant="caption" muted style={{ marginTop: 2 }}>
                  {formatTime(elapsed)}
                </AppText>
              </View>
            )}

            {/* Step dots — only in timer mode (snake path already shows progress) */}
            {visualizationMode === 'timer' && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 5,
                  justifyContent: 'center',
                  maxWidth: 280,
                  marginBottom: 24,
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
                          : idx === stepIndex && runState === 'running'
                          ? phaseColor
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
          // running
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
