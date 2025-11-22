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
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isOnboardingCompleted } from '@/storage/onboarding';
import Ionicons from '@expo/vector-icons/Ionicons';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    ...Ionicons.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { colors } = useThemeMode();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const { isSignedIn, loading: authLoading } = useAuth();
  const router = useRouter();

  const checkOnboarding = async () => {
    try {
      const completed = await isOnboardingCompleted();
      console.log('[OnboardingCheck] Status:', completed);
      setOnboardingComplete(completed);
    } catch (error) {
      console.error('[OnboardingCheck] Error:', error);
      setOnboardingComplete(false); // Default to false on error
    }
  };

  useEffect(() => {
    // Delay checking onboarding to avoid conflict with AuthProvider's initial DB check
    const timer = setTimeout(() => {
      checkOnboarding();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Force redirect if onboarding is not complete
  useEffect(() => {
    if (onboardingComplete === false && !authLoading) {
      // We use a small timeout to ensure navigation is ready
      setTimeout(() => {
        router.replace('/onboarding-welcome');
      }, 100);
    }
  }, [onboardingComplete, authLoading]);

  if (onboardingComplete === null || authLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#1f4b8f" />
      </View>
    );
  }

  // Determine initial route based on onboarding status and auth status
  const getInitialRoute = () => {
    if (!onboardingComplete) return 'onboarding-welcome';
    if (isSignedIn) return '(tabs)';
    return 'login';
  };

  return (
    <OfflineDataProvider ready={onboardingComplete}>
      <BottomSheetModalProvider>
        <Stack
          initialRouteName={getInitialRoute()}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Onboarding Routes */}
          <Stack.Screen name="onboarding-welcome" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-privacy" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-sync" options={{ headerShown: false }} />

          {/* Auth Routes */}
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* Main App Routes */}
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
              title: 'Project Details',
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
      </BottomSheetModalProvider>
    </OfflineDataProvider>
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
