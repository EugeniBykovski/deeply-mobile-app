import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import type { TrainBlock } from '@/api/types';

interface TrainBlockCardProps {
  block: TrainBlock;
  onPress?: (block: TrainBlock) => void;
}

// Label maps matching backend constants
const BLOCK_LABELS: Record<string, { emoji: string; color: string }> = {
  BEGINNER: { emoji: '🌊', color: 'bg-teal-900/60' },
  INTERMEDIATE: { emoji: '🤿', color: 'bg-cyan-900/60' },
  PRO: { emoji: '🏆', color: 'bg-blue-900/60' },
  SQUARE: { emoji: '⬜', color: 'bg-indigo-900/60' },
  CALMING: { emoji: '🌿', color: 'bg-green-900/60' },
};

export function TrainBlockCard({ block, onPress }: TrainBlockCardProps) {
  const meta = BLOCK_LABELS[block.key] ?? { emoji: '🎯', color: 'bg-brand-card' };

  return (
    <Pressable
      onPress={() => onPress?.(block)}
      className="active:opacity-75 mr-3"
      style={{ width: 200 }}
    >
      <View className={`${meta.color} rounded-brand-lg p-4 border border-brand-border`}>
        {/* Icon row */}
        <View className="flex-row items-center justify-between mb-3">
          <AppText className="text-2xl">{meta.emoji}</AppText>
          <View className="bg-brand-bg/40 rounded-full px-2 py-0.5">
            <AppText variant="label" muted>
              {block.freeTrainings} free
            </AppText>
          </View>
        </View>

        {/* Title */}
        <AppText variant="body" weight="semibold" className="mb-1">
          {block.title}
        </AppText>

        {/* Description */}
        <AppText
          variant="caption"
          secondary
          numberOfLines={2}
          className="leading-relaxed"
        >
          {block.description}
        </AppText>

        {/* Footer */}
        <View className="flex-row items-center mt-3 pt-3 border-t border-brand-border/50">
          <AppText variant="caption" muted>
            {block.totalTrainings} sessions
          </AppText>
          {block.premiumTrainings > 0 && (
            <AppText variant="caption" muted className="ml-auto">
              {block.premiumTrainings} premium
            </AppText>
          )}
        </View>
      </View>
    </Pressable>
  );
}
