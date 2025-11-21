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
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadPrivacyConsent, savePrivacyConsent } from '@/storage/privacy';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RootLayout() {
  const [assetsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    ...Ionicons.font,
  });
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const accepted = await loadPrivacyConsent();
      setPrivacyAccepted(accepted);
    })();
  }, []);

  if (!assetsLoaded || privacyAccepted === null) {
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
          <PrivacyGate accepted={privacyAccepted} onAccept={() => setPrivacyAccepted(true)} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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

function PrivacyGate({ accepted, onAccept }: { accepted: boolean; onAccept: () => void }) {
  if (accepted) {
    return (
      <AuthProvider>
        <OfflineDataProvider ready>
          <BottomSheetModalProvider>
            <RootStack />
          </BottomSheetModalProvider>
        </OfflineDataProvider>
      </AuthProvider>
    );
  }

  return <PrivacyModal onAccept={onAccept} />;
}

function PrivacyModal({ onAccept }: { onAccept: () => void }) {
  const { colors } = useThemeMode();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    await savePrivacyConsent(true);
    onAccept();
    setAccepting(false);
  };

  return (
    <View style={[styles.privacyBackdrop, { backgroundColor: '#00000070' }]}>
      <View style={[styles.privacyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.privacyIcon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        </View>
        <Text style={[styles.privacyTitle, { color: colors.textPrimary }]}>Data Privacy Policy</Text>
        <Text style={[styles.privacySubtitle, { color: colors.textMuted }]}>
          We comply with the Data Privacy Act of 2012 (RA 10173). Your information stays protected and is only used for
          FMR validation.
        </Text>

        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          {PRIVACY_POINTS.map((item) => (
            <View key={item.id} style={styles.privacyBulletRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
              <Text style={[styles.privacyBulletText, { color: colors.textPrimary }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.privacyFooter, { color: colors.textMuted }]}>
          Questions? Contact (02) 8351-8120 or (02) 8294-9741.
        </Text>

        <TouchableOpacity
          style={[styles.privacyButton, { backgroundColor: colors.primary }]}
          onPress={handleAccept}
          disabled={accepting}
          activeOpacity={0.9}
        >
          <Text style={[styles.privacyButtonText, { color: '#fff' }]}>{accepting ? 'Please wait…' : 'Accept & Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PRIVACY_POINTS = [
  { id: '1', text: 'Transparency: we explain how your data is collected, used, and stored.' },
  { id: '2', text: 'Legitimate purpose: information is used only for FMR validation workflows.' },
  { id: '3', text: 'Proportionality: we only collect the minimum data needed.' },
  { id: '4', text: 'Data security: safeguards prevent unauthorized access under RA 10173.' },
];

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  privacyBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  privacyCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  privacyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  privacySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  privacyBulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  privacyBulletText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  privacyFooter: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  privacyButton: {
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  privacyButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
});
