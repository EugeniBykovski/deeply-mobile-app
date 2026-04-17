import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { LiIcon } from './LiIcon';
import { ProfileMenuSheet } from '@/features/profile/ProfileMenuSheet';
import { colors } from '@/theme';

/**
 * Tappable avatar circle that opens the profile/logout sheet.
 *
 * Wrapped in React.memo so it never re-renders when the parent (PageTopBar,
 * screen component) re-renders due to unrelated state changes — this is a key
 * part of preventing tab-switch title jitter.
 *
 * The fixed 34×34 container ensures it always occupies the same layout space
 * regardless of any internal state change.
 */
export const ProfileButton = React.memo(function ProfileButton() {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ width: 34, height: 34, flexShrink: 0 }}>
      <Pressable
        onPress={() => setVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ flex: 1 }}
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
    </View>
  );
});
