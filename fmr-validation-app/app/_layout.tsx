import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ThemeProvider, useThemeMode } from '@/providers/ThemeProvider';
import { OfflineDataProvider } from '@/providers/OfflineDataProvider';
import { fonts } from '@/theme';
import { useEffect, useState, useRef } from 'react';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter, SplashScreen } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, Text, Animated } from 'react-native';
// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isOnboardingCompleted } from '@/storage/onboarding';
import Ionicons from '@expo/vector-icons/Ionicons';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  const { colors } = useThemeMode();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.loader, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.loaderContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <View style={[styles.logoContainer, { backgroundColor: colors.secondary }]}>
          <Ionicons name="leaf" size={48} color={colors.primary} />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={[styles.loaderTitle, { color: colors.textPrimary }]}>FMR Validation</Text>
        <Text style={[styles.loaderSubtitle, { color: colors.textMuted }]}>
          Field Monitoring & Reporting
        </Text>

        <View style={styles.loaderSpinner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Loading...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

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
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const loadingStartTime = useRef<number>(Date.now());

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

  // Enforce minimum 2-second loading screen display
  useEffect(() => {
    const elapsed = Date.now() - loadingStartTime.current;
    const remaining = Math.max(0, 2000 - elapsed);

    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, remaining);

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
  }, [onboardingComplete, authLoading, router]);

  // Show loading screen if data is not ready OR minimum display time hasn't elapsed
  if (onboardingComplete === null || authLoading || !minLoadingComplete) {
    return <LoadingScreen />;
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
    gap: 24,
  },
  loaderContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 16,
  },
  loaderSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  loaderSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  loaderText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
