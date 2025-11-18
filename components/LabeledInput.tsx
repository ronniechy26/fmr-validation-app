import { ForwardedRef, forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { fonts, radii, spacing, typography } from '@/theme';
import { useThemeColors } from '@/providers/ThemeProvider';

interface LabeledInputProps extends TextInputProps {
  label: string;
  helperText?: string;
}

export const LabeledInput = forwardRef(function LabeledInputInner(
  { label, helperText, style, ...inputProps }: LabeledInputProps,
  ref: ForwardedRef<TextInput>,
) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.secondary,
          },
          style,
        ]}
        {...inputProps}
      />
      {helperText ? <Text style={[styles.helper, { color: colors.textMuted }]}>{helperText}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  helper: {
    ...typography.helper,
  },
});
