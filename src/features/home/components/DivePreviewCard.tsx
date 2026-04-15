import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import type { DiveTemplateItem } from '@/api/types';

interface DivePreviewCardProps {
  item: DiveTemplateItem;
  onPress?: (item: DiveTemplateItem) => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: 'text-brand-accent',
  MEDIUM: 'text-yellow-400',
  HARD: 'text-orange-400',
  EXPERT: 'text-red-400',
};

export function DivePreviewCard({ item, onPress }: DivePreviewCardProps) {
  const diffColor = DIFFICULTY_COLOR[item.difficulty] ?? 'text-ink-muted';

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="active:opacity-75 mr-3"
      style={{ width: 160 }}
    >
      <View className="bg-brand-surface rounded-brand-lg p-4 border border-brand-border">
        {/* Depth */}
        <AppText variant="title" weight="bold" accent className="mb-0.5">
          {item.maxDepthMeters}m
        </AppText>

        {/* Difficulty */}
        <AppText variant="caption" className={`${diffColor} mb-2`}>
          {item.difficulty}
        </AppText>

        {/* Title */}
        <AppText variant="caption" weight="medium" numberOfLines={2}>
          {item.title}
        </AppText>

        {/* Hold time */}
        {item.targetHoldSeconds != null && (
          <View className="mt-3 pt-3 border-t border-brand-border/50">
            <AppText variant="caption" muted>
              Target hold
            </AppText>
            <AppText variant="caption" weight="semibold" secondary>
              {Math.floor(item.targetHoldSeconds / 60)}m{' '}
              {item.targetHoldSeconds % 60}s
            </AppText>
          </View>
        )}

        {/* Lock badge */}
        {item.isLocked && (
          <View className="absolute top-3 right-3 bg-brand-bg/60 rounded-full w-5 h-5 items-center justify-center">
            <AppText className="text-xs">🔒</AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}
