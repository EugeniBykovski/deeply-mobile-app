import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { formatSeconds } from '@/utils/format';
import { canContinue, continueItem } from '../utils';
import type { RecentRunItem } from '@/api/types';
import { colors } from '@/theme';

interface RecentRunRowProps {
  item: RecentRunItem;
}

export function RecentRunRow({ item }: RecentRunRowProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = item.completed ? '#3BBFAD' : '#D4915A';
  const iconName    = item.completed ? 'checkmark-circle-fill' : 'clock-fill';
  const typeIcon    = item.type === 'dive' ? 'water-drop-1' : 'stopwatch';
  const duration    = formatSeconds(item.totalSeconds);
  const resumable   = canContinue(item);

  const date          = new Date(item.startedAt);
  const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable onPress={() => setExpanded((v) => !v)} className="active:opacity-85">
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: item.completed ? `${statusColor}30` : colors.border,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: `${statusColor}15`,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LiIcon name={typeIcon} size={17} color={statusColor} />
          </View>

          <View style={{ flex: 1 }}>
            <AppText weight="medium" numberOfLines={1}>
              {item.title}
            </AppText>
            <AppText variant="caption" muted style={{ marginTop: 2 }}>
              {formattedDate} · {formattedTime}
              {duration ? ` · ${duration}` : ''}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LiIcon name={iconName} size={18} color={statusColor} />
            <LiIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.inkMuted} />
          </View>
        </View>

        {expanded && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="caption" muted>Date</AppText>
              <AppText variant="caption">
                {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </AppText>
            </View>

            {item.totalSeconds != null && item.totalSeconds > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="caption" muted>
                  {item.type === 'dive' ? 'Hold time' : 'Duration'}
                </AppText>
                <AppText variant="caption">{formatSeconds(item.totalSeconds)}</AppText>
              </View>
            )}

            {item.type === 'dive' && item.maxDepthMeters != null && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="caption" muted>Max depth</AppText>
                <AppText variant="caption">{item.maxDepthMeters} m</AppText>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="caption" muted>Type</AppText>
              <AppText variant="caption" style={{ textTransform: 'capitalize' }}>{item.type}</AppText>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="caption" muted>Status</AppText>
              <AppText variant="caption" style={{ color: statusColor }}>
                {item.completed ? 'Completed' : 'Incomplete'}
              </AppText>
            </View>

            {resumable && (
              <Pressable
                onPress={(e) => { e.stopPropagation(); continueItem(item); }}
                className="active:opacity-75"
                style={{
                  marginTop: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: `${colors.accent}18`,
                  borderWidth: 1,
                  borderColor: `${colors.accent}40`,
                  borderRadius: 10,
                  paddingVertical: 10,
                }}
              >
                <LiIcon name="play" size={13} color={colors.accent} />
                <AppText variant="caption" weight="semibold" style={{ color: colors.accent }}>
                  Continue
                </AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
