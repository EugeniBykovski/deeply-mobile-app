export const PHASE_COLORS: Record<string, string> = {
  INHALE: '#3BBFAD',
  HOLD:   '#D4915A',
  EXHALE: '#5A8FBF',
  REST:   '#6B9490',
};

export const PHASE_SCALE_FROM: Record<string, number> = {
  INHALE: 0.55,
  HOLD:   1.0,
  EXHALE: 1.0,
  REST:   0.55,
};

export const PHASE_SCALE_TO: Record<string, number> = {
  INHALE: 1.0,
  HOLD:   1.0,
  EXHALE: 0.55,
  REST:   0.55,
};

export const PHASE_ICONS: Record<string, string> = {
  INHALE: 'water-drop-1',
  HOLD:   'stopwatch',
  EXHALE: 'beat',
  REST:   'moon-half-right-5',
};
