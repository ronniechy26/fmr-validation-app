import { LabeledInput } from '@/components/LabeledInput';
import { colors, spacing } from '@/theme';
import { forwardRef } from 'react';
import { TextInput } from 'react-native';

export const LabeledTextArea = forwardRef<TextInput, React.ComponentProps<typeof LabeledInput>>(
  function LabeledTextAreaInner({ style, ...rest }, ref) {
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
