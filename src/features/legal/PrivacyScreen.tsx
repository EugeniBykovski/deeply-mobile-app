import React from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { BackHeader } from '@/shared/components/BackHeader';
import { colors } from '@/theme';

const PRIVACY_SECTIONS = [
  's1', 's2', 's3', 's4', 's5', 's6',
  's7', 's8', 's9', 's10', 's11', 's12',
] as const;

const TLDR_ITEMS   = ['i1', 'i2', 'i3', 'i4'] as const;
const S2_SUBSECTIONS = ['sub1', 'sub2', 'sub3', 'sub4'] as const;

export function PrivacyScreen() {
  const { t } = useTranslation('legal');

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <BackHeader title={t('privacy_title')} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View style={{ height: 20 }} />

        <AppText variant="caption" muted style={{ marginBottom: 4 }}>
          {t('effective')} {t('effective_date')}
        </AppText>
        <AppText secondary style={{ lineHeight: 22, marginBottom: 24 }}>
          {t('privacy_intro')}
        </AppText>

        {/* TL;DR box */}
        <View
          style={{
            backgroundColor: 'rgba(59,191,173,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(59,191,173,0.2)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
          }}
        >
          <AppText weight="semibold" style={{ color: colors.accent, marginBottom: 12 }}>
            {t('privacy_tldr_label')}
          </AppText>
          {TLDR_ITEMS.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
              <AppText style={{ color: colors.accent, lineHeight: 20 }}>•</AppText>
              <AppText secondary style={{ flex: 1, lineHeight: 20 }}>
                {t(`privacy_tldr_${item}`)}
              </AppText>
            </View>
          ))}
        </View>

        {/* Sections */}
        {PRIVACY_SECTIONS.map((key) => (
          <View key={key} style={{ marginBottom: 28 }}>
            <AppText weight="semibold" style={{ marginBottom: 8, fontSize: 15 }}>
              {t(`privacy_${key}_title`)}
            </AppText>

            {key === 's2' ? (
              <>
                {S2_SUBSECTIONS.map((sub) => (
                  <View key={sub} style={{ marginBottom: 16 }}>
                    <AppText weight="medium" style={{ marginBottom: 6, color: colors.inkMuted }}>
                      {t(`privacy_s2_${sub}_title`)}
                    </AppText>
                    <AppText secondary style={{ lineHeight: 22 }}>
                      {t(`privacy_s2_${sub}_body`)}
                    </AppText>
                  </View>
                ))}
              </>
            ) : (
              <AppText secondary style={{ lineHeight: 22 }}>
                {t(`privacy_${key}_body`)}
              </AppText>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={{ marginTop: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
          <AppText variant="caption" muted style={{ marginBottom: 8 }}>
            {t('copyright')}
          </AppText>
          <Pressable onPress={() => router.push('/legal/terms' as any)} className="active:opacity-70">
            <AppText variant="caption" style={{ color: colors.accent }}>
              {t('terms_link')}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
