import { View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import type { ThemedViewProps } from '@/types/components';

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
