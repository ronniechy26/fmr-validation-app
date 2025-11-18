import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

interface SectionProps {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Section({ title, children, style }: SectionProps) {
  return (
    <View style={[styles.container, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#3b4252',
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
