export const Colors = {
  // Brand
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',

  // Semantic
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  info: '#0284C7',
  infoLight: '#F0F9FF',

  // Neutral
  background: '#F9FAFB',
  cardBg: '#FFFFFF',
  inputBg: '#F3F4F6',   // ← was missing, used in EditImageScreen
  border: '#E5E7EB',
  placeholder: '#9CA3AF',
  textSecondary: '#6B7280',
  textPrimary: '#374151',
  heading: '#111827',
  white: '#FFFFFF',

  // Platform
  shopee: '#EE4D2D',
  shopeeLight: '#FFF0EE',
  tiktok: '#161722',
  tiktokPink: '#FE2C55',
  tiktokLight: '#FFF0F3',
} as const;

export type ColorKey = keyof typeof Colors;
