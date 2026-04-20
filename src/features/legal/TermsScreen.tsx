import React from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { BackHeader } from '@/shared/components/BackHeader';
import { colors } from '@/theme';

const TERM_SECTIONS = [
  's1', 's2', 's3', 's4', 's5', 's6', 's7',
  's8', 's9', 's10', 's11', 's12', 's13', 's14',
] as const;

export function TermsScreen() {
  const { t } = useTranslation('legal');

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <BackHeader title={t('terms_title')} />

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
          {t('terms_intro')}
        </AppText>

        {/* Table of Contents */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
          }}
        >
          <AppText
            variant="caption"
            weight="semibold"
            muted
            style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}
          >
            {t('toc')}
          </AppText>
          {TERM_SECTIONS.map((key) => (
            <AppText key={key} secondary style={{ lineHeight: 26 }}>
              {t(`terms_${key}_title`)}
            </AppText>
          ))}
        </View>

        {/* Sections */}
        {TERM_SECTIONS.map((key) => (
          <View key={key} style={{ marginBottom: 28 }}>
            <AppText weight="semibold" style={{ marginBottom: 8, fontSize: 15 }}>
              {t(`terms_${key}_title`)}
            </AppText>
            <AppText secondary style={{ lineHeight: 22 }}>
              {t(`terms_${key}_body`)}
            </AppText>
          </View>
        ))}

        {/* Footer */}
        <View style={{ marginTop: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
          <AppText variant="caption" muted style={{ marginBottom: 8 }}>
            {t('copyright')}
          </AppText>
          <Pressable onPress={() => router.push('/legal/privacy' as any)} className="active:opacity-70">
            <AppText variant="caption" style={{ color: colors.accent }}>
              {t('privacy_link')}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
