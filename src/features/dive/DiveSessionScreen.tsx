import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { diveService } from '@/api/services/dive.service';
import { colors } from '@/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');

// Vertical lane geometry (available height for diver travel, set in layout)
const LANE_HEIGHT = SCREEN_H * 0.52;
const DIVER_SIZE  = 32;
const TAPE_STEPS  = 5; // meter intervals on depth tape

// Background color interpolation: surface (light teal-blue) → abyss (near black)
const SURFACE_COLOR = '#0d2d3a';
const ABYSS_COLOR   = '#030a10';

type SessionState = 'idle' | 'holding' | 'surfacing' | 'done';

function pad(n: number) { return String(n).padStart(2, '0'); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
function formatDepth(d: number) { return `${Math.round(d)} m`; }

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DiveSessionScreen() {
  const { t } = useTranslation('tabs');
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{
    id: string;
    slug: string;
    title: string;
    maxDepthMeters: string;
    targetHoldSeconds: string;
    profilePoints: string;
  }>();

  const templateId        = params.id ?? '';
  const title             = params.title ?? 'Dive';
  const maxDepthMeters    = Number(params.maxDepthMeters ?? 30);
  const targetHoldSeconds = Number(params.targetHoldSeconds ?? 120);

  // ── State ──────────────────────────────────────────────────────────────────

  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [holdSeconds,  setHoldSeconds]  = useState(0);
  const [maxReached,   setMaxReached]   = useState(0);
  const [saving,       setSaving]       = useState(false);

  // Refs for hold timer
  const holdIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalHoldRef      = useRef(0);

  // ── Animated values ────────────────────────────────────────────────────────

  // depthProgress: 0 = surface, 1 = maxDepthMeters
  const depthProgress = useSharedValue(0);

  // Animated background
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      depthProgress.value,
      [0, 1],
      [SURFACE_COLOR, ABYSS_COLOR],
    ),
  }));

  // Diver Y position (0 = top of lane, LANE_HEIGHT - DIVER_SIZE = bottom)
  const diverStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: depthProgress.value * (LANE_HEIGHT - DIVER_SIZE),
      },
    ],
  }));

  const [currentDepthDisplay, setCurrentDepthDisplay] = useState(0);

  // Poll Reanimated SharedValue → React state for the depth readout.
  useEffect(() => {
    if (sessionState === 'idle' || sessionState === 'done') {
      setCurrentDepthDisplay(0);
      return;
    }
    const iv = setInterval(() => {
      const approx = Math.round(depthProgress.value * maxDepthMeters);
      setCurrentDepthDisplay(approx);
      setMaxReached((prev) => Math.max(prev, approx));
    }, 100);
    return () => clearInterval(iv);
  }, [sessionState, maxDepthMeters, depthProgress]);

  // ── Hold timer ─────────────────────────────────────────────────────────────

  function startHoldTimer() {
    if (holdIntervalRef.current) return;
    holdIntervalRef.current = setInterval(() => {
      totalHoldRef.current += 1;
      setHoldSeconds(totalHoldRef.current);
    }, 1000);
  }

  function stopHoldTimer() {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }

  // ── Descent / ascent animations ────────────────────────────────────────────

  function startDescent() {
    const currentProgress = depthProgress.value;
    const remaining = 1 - currentProgress;
    // Speed: full descent takes targetHoldSeconds ms
    const duration = remaining * targetHoldSeconds * 1000;

    depthProgress.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    });
  }

  function startAscent() {
    const currentProgress = depthProgress.value;
    // Ascent is 1.5× faster than descent
    const duration = currentProgress * targetHoldSeconds * 1000 * 0.67;

    depthProgress.value = withTiming(0, {
      duration: Math.max(duration, 500),
      easing: Easing.linear,
    });
  }

  // ── Controls ───────────────────────────────────────────────────────────────

  function handlePressIn() {
    if (sessionState === 'done') return;

    cancelAnimation(depthProgress);
    setSessionState('holding');
    startHoldTimer();
    startDescent();
  }

  function handlePressOut() {
    if (sessionState === 'done') return;

    cancelAnimation(depthProgress);
    stopHoldTimer();
    setSessionState('surfacing');
    startAscent();
  }

  // When ascent animation finishes and depth reaches 0, we detect it via polling
  useEffect(() => {
    if (sessionState !== 'surfacing') return;
    const iv = setInterval(() => {
      if (depthProgress.value <= 0.01) {
        setSessionState('idle');
      }
    }, 200);
    return () => clearInterval(iv);
  }, [sessionState, depthProgress]);

  // ── Finish dive ────────────────────────────────────────────────────────────

  const finishDive = useCallback(async () => {
    stopHoldTimer();
    cancelAnimation(depthProgress);
    setSessionState('done');
    setSaving(true);

    try {
      await diveService.saveRun({
        templateId,
        holdSeconds: totalHoldRef.current,
        completed: totalHoldRef.current > 0,
      });
      queryClient.invalidateQueries({ queryKey: ['results'] });
    } catch {
      // Non-fatal — guest users hit 401
    } finally {
      setSaving(false);
    }
  }, [templateId, depthProgress, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHoldTimer();
      cancelAnimation(depthProgress);
    };
  }, [depthProgress]);

  // ── Depth tape markers ─────────────────────────────────────────────────────

  // Generate meter markers at TAPE_STEPS intervals
  const tapeMarkers: number[] = [];
  for (let m = 0; m <= maxDepthMeters; m += TAPE_STEPS) {
    tapeMarkers.push(m);
  }
  if (tapeMarkers[tapeMarkers.length - 1] !== maxDepthMeters) {
    tapeMarkers.push(maxDepthMeters);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isDone      = sessionState === 'done';
  const isHolding   = sessionState === 'holding';
  const isSurfacing = sessionState === 'surfacing';
  const isIdle      = sessionState === 'idle';

  return (
    <Animated.View style={[{ flex: 1 }, bgStyle]}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* ── Top bar ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          {(isIdle || isDone) && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="active:opacity-60"
              style={{ marginRight: 12 }}
            >
              <LiIcon name="arrow-left" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
          <AppText weight="semibold" style={{ flex: 1, color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>
            {title}
          </AppText>
          {/* Hold timer */}
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('dive_session_hold_time')}
            </AppText>
            <AppText weight="bold" style={{ color: '#fff', fontSize: 18 }}>
              {formatTime(holdSeconds)}
            </AppText>
          </View>
        </View>

        {isDone ? (
          // ── Done state ────────────────────────────────────────────────────
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: 'rgba(59,191,173,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <LiIcon name="check-circle-1" size={44} color="#3BBFAD" />
            </View>
            <AppText
              variant="heading"
              weight="bold"
              style={{ color: '#fff', fontSize: 26, marginBottom: 8, textAlign: 'center' }}
            >
              {t('dive_session_done')}
            </AppText>

            <View style={{ flexDirection: 'row', gap: 16, marginTop: 20, marginBottom: 40 }}>
              <View style={{ alignItems: 'center' }}>
                <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>
                  {t('dive_session_max_depth')}
                </AppText>
                <AppText weight="bold" style={{ color: '#3BBFAD', fontSize: 28 }}>
                  {maxReached}m
                </AppText>
              </View>
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <View style={{ alignItems: 'center' }}>
                <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>
                  {t('dive_session_total_hold')}
                </AppText>
                <AppText weight="bold" style={{ color: '#fff', fontSize: 28 }}>
                  {formatTime(holdSeconds)}
                </AppText>
              </View>
            </View>

            {saving ? (
              <AppText style={{ color: 'rgba(255,255,255,0.5)' }}>{t('dive_session_saving')}</AppText>
            ) : (
              <Pressable
                onPress={() => router.back()}
                className="active:opacity-80"
                style={{
                  backgroundColor: '#3BBFAD',
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 48,
                  alignItems: 'center',
                }}
              >
                <AppText weight="bold" style={{ color: '#fff', fontSize: 16 }}>
                  {t('done', { ns: 'common' })}
                </AppText>
              </Pressable>
            )}
          </View>

        ) : (
          // ── Active dive state ─────────────────────────────────────────────
          <>
            {/* ── Depth display ── */}
            <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
              <AppText weight="bold" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 42, lineHeight: 46 }}>
                {formatDepth(currentDepthDisplay)}
              </AppText>
              <AppText style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                {isHolding ? t('dive_session_release') : isSurfacing ? t('dive_session_surfacing') : t('dive_session_hold')}
              </AppText>
            </View>

            {/* ── Main dive area: tape + diver ── */}
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                paddingHorizontal: 24,
                paddingTop: 8,
              }}
            >
              {/* Depth tape (left side) */}
              <View
                style={{
                  width: 48,
                  height: LANE_HEIGHT,
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingRight: 8,
                }}
              >
                {tapeMarkers.map((m) => (
                  <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View
                      style={{
                        width: 8,
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                      }}
                    />
                    <AppText
                      style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 10,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {m}m
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Vertical lane + diver */}
              <View style={{ flex: 1, position: 'relative' }}>
                {/* Lane rail */}
                <View
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: 2,
                    height: LANE_HEIGHT,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    marginLeft: -1,
                    borderRadius: 1,
                  }}
                />

                {/* Target depth marker */}
                <View
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: LANE_HEIGHT - 2,
                    width: 20,
                    height: 2,
                    marginLeft: -10,
                    backgroundColor: 'rgba(59,191,173,0.6)',
                    borderRadius: 1,
                  }}
                />

                {/* Diver icon */}
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      width: DIVER_SIZE,
                      height: DIVER_SIZE,
                      marginLeft: -(DIVER_SIZE / 2),
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    diverStyle,
                  ]}
                >
                  {/* Glow */}
                  <View
                    style={{
                      position: 'absolute',
                      width: DIVER_SIZE + 16,
                      height: DIVER_SIZE + 16,
                      borderRadius: (DIVER_SIZE + 16) / 2,
                      backgroundColor: isHolding ? 'rgba(59,191,173,0.25)' : 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <LiIcon
                    name="water-drop-1"
                    size={DIVER_SIZE}
                    color={isHolding ? '#3BBFAD' : 'rgba(255,255,255,0.75)'}
                  />
                </Animated.View>
              </View>

              {/* Right spacer */}
              <View style={{ width: 48 }} />
            </View>

            {/* ── Controls ── */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 12 }}>
              {/* Hold button */}
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={({ pressed }) => ({
                  height: 80,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed || isHolding
                    ? '#3BBFAD'
                    : 'rgba(255,255,255,0.1)',
                  borderWidth: 1.5,
                  borderColor: isHolding
                    ? '#3BBFAD'
                    : 'rgba(255,255,255,0.2)',
                })}
              >
                <AppText
                  weight="bold"
                  style={{
                    color: isHolding ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: 16,
                    letterSpacing: 0.5,
                  }}
                >
                  {isHolding
                    ? t('dive_session_release')
                    : isSurfacing
                    ? t('dive_session_surfacing')
                    : t('dive_session_hold')}
                </AppText>
              </Pressable>

              {/* Finish button */}
              <Pressable
                onPress={finishDive}
                className="active:opacity-75"
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
              >
                <AppText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  {t('dive_session_finish')}
                </AppText>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
