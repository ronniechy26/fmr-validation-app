import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider, useThemeMode } from '@/providers/ThemeProvider';
import { OfflineDataProvider } from '@/providers/OfflineDataProvider';
import { fonts } from '@/theme';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <OfflineDataProvider>
              <BottomSheetModalProvider>
                <RootStack />
              </BottomSheetModalProvider>
            </OfflineDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colors } = useThemeMode();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="annex-select"
        options={{
          title: 'Choose a Form',
          headerShown: true,
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: colors.primary },
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerBackTitleStyle: { fontFamily: fonts.regular },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="form-editor"
        options={{
          title: 'Form Editor',
          headerShown: true,
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: colors.primary },
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerBackTitleStyle: { fontFamily: fonts.regular },
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="form-detail"
        options={{
          title: 'Form Details',
          headerShown: true,
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: colors.primary },
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerBackTitleStyle: { fontFamily: fonts.regular },
          headerBackTitle: 'Back',
        }}
      />
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
