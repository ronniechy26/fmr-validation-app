import { ReactNode } from 'react';
import { Platform, ScrollView, StatusBar, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { useThemeMode } from '@/providers/ThemeProvider';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  applyTopInset?: boolean;
}

export function Screen({ children, scroll = false, style, contentContainerStyle, applyTopInset = true }: ScreenProps) {
  const { colors, mode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const statusStyle = mode === 'dark' ? 'light-content' : 'dark-content';
  const defaultTop = insets.top || (Platform.OS === 'android' ? spacing.md : spacing.sm);
  const topPadding = applyTopInset ? defaultTop : spacing.md;

  if (scroll) {
    return (
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={[styles.safeArea, { backgroundColor: colors.secondary, paddingTop: topPadding }, style]}
      >
        <StatusBar barStyle={statusStyle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[
        styles.safeArea,
        styles.content,
        { backgroundColor: colors.secondary, paddingTop: topPadding },
        style,
      ]}
    >
      <StatusBar barStyle={statusStyle} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
});
