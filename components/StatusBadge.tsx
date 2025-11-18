import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, FormStatus, spacing } from '@/theme';

interface StatusBadgeProps {
  status: FormStatus;
}

const statusColors: Record<FormStatus, string> = {
  Draft: colors.textMuted,
  'Pending Sync': colors.warning,
  Synced: colors.success,
  Error: colors.danger,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: `${statusColors[status]}20`, borderColor: statusColors[status] }]}>
      <Text style={[styles.text, { color: statusColors[status] }]}>{status}</Text>
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
