import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { fonts } from '@/theme';
import { ThemeProvider, useThemeMode } from '@/providers/ThemeProvider';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#1f4b8f" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { colors } = useThemeMode();

  return (
    <Stack
      screenOptions={{
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: colors.primary },
        headerTitleAlign: 'center',
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerBackTitleStyle: { fontFamily: fonts.regular },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="form-editor" options={{ title: 'Form Editor' }} />
      <Stack.Screen name="form-detail" options={{ title: 'Form Details' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
