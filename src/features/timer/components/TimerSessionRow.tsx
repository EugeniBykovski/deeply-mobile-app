import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatTime } from '@/utils/format';
import { colors } from '@/theme';
import { timerService } from '../api/timerService';
import type { TimerSessionListItem } from '@/api/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function TimerSessionRow({ session }: { session: TimerSessionListItem }) {
  const { t } = useTranslation('tabs');
  const [expanded, setExpanded] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['timer', 'session', session.id],
    queryFn: () => timerService.getSession(session.id),
    enabled: expanded,
  });

  const icon = session.mode === 'DIVE' ? 'diver' : 'stopwatch';

  return (
    <Pressable
      onPress={() => setExpanded((e) => !e)}
      className="active:opacity-80"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: `${colors.accent}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LiIcon name={icon} size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" numberOfLines={1}>
            {session.mode === 'DIVE' ? t('timer_mode_dive') : t('timer_mode_breath_hold')}
          </AppText>
          <AppText variant="caption" secondary>
            {formatDate(session.createdAt)} · {t('timer_history_session_attempts', { count: session.attemptCount })}
          </AppText>
        </View>
        {session.bestDurationSeconds != null && (
          <AppText weight="bold" style={{ color: colors.accent }}>
            {formatTime(session.bestDurationSeconds)}
          </AppText>
        )}
        <LiIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkMuted} />
      </View>

      {expanded && (
        <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
          {detailQuery.isLoading && <Skeleton width="100%" height={40} />}
          {detailQuery.isError && (
            <AppText variant="caption" style={{ color: colors.error }}>
              {t('error_connection', { ns: 'common' })}
            </AppText>
          )}
          {detailQuery.data?.attempts.map((attempt) => (
            <View
              key={attempt.id}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <AppText variant="caption" secondary>
                {t('timer_attempt_count', { count: attempt.attemptNumber })}
              </AppText>
              <AppText variant="caption">{formatTime(attempt.durationSeconds)}</AppText>
              {attempt.depthMeters != null && (
                <AppText variant="caption" secondary>
                  {attempt.depthMeters}m
                </AppText>
              )}
              {attempt.recoverySeconds != null && (
                <AppText variant="caption" muted>
                  +{formatTime(attempt.recoverySeconds)}
                </AppText>
              )}
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
