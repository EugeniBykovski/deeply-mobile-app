import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { LiIcon } from '@/shared/components/LiIcon';
import { colors } from '@/theme';
import { useTrialAnnouncement } from '../hooks/useTrialAnnouncement';

/**
 * Informational, one-time announcement of the 7-day Deeply Pro trial.
 * Purely informational — the OK action only persists an acknowledgement;
 * it never starts a purchase, opens the paywall, or activates a trial.
 *
 * Mount exactly once, at the authenticated app-shell root (not per-tab),
 * so eligibility is evaluated a single time for the whole session.
 */
export function TrialAnnouncementModal() {
  const { t } = useTranslation('trialAnnouncement');
  const { visible, acknowledge } = useTrialAnnouncement();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={acknowledge}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={acknowledge}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            accessible
            accessibilityViewIsModal
            accessibilityLabel={t('title')}
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
              <LiIcon name="crown" size={22} color={colors.warning} />
            </View>

            <AppText
              variant="heading"
              weight="bold"
              accessibilityRole="header"
              style={{ marginBottom: 10, textAlign: 'center' }}
            >
              {t('title')}
            </AppText>

            <AppText secondary style={{ textAlign: 'center', lineHeight: 22, marginBottom: 16 }}>
              {t('description')}
            </AppText>

            <AppText variant="caption" muted style={{ textAlign: 'center', lineHeight: 18, marginBottom: 24 }}>
              {t('disclosure')}
            </AppText>

            <Pressable
              onPress={acknowledge}
              className="active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel={t('cta')}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 48,
                minWidth: 200,
                alignItems: 'center',
              }}
            >
              <AppText weight="semibold" style={{ color: colors.ink, fontSize: 16 }}>
                {t('cta')}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
