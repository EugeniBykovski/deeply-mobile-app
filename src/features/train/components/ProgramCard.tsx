import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import type { TrainBlock } from '@/api/types';
import { colors } from '@/theme';

const BLOCK_META: Record<string, { icon: string; accent: string }> = {
  BEGINNER:     { icon: 'water-drop-1',      accent: '#2A7A6F' },
  INTERMEDIATE: { icon: 'beat',              accent: '#2E6B8A' },
  PRO:          { icon: 'trend-up-1',        accent: '#5A3D8A' },
  SQUARE:       { icon: 'line-height',       accent: '#4A6A3F' },
  CALMING:      { icon: 'moon-half-right-5', accent: '#3A5F6F' },
  DYNAMIC:      { icon: 'stopwatch',         accent: '#7A5A2F' },
  STATIC:       { icon: 'stethoscope-1',     accent: '#5F3A4A' },
  WARM_UP:      { icon: 'leaf-1',            accent: '#2F6A4A' },
  PRIVATE:      { icon: 'user-4',            accent: '#1F4A43' },
};

interface ProgramCardProps {
  block: TrainBlock;
}

export function ProgramCard({ block }: ProgramCardProps) {
  const { t } = useTranslation('tabs');
  const meta = BLOCK_META[block.key] ?? { icon: 'aimass', accent: colors.primary };
  const isPrivate = block.key === 'PRIVATE';

  function handlePress() {
    if (isPrivate) {
      router.push('/train/private/new' as any);
    } else {
      router.push({ pathname: '/train/[slug]', params: { slug: block.slug } } as any);
    }
  }

  return (
    <Pressable onPress={handlePress} className="active:opacity-75" style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 8,
          minHeight: 140,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${meta.accent}33`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <LiIcon name={meta.icon} size={20} color={meta.accent} />
        </View>

        <AppText weight="semibold" numberOfLines={2} style={{ marginBottom: 6 }}>
          {block.title}
        </AppText>

        {isPrivate ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto' }}>
            <AppText variant="caption" style={{ color: colors.accent }}>
              {t('train_private_new')}
            </AppText>
            <LiIcon name="arrow-right" size={12} color={colors.accent} style={{ marginLeft: 4 }} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="caption" muted>
              {block.freeTrainings} {t('train_free')}
            </AppText>
            {block.premiumTrainings > 0 && (
              <>
                <AppText variant="caption" muted>·</AppText>
                <AppText variant="caption" muted>
                  {block.premiumTrainings} {t('train_premium')}
                </AppText>
              </>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
