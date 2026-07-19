import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { StatCard } from '@/features/results/components/StatCard';
import { formatTime } from '@/utils/format';
import { colors } from '@/theme';
import { useTimerSession } from './hooks/useTimerSession';
import { AttemptDetailsForm } from './components/AttemptDetailsForm';
import type { TimerMode } from './domain/timerEngine';

const PREP_OPTIONS = [0, 5, 10] as const;

export function TimerSessionScreen() {
  const { t } = useTranslation('tabs');
  const params = useLocalSearchParams<{ mode: TimerMode; restore?: string }>();
  const mode: TimerMode = params.mode === 'DIVE' ? 'DIVE' : 'BREATH_HOLD';

  const [prepSeconds, setPrepSeconds] = useState<number>(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const attemptDurationsRef = useRef<number[]>([]);
  const didRestoreRef = useRef(false);

  const {
    state,
    elapsedMs,
    pendingAttempt,
    confirmPendingAttempt,
    hasRestorable,
    restorableSnapshot,
    start,
    startNextAttempt,
    pause,
    resume,
    stop,
    cancel,
    restoreActive,
  } = useTimerSession({
    onAttemptCaptured: (captured) => {
      attemptDurationsRef.current.push(captured.durationMs);
    },
  });

  useEffect(() => {
    if (didRestoreRef.current) return;
    if (params.restore === '1' && hasRestorable && restorableSnapshot?.mode === mode) {
      didRestoreRef.current = true;
      restoreActive();
    }
  }, [params.restore, hasRestorable, restorableSnapshot, mode, restoreActive]);

  // Auto-advance out of the prep countdown once its time is up.
  useEffect(() => {
    if (state.status === 'preparing' && state.prepSeconds && elapsedMs >= state.prepSeconds * 1000) {
      stop();
    }
  }, [state.status, state.prepSeconds, elapsedMs, stop]);

  const handleClose = useCallback(() => {
    if (state.status === 'idle' || state.status === 'done') {
      router.back();
      return;
    }
    Alert.alert(t('timer_cancel_confirm_title'), t('timer_cancel_confirm_body'), [
      { text: t('continue', { ns: 'common' }), style: 'cancel' },
      {
        text: t('timer_cancel'),
        style: 'destructive',
        onPress: () => {
          cancel();
          router.back();
        },
      },
    ]);
  }, [state.status, cancel, t]);

  const modeLabel = mode === 'BREATH_HOLD' ? t('timer_mode_breath_hold') : t('timer_mode_dive');
  const activeLabel = mode === 'BREATH_HOLD' ? t('timer_status_active_breath_hold') : t('timer_status_active_dive');
  const recoveringLabel =
    mode === 'BREATH_HOLD' ? t('timer_status_recovering_breath_hold') : t('timer_status_recovering_dive');

  function handleConfirmSave(details: Parameters<typeof confirmPendingAttempt>[0]) {
    confirmPendingAttempt(details);
    setConfirmedCount((c) => c + 1);
  }

  function handleConfirmSkip() {
    confirmPendingAttempt();
    setConfirmedCount((c) => c + 1);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <AppText weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
          {modeLabel}
        </AppText>
        <Pressable
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel={t('cancel', { ns: 'common' })}
        >
          <LiIcon name="xmark-circle" size={24} color={colors.inkMuted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {state.status === 'idle' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, width: '100%' }}>
            <AppText secondary style={{ textAlign: 'center' }}>
              {t('timer_tap_to_start')}
            </AppText>

            <View style={{ gap: 8, width: '100%' }}>
              <AppText variant="caption" secondary style={{ textAlign: 'center' }}>
                {t('timer_prep_label')}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PREP_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setPrepSeconds(option)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: prepSeconds === option ? colors.accent : colors.surface,
                      borderWidth: 1,
                      borderColor: prepSeconds === option ? colors.accent : colors.border,
                    }}
                  >
                    <AppText weight="semibold" style={{ color: prepSeconds === option ? colors.inkInverse : colors.ink }}>
                      {option === 0 ? t('timer_prep_skip') : `${option}s`}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => start(mode, { prepSeconds: prepSeconds || undefined })}
              className="active:opacity-80"
              style={{
                width: '100%',
                backgroundColor: colors.accent,
                borderRadius: 20,
                paddingVertical: 22,
                alignItems: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel={t('timer_start')}
            >
              <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 20 }}>
                {t('timer_start')}
              </AppText>
            </Pressable>
          </View>
        )}

        {state.status === 'preparing' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <AppText secondary>{t('timer_prep_label')}</AppText>
            <AppText weight="bold" style={{ fontSize: 64, color: colors.accent }}>
              {Math.max(0, Math.ceil(((state.prepSeconds ?? 0) * 1000 - elapsedMs) / 1000))}
            </AppText>
            <Pressable onPress={stop} className="active:opacity-75" style={{ paddingVertical: 12, paddingHorizontal: 28 }}>
              <AppText weight="semibold" style={{ color: colors.accent }}>
                {t('timer_prep_skip')}
              </AppText>
            </Pressable>
          </View>
        )}

        {state.status === 'active' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%' }}>
            <AppText variant="caption" muted>
              {t('timer_attempt_count', { count: state.attemptIndex + 1 })}
            </AppText>
            <AppText weight="semibold" style={{ color: colors.accent, letterSpacing: 0.5 }}>
              {activeLabel}
            </AppText>
            <AppText weight="bold" style={{ fontSize: 56, color: colors.ink }}>
              {formatTime(Math.floor(elapsedMs / 1000))}
            </AppText>

            <Pressable
              onPress={stop}
              className="active:opacity-80"
              style={{
                width: '100%',
                backgroundColor: colors.accent,
                borderRadius: 20,
                paddingVertical: 24,
                alignItems: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel={t('timer_stop')}
            >
              <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 22 }}>
                {t('timer_stop')}
              </AppText>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable onPress={state.pausedAtMs ? resume : pause} className="active:opacity-70">
                <AppText secondary>{state.pausedAtMs ? t('timer_resume') : t('timer_pause')}</AppText>
              </Pressable>
              <Pressable onPress={handleClose} className="active:opacity-70">
                <AppText style={{ color: colors.error }}>{t('timer_cancel')}</AppText>
              </Pressable>
            </View>
          </View>
        )}

        {state.status === 'recovering' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%', paddingVertical: 24 }}>
            <AppText weight="semibold" style={{ color: colors.warning, letterSpacing: 0.5 }}>
              {recoveringLabel}
            </AppText>
            <AppText weight="bold" style={{ fontSize: 44, color: colors.ink }}>
              {formatTime(Math.floor(elapsedMs / 1000))}
            </AppText>

            {pendingAttempt && (
              <AttemptDetailsForm mode={mode} onSave={handleConfirmSave} onSkip={handleConfirmSkip} />
            )}

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable
                onPress={() => stop()}
                className="active:opacity-75"
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <AppText weight="semibold">{t('timer_finish_session')}</AppText>
              </Pressable>
              <Pressable
                onPress={() => startNextAttempt({ prepSeconds: prepSeconds || undefined })}
                className="active:opacity-80"
                style={{ flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: colors.inkInverse }}>
                  {t('timer_next_attempt')}
                </AppText>
              </Pressable>
            </View>
          </View>
        )}

        {state.status === 'done' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: `${colors.accent}22`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LiIcon name="check-circle-1" size={44} color={colors.accent} />
            </View>
            <AppText variant="heading" weight="bold" style={{ fontSize: 26 }}>
              {t('timer_status_done')}
            </AppText>
            <AppText secondary>{t('timer_history_session_attempts', { count: confirmedCount })}</AppText>

            {attemptDurationsRef.current.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 }}>
                <StatCard
                  value={formatTime(Math.round(Math.max(...attemptDurationsRef.current) / 1000))}
                  label={t('timer_history_summary_best')}
                />
                <StatCard
                  value={formatTime(
                    Math.round(
                      attemptDurationsRef.current.reduce((sum, d) => sum + d, 0) /
                        attemptDurationsRef.current.length /
                        1000,
                    ),
                  )}
                  label={t('timer_history_summary_average')}
                />
                <StatCard
                  value={formatTime(
                    Math.round(attemptDurationsRef.current.reduce((sum, d) => sum + d, 0) / 1000),
                  )}
                  label={t('timer_history_summary_total_time')}
                />
              </View>
            )}

            <Pressable
              onPress={() => router.back()}
              className="active:opacity-80"
              style={{
                marginTop: 12,
                backgroundColor: colors.accent,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 48,
                alignItems: 'center',
              }}
            >
              <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 16 }}>
                {t('done', { ns: 'common' })}
              </AppText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
