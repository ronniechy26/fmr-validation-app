import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ThemeProvider, useThemeMode } from '@/providers/ThemeProvider';
import { OfflineDataProvider } from '@/providers/OfflineDataProvider';
import { fonts, spacing } from '@/theme';
import { useEffect, useState } from 'react';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isOnboardingCompleted } from '@/storage/onboarding';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RootLayout() {
  const [assetsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    ...Ionicons.font,
  });
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const checkOnboarding = async () => {
    const completed = await isOnboardingCompleted();
    setOnboardingComplete(completed);
  };

  useEffect(() => {
    checkOnboarding();
  }, []);

  if (!assetsLoaded || onboardingComplete === null) {
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
            <OfflineDataProvider ready={onboardingComplete}>
              <BottomSheetModalProvider>
                {onboardingComplete ? (
                  <RootStack />
                ) : (
                  <OnboardingStack />
                )}
              </BottomSheetModalProvider>
            </OfflineDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function OnboardingStack() {
  const { colors } = useThemeMode();

  return (
    <Stack
      initialRouteName="onboarding-welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="onboarding-welcome" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding-privacy" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding-sync" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootStack() {
  const { colors } = useThemeMode();
  const { isSignedIn, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      initialRouteName={isSignedIn ? '(tabs)' : 'login'}
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="standalone-detail"
        options={{
          title: 'Standalone Draft',
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
        name="form-data"
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
      <Stack.Screen
        name="data-privacy"
        options={{
          title: 'Data Privacy',
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
