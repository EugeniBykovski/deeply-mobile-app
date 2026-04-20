import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { LiIcon } from './LiIcon';
import { colors } from '@/theme';

interface LockedSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
  ctaLabel: string;
}

export function LockedSheet({ visible, onClose, title, body, ctaLabel }: LockedSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 28,
              paddingBottom: 44,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: `${colors.warning}22`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <LiIcon name="lock" size={22} color={colors.warning} />
            </View>
            <AppText variant="heading" weight="bold" style={{ marginBottom: 10, textAlign: 'center' }}>
              {title}
            </AppText>
            <AppText secondary style={{ textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              {body}
            </AppText>
            <Pressable
              onPress={onClose}
              className="active:opacity-75"
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
              }}
            >
              <AppText weight="semibold" style={{ color: colors.ink }}>
                {ctaLabel}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
