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
  /** Multi-select mode — shows checkbox instead of expand chevron */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onDelete?: (item: RecentRunItem) => void;
}

export function RecentRunRow({
  item,
  selectionMode,
  selected,
  onToggleSelect,
  onDelete,
}: RecentRunRowProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = item.completed ? '#3BBFAD' : '#D4915A';
  const iconName    = item.completed ? 'checkmark-circle-fill' : 'clock-fill';
  const typeIcon    = item.type === 'dive' ? 'water-drop-1' : 'stopwatch';
  const duration    = formatSeconds(item.totalSeconds);
  const resumable   = !selectionMode && canContinue(item);

  const date          = new Date(item.startedAt);
  const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const handlePress = () => {
    if (selectionMode) {
      onToggleSelect?.(item.id);
    } else {
      setExpanded((v) => !v);
    }
  };

  return (
    <Pressable onPress={handlePress} className="active:opacity-85">
      <View
        style={{
          backgroundColor: selected ? `${colors.accent}15` : colors.surface,
          borderWidth: 1,
          borderColor: selected
            ? `${colors.accent}50`
            : item.completed
              ? `${statusColor}30`
              : colors.border,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {selectionMode ? (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: selected ? 'rgba(212,90,90,0.18)' : 'rgba(212,90,90,0.08)',
                borderWidth: 1,
                borderColor: selected ? 'rgba(212,90,90,0.6)' : 'rgba(212,90,90,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LiIcon name="trash" size={15} color={selected ? '#D45A5A' : 'rgba(212,90,90,0.5)'} />
            </View>
          ) : (
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
          )}

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
            {!selectionMode && <LiIcon name={iconName} size={18} color={statusColor} />}
            {!selectionMode && (
              <LiIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.inkMuted} />
            )}
          </View>
        </View>

        {!selectionMode && expanded && (
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
              <AppText variant="caption" muted>Status</AppText>
              <AppText variant="caption" style={{ color: statusColor }}>
                {item.completed ? 'Completed' : 'Incomplete'}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {resumable && (
                <Pressable
                  onPress={(e) => { e.stopPropagation(); continueItem(item); }}
                  className="active:opacity-75"
                  style={{
                    flex: 1,
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

              {onDelete && (
                <Pressable
                  onPress={(e) => { e.stopPropagation(); onDelete(item); }}
                  className="active:opacity-75"
                  style={{
                    flex: resumable ? undefined : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(212,90,90,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(212,90,90,0.3)',
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: resumable ? 16 : undefined,
                  }}
                >
                  <LiIcon name="trash" size={13} color="#D45A5A" />
                  {!resumable && (
                    <AppText variant="caption" weight="semibold" style={{ color: '#D45A5A' }}>
                      Delete
                    </AppText>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
