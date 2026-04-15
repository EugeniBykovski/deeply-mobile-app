/**
 * Design tokens — deep ocean palette.
 * Mirror values from tailwind.config.js so JS logic can use the same tokens.
 */
export const colors = {
  // Backgrounds
  bg: '#0B1C1D',
  surface: '#122628',
  card: '#173A35',
  border: '#1F4A43',

  // Brand actions
  primary: '#2A7A6F',
  primaryDim: '#1E5A52',
  accent: '#3BBFAD',

  // Text
  ink: '#F0F4F4',
  inkSecondary: '#A8C4C2',
  inkMuted: '#6B9490',
  inkInverse: '#0B1C1D',

  // Semantic
  success: '#3BBFAD',
  error: '#E05757',
  warning: '#D4915A',

  // Transparency helpers
  overlay: 'rgba(11, 28, 29, 0.85)',
  glassLight: 'rgba(255, 255, 255, 0.05)',
  glassMedium: 'rgba(255, 255, 255, 0.10)',
} as const;

export type ColorKey = keyof typeof colors;
