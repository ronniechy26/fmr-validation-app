export type FormStatus = 'Draft' | 'Pending Sync' | 'Synced' | 'Error';

export type ThemeMode = 'light' | 'dark';

const lightColors = {
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
};

const darkColors = {
  primary: '#82a6ff',
  secondary: '#0f172a',
  success: '#4ade80',
  warning: '#facc15',
  danger: '#fb7185',
  textPrimary: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#1f2937',
  background: '#0b1220',
  surface: '#111a2d',
  surfaceMuted: '#1e2a43',
};

export const colorPalettes = {
  light: lightColors,
  dark: darkColors,
};

export type ThemeColors = typeof lightColors;

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
  },
  subheading: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
  },
};

export const theme = {
  spacing,
  radii,
  fonts,
  typography,
};

export type Theme = typeof theme;
