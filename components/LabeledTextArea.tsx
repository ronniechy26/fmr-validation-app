import { LabeledInput } from '@/components/LabeledInput';
import { spacing } from '@/theme';
import { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { useThemeColors } from '@/providers/ThemeProvider';

export const LabeledTextArea = forwardRef<TextInput, React.ComponentProps<typeof LabeledInput>>(
  function LabeledTextAreaInner({ style, ...rest }, ref) {
    const colors = useThemeColors();
    return (
      <LabeledInput
        ref={ref}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={[{ minHeight: 120, paddingTop: spacing.sm, backgroundColor: colors.background }, style]}
        {...rest}
      />
    );
  },
);
