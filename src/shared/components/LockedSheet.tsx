import React, { useCallback, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { PACKAGE_TYPE } from 'react-native-purchases';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { LiIcon } from './LiIcon';
import { colors } from '@/theme';
import { useEntitlement } from '@/features/entitlement/useEntitlement';
import { usePrimaryOfferingPrice } from '@/features/purchases/usePrimaryOfferingPrice';
import { usePurchases } from '@/features/purchases/usePurchases';

const PERIOD_LABEL_KEY: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.WEEKLY]: 'period_week',
  [PACKAGE_TYPE.MONTHLY]: 'period_month',
  [PACKAGE_TYPE.TWO_MONTH]: 'period_2_months',
  [PACKAGE_TYPE.THREE_MONTH]: 'period_3_months',
  [PACKAGE_TYPE.SIX_MONTH]: 'period_6_months',
  [PACKAGE_TYPE.ANNUAL]: 'period_year',
};

interface LockedSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
}

export function LockedSheet({ visible, onClose, title, body }: LockedSheetProps) {
  const { t } = useTranslation('common');
  const { isTrialActive, trialDaysRemaining } = useEntitlement();
  const price = usePrimaryOfferingPrice();
  const { restorePurchases, isPurchasing } = usePurchases();
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  const handleUnlockPress = useCallback(() => {
    onClose();
    router.push('/paywall' as any);
  }, [onClose]);

  const handleRestorePress = useCallback(async () => {
    const result = await restorePurchases();
    if (result.success) {
      onClose();
      return;
    }
    setRestoreMsg(t('restore_purchases_none_found'));
  }, [restorePurchases, onClose, t]);

  const periodKey = price ? PERIOD_LABEL_KEY[price.packageType] : undefined;

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
            <AppText secondary style={{ textAlign: 'center', lineHeight: 22, marginBottom: 12 }}>
              {body}
            </AppText>

            {isTrialActive && trialDaysRemaining !== null && (
              <AppText
                variant="caption"
                style={{ color: colors.accent, marginBottom: 12, textAlign: 'center' }}
              >
                {t('trial_days_remaining', { count: trialDaysRemaining })}
              </AppText>
            )}

            {price && (
              <AppText secondary style={{ marginBottom: 20, textAlign: 'center' }}>
                {price.priceString}
                {periodKey ? ` ${t(periodKey)}` : ''}
              </AppText>
            )}

            <Pressable
              onPress={handleUnlockPress}
              className="active:opacity-75"
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 40,
                minWidth: 220,
                alignItems: 'center',
              }}
            >
              <AppText weight="semibold" style={{ color: colors.ink }}>
                {t('upgrade_to_pro')}
              </AppText>
            </Pressable>

            <Pressable
              onPress={handleRestorePress}
              disabled={isPurchasing}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginTop: 16, opacity: isPurchasing ? 0.5 : 1 }}
            >
              <AppText variant="caption" style={{ color: colors.accent }}>
                {restoreMsg ?? t('restore_purchases')}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
