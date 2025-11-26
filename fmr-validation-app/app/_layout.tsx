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
import { Stack, SplashScreen, useSegments, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, Text, Animated, Image } from 'react-native';
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
      <Animated.View style={[styles.loaderContent, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.logoContainer,
            { backgroundColor: colors.secondary, transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Image
            source={require('../assets/images/fmr-app-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
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
  const { loading: authLoading } = useAuth();
  const segments = useSegments();
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkOnboarding = async () => {
    try {
      const completed = await isOnboardingCompleted();
      setOnboardingComplete(completed);
    } catch (error) {
      setOnboardingComplete(false); // Default to false on error
    }
  };

  useEffect(() => {
    checkOnboarding();
    minTimerRef.current = setTimeout(() => setMinLoadingComplete(true), 2000);
    return () => {
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
    };
  }, []);

  // Show loading screen while onboarding/auth state is resolving
  if (onboardingComplete === null || authLoading || !minLoadingComplete) {
    return <LoadingScreen />;
  }

  const currentRoot = segments?.[0];
  const isOnboardingRoute = currentRoot?.startsWith('onboarding');
  const shouldShowOnboarding = onboardingComplete === false;

  if (shouldShowOnboarding && !isOnboardingRoute) {
    return <Redirect href="/onboarding-welcome" />;
  }

  if (!shouldShowOnboarding && isOnboardingRoute) {
    return <Redirect href="/login" />;
  }



  return (
    <OfflineDataProvider ready={onboardingComplete}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Onboarding Routes */}
          {shouldShowOnboarding ? (
            <>
              <Stack.Screen name="onboarding-welcome" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding-privacy" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding-sync" options={{ headerShown: false }} />
            </>
          ) : null}

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
          <Stack.Screen
            name="profile"
            options={{
              title: 'Profile',
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
  logoImage: {
    width: 72,
    height: 72,
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
    textAlign: 'center',
  },
  loaderText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
