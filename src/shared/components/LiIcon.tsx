/**
 * LiIcon — centralized icon component using LineIcons naming convention.
 *
 * Architecture: all icon names follow the LineIcons identifier scheme.
 * Internally renders via expo-symbols (SF Symbols on iOS).
 * When a proper @lineicons/react-native package is available, swap out
 * only the `sfSymbol` lookup table and the SymbolView call below.
 *
 * TODO(lineicons): install @lineicons/react-native and swap implementation.
 */

import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

// ─── LineIcons name → SF Symbol mapping ───────────────────────────────────────

const SYMBOL_MAP: Record<string, string> = {
  // Tab bar / sections
  'surfboard-2': 'figure.surfing',
  'stopwatch': 'stopwatch',
  'trend-up-1': 'chart.line.uptrend.xyaxis',
  'books-2': 'books.vertical',

  // Goal stage
  'aimass': 'scope',
  'beat': 'waveform.path.ecg',
  'user-4': 'person.fill',
  'stethoscope-1': 'stethoscope',
  'moon-half-right-5': 'moon.fill',

  // Track feelings
  'check-circle-1': 'checkmark.circle.fill',
  'xmark-circle': 'xmark.circle',
  'xmark-circle-fill': 'xmark.circle.fill',

  // Experience level
  'leaf-1': 'leaf.fill',
  'water-drop-1': 'drop.fill',
  'heart': 'heart.fill',
  'line-height': 'arrow.up.and.down',

  // Navigation
  'arrow-left': 'chevron.left',
  'arrow-right': 'chevron.right',
  'chevron-right': 'chevron.right',
  'gear': 'gearshape.fill',
  'logout': 'rectangle.portrait.and.arrow.right',
  'trash': 'trash.fill',
  'globe': 'globe',
  'checkmark': 'checkmark',

  // Training-specific
  'lock': 'lock.fill',
  'lock-open': 'lock.open.fill',
  'play': 'play.fill',
  'pause': 'pause.fill',
  'stop': 'stop.fill',
  'timer': 'timer',
  'flame': 'flame.fill',
  'bolt': 'bolt.fill',

  // Run status badges
  'checkmark-circle-fill': 'checkmark.circle.fill',
  'clock-fill': 'clock.fill',
} as const;

// ─── Emoji fallbacks for names without a direct SF Symbol ─────────────────────

const EMOJI_FALLBACK: Record<string, string> = {
  'surfboard-2': '🏄',
  'aimass': '🎯',
  'beat': '💗',
  'water-drop-1': '💧',
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface LiIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function LiIcon({ name, size = 22, color = '#F0F4F4', style }: LiIconProps) {
  const sfSymbol = SYMBOL_MAP[name];

  if (sfSymbol) {
    return (
      <SymbolView
        name={sfSymbol as any}
        size={size}
        tintColor={color}
        resizeMode="scaleAspectFit"
        style={style}
      />
    );
  }

  // Emoji fallback for any unmapped names
  const emoji = EMOJI_FALLBACK[name] ?? '◆';
  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.75 }}>{emoji}</Text>
    </View>
  );
}
