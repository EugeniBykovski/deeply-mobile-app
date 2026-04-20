import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { AppText } from '@/shared/components/AppText';
import { BackHeader } from '@/shared/components/BackHeader';
import { trainService } from '@/api/services/train.service';
import type { TrainingStep } from '@/api/types';
import { colors } from '@/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSteps(
  inhaleSec: number,
  holdSec: number,
  exhaleSec: number,
  restSec: number,
  pointCount: number,
): TrainingStep[] {
  const cycle: TrainingStep[] = [
    { phase: 'INHALE', durationSeconds: inhaleSec },
    ...(holdSec > 0 ? [{ phase: 'HOLD' as const, durationSeconds: holdSec }] : []),
    { phase: 'EXHALE', durationSeconds: exhaleSec },
    ...(restSec > 0 ? [{ phase: 'REST' as const, durationSeconds: restSec }] : []),
  ];

  const steps: TrainingStep[] = [];
  let cycleIndex = 0;
  while (steps.length < pointCount) {
    const step = cycle[cycleIndex % cycle.length];
    steps.push({ ...step });
    cycleIndex++;
  }
  return steps;
}

function extractErrorMessage(err: unknown): string | null {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const status = axiosErr?.response?.status;
  if (status === 401 || status === 403) return null; // handled by caller
  const msg = axiosErr?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('\n');
  if (typeof msg === 'string') return msg;
  return null;
}

// ─── Number stepper ───────────────────────────────────────────────────────────

function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
    >
      <AppText style={{ flex: 1 }} weight="medium">
        {label}
      </AppText>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        className="active:opacity-60"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText weight="bold">−</AppText>
      </Pressable>
      <AppText weight="semibold" style={{ minWidth: 28, textAlign: 'center', fontSize: 16 }}>
        {value}
      </AppText>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        className="active:opacity-60"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText weight="bold">+</AppText>
      </Pressable>
    </View>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppText weight="medium" style={{ flex: 1 }}>
        {label}
      </AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.ink}
      />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function PrivateTrainingFormScreen() {
  const { t } = useTranslation('tabs');
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [pointCount, setPointCount] = useState(8);
  const [repeats, setRepeats] = useState(1);
  const [inhaleSec, setInhaleSec] = useState(4);
  const [holdSec, setHoldSec] = useState(20);
  const [exhaleSec, setExhaleSec] = useState(8);
  const [restSec, setRestSec] = useState(8);
  const [saveResults, setSaveResults] = useState(true);
  const [saveCO2, setSaveCO2] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('', t('train_private_name'));
      return;
    }

    const steps = buildSteps(inhaleSec, holdSec, exhaleSec, restSec, pointCount);

    setIsSubmitting(true);
    try {
      const result = await trainService.createPrivateTraining({
        name: trimmedName,
        pointCount,
        repeats,
        saveResults,
        saveCO2,
        steps,
      });

      // Invalidate private training list and results so they reflect the new entry
      queryClient.invalidateQueries({ queryKey: ['results'] });

      // Navigate to run screen with the newly created training
      router.replace({
        pathname: '/train/run',
        params: {
          id: result.id,
          name: trimmedName,
          steps: JSON.stringify(steps),
          estimatedMinutes: '0',
          repeats: String(repeats),
          saveCO2: saveCO2 ? '1' : '0',
        },
      } as any);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const status = axiosErr?.response?.status;

      if (status === 400) {
        const detail = extractErrorMessage(err);
        Alert.alert(
          t('error_generic', { ns: 'common' }),
          detail ?? 'Please check your training details and try again.',
        );
      } else {
        Alert.alert(
          t('error_generic', { ns: 'common' }),
          t('error_connection', { ns: 'common' }),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <BackHeader title={t('train_private_new')} bordered={false} />


        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name field */}
          <View>
            <AppText variant="label" muted style={{ marginBottom: 8 }}>
              {t('train_private_name')}
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('train_private_name_placeholder')}
              placeholderTextColor={colors.inkMuted}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: colors.ink,
                fontSize: 16,
              }}
              maxLength={80}
              returnKeyType="done"
            />
          </View>

          {/* Structure section */}
          <AppText variant="label" muted>
            Structure
          </AppText>
          <View style={{ gap: 10 }}>
            <NumberStepper
              label={t('train_private_points')}
              value={pointCount}
              min={4}
              max={32}
              onChange={setPointCount}
            />
            <NumberStepper
              label={t('train_private_repeats')}
              value={repeats}
              min={1}
              max={20}
              onChange={setRepeats}
            />
          </View>

          {/* Phase durations */}
          <AppText variant="label" muted>
            Phase durations (seconds)
          </AppText>
          <View style={{ gap: 10 }}>
            <NumberStepper
              label={t('train_private_inhale')}
              value={inhaleSec}
              min={2}
              max={60}
              onChange={setInhaleSec}
            />
            <NumberStepper
              label={t('train_private_hold')}
              value={holdSec}
              min={0}
              max={120}
              onChange={setHoldSec}
            />
            <NumberStepper
              label={t('train_private_exhale')}
              value={exhaleSec}
              min={2}
              max={60}
              onChange={setExhaleSec}
            />
            <NumberStepper
              label={t('train_private_rest')}
              value={restSec}
              min={0}
              max={60}
              onChange={setRestSec}
            />
          </View>

          {/* Options */}
          <AppText variant="label" muted>
            Options
          </AppText>
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <ToggleRow
              label={t('train_save_results')}
              value={saveResults}
              onChange={setSaveResults}
            />
            <ToggleRow label={t('train_save_co2')} value={saveCO2} onChange={setSaveCO2} last />
          </View>

          {/* Preview */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
            }}
          >
            <AppText variant="caption" muted style={{ marginBottom: 6 }}>
              Preview
            </AppText>
            <AppText secondary>
              {pointCount} steps{repeats > 1 ? ` × ${repeats} repeats` : ''} · {inhaleSec}s
              inhale
              {holdSec > 0 ? ` · ${holdSec}s hold` : ''}
              {` · ${exhaleSec}s exhale`}
              {restSec > 0 ? ` · ${restSec}s rest` : ''}
            </AppText>
          </View>
        </ScrollView>

        {/* Submit */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={handleCreate}
            disabled={isSubmitting}
            className="active:opacity-80"
            style={{
              backgroundColor: isSubmitting ? colors.primaryDim : colors.accent,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.inkInverse} />
            ) : (
              <AppText weight="bold" style={{ color: colors.inkInverse, fontSize: 16 }}>
                {t('train_create')}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
