import { ForwardedRef, forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, radii, spacing, typography } from '@/theme';

interface LabeledInputProps extends TextInputProps {
  label: string;
  helperText?: string;
}

export const LabeledInput = forwardRef(function LabeledInputInner(
  { label, helperText, style, ...inputProps }: LabeledInputProps,
  ref: ForwardedRef<TextInput>,
) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...inputProps}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
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
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    backgroundColor: colors.secondary,
  },
  helper: {
    ...typography.helper,
  },
});
