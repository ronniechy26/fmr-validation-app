import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { fonts, spacing } from '@/theme';
import { useThemeColors } from '@/providers/ThemeProvider';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function FilterChip({ label, active = false, onPress }: FilterChipProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.background,
        },
        active && { backgroundColor: colors.primary },
      ]}
    >
      <Text style={[styles.label, { color: colors.textMuted }, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
