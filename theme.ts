export type FormStatus = 'Draft' | 'Pending Sync' | 'Synced' | 'Error';

export const colors = {
  primary: '#1f4b8f',
  secondary: '#f5f7fb',
  success: '#37b26c',
  warning: '#f6ad55',
  danger: '#e05353',
  textPrimary: '#1f2430',
  textMuted: '#6b7280',
  border: '#d9dbe1',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#eef2fb',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
};

export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
};

export const typography = {
  heading: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  subheading: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  fonts,
  typography,
};

export type Theme = typeof theme;
