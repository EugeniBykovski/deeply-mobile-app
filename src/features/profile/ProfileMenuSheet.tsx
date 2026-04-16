import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

interface ProfileMenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, destructive = false }: MenuItemProps) {
  const iconColor = destructive ? colors.error : colors.ink;
  const textColor = destructive ? colors.error : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-70"
    >
      <View
        className="flex-row items-center gap-4 px-5 py-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <LiIcon name={icon} size={20} color={iconColor} />
        <AppText weight="medium" style={{ color: textColor, flex: 1 }}>
          {label}
        </AppText>
        {!destructive && (
          <LiIcon name="chevron-right" size={16} color={colors.inkMuted} />
        )}
      </View>
    </Pressable>
  );
}

export function ProfileMenuSheet({ visible, onClose }: ProfileMenuSheetProps) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { clearAuth, user, isAuthenticated } = useAuthStore();

  const handleSettings = useCallback(() => {
    onClose();
    router.push('/settings' as any);
  }, [onClose]);

  const handleLogout = useCallback(async () => {
    onClose();
    await clearAuth();
    // hasEverSignedIn is true (persisted) so index.tsx would route here anyway,
    // but going direct avoids the extra redirect hop.
    router.replace('/signin' as any);
  }, [onClose, clearAuth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
        onPress={onClose}
      >
        {/* Sheet — tap inside doesn't dismiss */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 8,
            overflow: 'hidden',
          }}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
              }}
            />
          </View>

          {/* User info row */}
          {isAuthenticated && user?.email && (
            <View
              className="flex-row items-center gap-3 px-5 py-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(59,191,173,0.12)',
                  borderWidth: 1,
                  borderColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LiIcon name="user-4" size={20} color={colors.accent} />
              </View>
              <AppText secondary numberOfLines={1} className="flex-1">
                {user.email}
              </AppText>
            </View>
          )}

          {/* Menu items */}
          <MenuItem
            icon="gear"
            label={t('settings')}
            onPress={handleSettings}
          />
          <MenuItem
            icon="logout"
            label={t('logout')}
            onPress={handleLogout}
            destructive
          />

          {/* Cancel row */}
          <Pressable onPress={onClose} className="active:opacity-60">
            <View className="items-center py-4">
              <AppText secondary>{t('cancel')}</AppText>
            </View>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
