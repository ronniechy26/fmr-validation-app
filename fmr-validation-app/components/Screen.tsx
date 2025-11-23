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
  noBottomPadding?: boolean;
}

export function Screen({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  applyTopInset = true,
  noBottomPadding = false,
}: ScreenProps) {
  const { colors, mode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const statusStyle = mode === 'dark' ? 'light-content' : 'dark-content';
  const defaultTop = insets.top || (Platform.OS === 'android' ? spacing.md : spacing.sm);
  const bottomPadding = noBottomPadding ? 0 : (insets.bottom || spacing.md) + 90;
  const topPadding = applyTopInset ? defaultTop : spacing.md;

  const containerStyle = [
    styles.safeArea,
    { backgroundColor: colors.secondary, paddingTop: topPadding },
    style,
  ];

  const innerContentStyle = [
    styles.content,
    { paddingBottom: bottomPadding },
    contentContainerStyle,
  ];

  if (scroll) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={containerStyle}>
        <StatusBar
          barStyle={statusStyle}
          backgroundColor={colors.secondary}
          translucent={false}
          hidden={false}
          animated
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={innerContentStyle}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[containerStyle, innerContentStyle]}>
      <StatusBar
        barStyle={statusStyle}
        backgroundColor={colors.secondary}
        translucent={false}
        hidden={false}
        animated
      />
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