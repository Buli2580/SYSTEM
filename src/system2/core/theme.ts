export const SYSTEM_COLORS = {
  background: '#030709',
  backgroundElevated: '#071014',

  panel: '#081318',
  panelSoft: '#0B171C',

  cyan: '#00E5FF',
  cyanSoft: '#00AFC4',
  cyanDark: '#004B57',

  white: '#F3F7F8',
  text: '#DCE6E8',
  textMuted: '#718086',
  textVeryMuted: '#39464B',

  line: '#113039',
  lineBright: '#007A8A',

  success: '#36E69A',
  warning: '#FFC857',
  danger: '#FF5067',

  legendary: '#F2C46D',

  black: '#000000',

  transparent: 'transparent',
} as const;

export const SYSTEM_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const SYSTEM_RADIUS = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  round: 999,
} as const;

export const SYSTEM_FONT = {
  tiny: 10,
  small: 12,
  body: 14,
  medium: 16,
  title: 22,
  largeTitle: 30,
  hero: 56,
} as const;

export const SYSTEM_ANIMATION = {
  fast: 140,
  normal: 260,
  slow: 500,
  cinematic: 900,
} as const;

export const SYSTEM_THEME = {
  colors: SYSTEM_COLORS,
  spacing: SYSTEM_SPACING,
  radius: SYSTEM_RADIUS,
  font: SYSTEM_FONT,
  animation: SYSTEM_ANIMATION,
} as const;