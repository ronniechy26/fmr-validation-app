import { StyleSheet, Text, View } from 'react-native';
import { fonts, FormStatus, spacing } from '@/theme';
import { useThemeColors } from '@/providers/ThemeProvider';

interface StatusBadgeProps {
  status: FormStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = useThemeColors();
  const palette: Record<FormStatus, string> = {
    Draft: colors.textMuted,
    'Pending Sync': colors.warning,
    Synced: colors.success,
    Error: colors.danger,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `${palette[status]}20`, borderColor: palette[status] },
      ]}
    >
      <Text style={[styles.text, { color: palette[status] }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
});
