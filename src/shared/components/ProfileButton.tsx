import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { LiIcon } from './LiIcon';
import { ProfileMenuSheet } from '@/features/profile/ProfileMenuSheet';
import { colors } from '@/theme';

/**
 * Tappable avatar circle that opens the profile/logout sheet.
 * Kept in shared/ so any screen can embed it without importing from (app)/_layout.
 */
export function ProfileButton() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="active:opacity-60"
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LiIcon name="user-4" size={18} color={colors.inkMuted} />
        </View>
      </Pressable>

      <ProfileMenuSheet visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}
