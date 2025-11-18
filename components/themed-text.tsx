import { StyleSheet, Text } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { fonts } from '@/theme';
import type { ThemedTextProps } from '@/types/components';

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  link: {
    fontFamily: fonts.medium,
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
