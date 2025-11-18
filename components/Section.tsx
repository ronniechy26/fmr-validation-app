import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { radii, spacing, typography } from '@/theme';
import { useThemeMode } from '@/providers/ThemeProvider';

interface SectionProps {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Section({ title, children, style }: SectionProps) {
  const { colors, mode } = useThemeMode();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: mode === 'dark' ? '#000' : '#3b4252',
        } as ViewStyle,
        style,
      ]}
    >
      {title ? <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  title: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
  },
  body: {
    gap: spacing.md,
  },
});
