import React from 'react';
import { View, useWindowDimensions, type StyleProp, type TextStyle } from 'react-native';
import { AppText } from './AppText';

interface BigDigitTextProps {
  children: React.ReactNode;
  color: string;
  /** Font size used on regular-height iPhones (13/14/15/16, Pro Max). */
  maxFontSize: number;
  /** Font size used on the shortest supported iPhones (SE, mini) below the height threshold. */
  minFontSize: number;
  style?: StyleProp<TextStyle>;
}

const COMPACT_HEIGHT_THRESHOLD = 700;

/**
 * Large numeric display (countdown digits, session timer) that can never be
 * vertically clipped. AppText's default line-height (from its Tailwind
 * variant class) is far smaller than these font sizes, so an explicit
 * lineHeight must always travel with the fontSize override — that mismatch
 * was the root cause of the clipped/invisible digits on real devices.
 */
export function BigDigitText({ children, color, maxFontSize, minFontSize, style }: BigDigitTextProps) {
  const { height } = useWindowDimensions();
  const fontSize = height < COMPACT_HEIGHT_THRESHOLD ? minFontSize : maxFontSize;
  const lineHeight = Math.ceil(fontSize * 1.2);

  return (
    <View style={{ minHeight: lineHeight, alignItems: 'center', justifyContent: 'center' }}>
      <AppText
        weight="bold"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={[{ fontSize, lineHeight, color }, style]}
      >
        {children}
      </AppText>
    </View>
  );
}
