import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components/AppText';
import { colors } from '@/theme';
import type { AttemptDetails } from '../hooks/useTimerSession';
import type { TimerMode } from '../domain/timerEngine';

const COMFORT_VALUES = [1, 2, 3, 4, 5];

interface AttemptDetailsFormProps {
  mode: TimerMode;
  onSave: (details: AttemptDetails) => void;
  onSkip: () => void;
}

/**
 * All fields here are optional per the brief — Skip always available,
 * never a dead end. Rendered inline (not a blocking modal) so the user can
 * still see the recovery timer counting while filling this in.
 */
export function AttemptDetailsForm({ mode, onSave, onSkip }: AttemptDetailsFormProps) {
  const { t } = useTranslation('tabs');
  const [comfortRating, setComfortRating] = useState<number | null>(null);
  const [contractionsCount, setContractionsCount] = useState(0);
  const [depthMeters, setDepthMeters] = useState('');
  const [diveType, setDiveType] = useState('');
  const [location, setLocation] = useState('');
  const [equalizationNotes, setEqualizationNotes] = useState('');
  const [notes, setNotes] = useState('');

  function handleSave() {
    const details: AttemptDetails = {};
    if (comfortRating != null) details.comfortRating = comfortRating;
    if (mode === 'BREATH_HOLD' && contractionsCount > 0) details.contractionsCount = contractionsCount;
    if (mode === 'DIVE') {
      const depth = parseInt(depthMeters, 10);
      if (!Number.isNaN(depth) && depth > 0) details.depthMeters = depth;
      if (diveType.trim()) details.diveType = diveType.trim();
      if (location.trim()) details.location = location.trim();
      if (equalizationNotes.trim()) details.equalizationNotes = equalizationNotes.trim();
    }
    if (notes.trim()) details.notes = notes.trim();
    onSave(details);
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        gap: 14,
        width: '100%',
      }}
    >
      <AppText weight="semibold">{t('timer_details_title')}</AppText>

      <View style={{ gap: 8 }}>
        <AppText variant="caption" secondary>
          {t('timer_details_comfort')}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {COMFORT_VALUES.map((value) => (
            <Pressable
              key={value}
              onPress={() => setComfortRating(value)}
              accessibilityRole="button"
              accessibilityLabel={String(value)}
              accessibilityState={{ selected: comfortRating === value }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: comfortRating === value ? colors.accent : colors.card,
                borderWidth: 1,
                borderColor: comfortRating === value ? colors.accent : colors.border,
              }}
            >
              <AppText weight="semibold" style={{ color: comfortRating === value ? colors.inkInverse : colors.ink }}>
                {value}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {mode === 'BREATH_HOLD' && (
        <View style={{ gap: 8 }}>
          <AppText variant="caption" secondary>
            {t('timer_details_contractions')} — {t('timer_details_contractions_hint')}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => setContractionsCount((c) => c + 1)}
              accessibilityRole="button"
              accessibilityLabel={t('timer_details_contractions')}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 10,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <AppText weight="semibold">+1</AppText>
            </Pressable>
            <AppText weight="bold" style={{ fontSize: 18 }}>
              {contractionsCount}
            </AppText>
            {contractionsCount > 0 && (
              <Pressable onPress={() => setContractionsCount(0)} hitSlop={8}>
                <AppText variant="caption" style={{ color: colors.accent }}>
                  {t('cancel', { ns: 'common' })}
                </AppText>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {mode === 'DIVE' && (
        <>
          <FormField
            label={t('timer_details_depth')}
            value={depthMeters}
            onChangeText={setDepthMeters}
            keyboardType="number-pad"
          />
          <FormField label={t('timer_details_dive_type')} value={diveType} onChangeText={setDiveType} />
          <FormField label={t('timer_details_location')} value={location} onChangeText={setLocation} />
          <FormField
            label={t('timer_details_equalization_notes')}
            value={equalizationNotes}
            onChangeText={setEqualizationNotes}
          />
        </>
      )}

      <FormField label={t('timer_details_notes')} value={notes} onChangeText={setNotes} multiline />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={onSkip}
          className="active:opacity-75"
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
          }}
        >
          <AppText weight="semibold">{t('timer_details_skip')}</AppText>
        </Pressable>
        <Pressable
          onPress={handleSave}
          className="active:opacity-80"
          style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center' }}
        >
          <AppText weight="semibold" style={{ color: colors.inkInverse }}>
            {t('timer_details_save')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'number-pad';
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="caption" secondary>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={colors.inkMuted}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.ink,
          minHeight: multiline ? 60 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
