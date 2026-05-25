import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '@/shared/components/AppText';
import { BUTTON_SIZE, ACCENT_COLOR } from '../diveSession.constants';

interface DiveControlsProps {
  isHolding: boolean;
  isSurfacing: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  onFinish: () => void;
  holdLabel: string;
  releaseLabel: string;
  surfacingLabel: string;
  finishLabel: string;
}

export const DiveControls = memo(function DiveControls({
  isHolding,
  isSurfacing,
  onPressIn,
  onPressOut,
  onFinish,
  holdLabel,
  releaseLabel,
  surfacingLabel,
  finishLabel,
}: DiveControlsProps) {
  const buttonLabel = isHolding ? releaseLabel : isSurfacing ? surfacingLabel : holdLabel;
  const activeColor = isHolding ? ACCENT_COLOR : 'rgba(255,255,255,0.55)';

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Main hold / release button */}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 100,
          borderWidth: 1,
          borderColor: isHolding
            ? 'rgba(59,191,173,0.4)'
            : 'rgba(255,255,255,0.22)',
        }}
      >
        <AppText
          weight="semibold"
          style={{
            color: activeColor,
            fontSize: 11,
            letterSpacing: 0.2,
            textAlign: 'center',
            paddingHorizontal: 8,
          }}
        >
          {buttonLabel}
        </AppText>
      </Pressable>

      {/* Finish button */}
      <Pressable
        onPress={onFinish}
        className="active:opacity-70"
        style={{
          alignSelf: 'stretch',
          paddingVertical: 13,
          borderRadius: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <AppText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          {finishLabel}
        </AppText>
      </Pressable>
    </View>
  );
});
