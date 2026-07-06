// Design system tokens — dark-first redesign with green accent
// Primary switched from blue (#2563EB) to green (#22C55E) across all modes.

export const Colors = {
  // Brand — green accent (Inventar reference)
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#F0FDF4',

  // Semantic
  success: '#22C55E',
  successLight: '#F0FDF4',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  info: '#38BDF8',
  infoLight: '#EFF9FF',

  // Neutral (light mode)
  background: '#F9FAFB',
  cardBg: '#FFFFFF',
  inputBg: '#F3F4F6',
  border: '#E5E7EB',
  surface2: '#F0F2F5',
  placeholder: '#9CA3AF',
  textSecondary: '#6B7280',
  textPrimary: '#374151',
  heading: '#111827',
  white: '#FFFFFF',
  black: '#000000',

  // Platform
  shopee: '#EE4D2D',
  shopeeLight: '#FEF0EE',
  tiktok: '#161722',
  tiktokPink: '#FE2C55',
  tiktokLight: '#FFF0F3',
} as const;

export type ColorKey = keyof typeof Colors;
export type ThemeColors = Record<ColorKey, string>;

// Dark palette — matches Inventar reference UI (#0B0F17 bg, #1A1F2B card, #22C55E accent)
export const DarkColors: ThemeColors = {
  ...Colors,

  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: 'rgba(34,197,94,0.14)',

  success: '#22C55E',
  successLight: 'rgba(34,197,94,0.14)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.14)',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.14)',
  info: '#38BDF8',
  infoLight: 'rgba(56,189,248,0.14)',

  background: '#0B0F17',
  cardBg: '#1A1F2B',
  inputBg: '#212739',
  border: '#2A3040',
  surface2: '#212739',
  placeholder: '#6B7280',
  textSecondary: '#9CA3AF',
  textPrimary: '#E5E7EB',
  heading: '#F9FAFB',
  white: '#FFFFFF',
  black: '#000000',

  shopee: '#EE4D2D',
  shopeeLight: 'rgba(238,77,45,0.14)',
  tiktok: '#FE2C55',
  tiktokPink: '#FE2C55',
  tiktokLight: 'rgba(254,44,85,0.14)',
};
