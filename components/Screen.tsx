import { ReactNode } from 'react';
import { ScrollView, StatusBar, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { useThemeMode } from '@/providers/ThemeProvider';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = false, style, contentContainerStyle }: ScreenProps) {
  const { colors, mode } = useThemeMode();
  const statusStyle = mode === 'dark' ? 'light-content' : 'dark-content';

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.secondary }, style]}>
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
    <SafeAreaView style={[styles.safeArea, styles.content, { backgroundColor: colors.secondary }, style]}>
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
