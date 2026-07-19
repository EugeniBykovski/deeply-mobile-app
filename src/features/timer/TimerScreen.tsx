import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { PageTopBar } from '@/shared/components/PageTopBar';
import { ProHeaderButton } from '@/shared/components/ProHeaderButton';
import { ProfileButton } from '@/shared/components/ProfileButton';
import { StatCard } from '@/features/results/components/StatCard';
import { formatTime } from '@/utils/format';
import { colors } from '@/theme';
import { useRestorableAttempt } from './persistence/activeAttemptStore';
import { useTimerStats } from './hooks/useTimerStats';
import type { TimerMode } from './domain/timerEngine';

function ModeCard({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: string;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 20,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: `${colors.accent}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LiIcon name={icon} size={22} color={colors.accent} />
      </View>
      <View style={{ gap: 4 }}>
        <AppText variant="heading" weight="bold">
          {title}
        </AppText>
        <AppText variant="caption" secondary style={{ lineHeight: 18 }}>
          {hint}
        </AppText>
      </View>
    </Pressable>
  );
}

export function TimerScreen() {
  const { t } = useTranslation('tabs');
  const restorable = useRestorableAttempt();
  const statsQuery = useTimerStats();

  function startMode(mode: TimerMode) {
    router.push({ pathname: '/timer/session', params: { mode } } as any);
  }

  function resumeRestorable() {
    if (!restorable.snapshot?.mode) return;
    router.push({
      pathname: '/timer/session',
      params: { mode: restorable.snapshot.mode, restore: '1' },
    } as any);
  }

  const breathHoldBest = statsQuery.data?.breathHold?.bestDurationSeconds;
  const diveBest = statsQuery.data?.dive?.bestDurationSeconds;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <StatusBar style="light" />
      <PageTopBar
        title={t('timer_title')}
        rightSlot={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => router.push('/timer/history' as any)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={t('timer_history')}
            >
              <LiIcon name="trend-up-1" size={22} color={colors.inkMuted} />
            </Pressable>
            <ProHeaderButton />
            <ProfileButton />
          </View>
        }
      />

      <View style={{ flex: 1, paddingHorizontal: 20, gap: 16 }}>
        {restorable.hasRestorable && (
          <View
            style={{
              backgroundColor: `${colors.warning}14`,
              borderWidth: 1,
              borderColor: `${colors.warning}40`,
              borderRadius: 16,
              padding: 16,
              gap: 10,
            }}
          >
            <AppText weight="semibold" style={{ color: colors.warning }}>
              {t('timer_restore_title')}
            </AppText>
            <AppText variant="caption" secondary style={{ lineHeight: 18 }}>
              {t('timer_restore_body')}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => restorable.discard()}
                className="active:opacity-75"
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <AppText weight="semibold">{t('timer_restore_discard')}</AppText>
              </Pressable>
              <Pressable
                onPress={resumeRestorable}
                className="active:opacity-80"
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.warning, alignItems: 'center' }}
              >
                <AppText weight="semibold" style={{ color: colors.inkInverse }}>
                  {t('timer_restore_resume')}
                </AppText>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard
            value={breathHoldBest != null ? formatTime(breathHoldBest) : '—'}
            label={t('timer_stats_best') + ' · ' + t('timer_mode_breath_hold')}
          />
          <StatCard
            value={diveBest != null ? formatTime(diveBest) : '—'}
            label={t('timer_stats_best') + ' · ' + t('timer_mode_dive')}
          />
        </View>

        <ModeCard
          icon="stopwatch"
          title={t('timer_mode_breath_hold')}
          hint={t('timer_mode_breath_hold_hint')}
          onPress={() => startMode('BREATH_HOLD')}
        />
        <ModeCard
          icon="diver"
          title={t('timer_mode_dive')}
          hint={t('timer_mode_dive_hint')}
          onPress={() => startMode('DIVE')}
        />
      </View>
    </SafeAreaView>
  );
}
