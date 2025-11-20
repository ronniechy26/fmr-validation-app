import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function LoginScreen() {
  const { colors } = useThemeMode();
  const { signIn, isSignedIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn, router]);

  const handleSubmit = () => {
    signIn();
    router.replace('/');
  };

  return (
    <Screen scroll style={{ paddingBottom: spacing.xl }}>
      <View style={styles.hero}>
        <View style={[styles.logoBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="leaf" size={32} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.textPrimary }]}>FMR</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>FMR Validation Portal</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
          Login to continue monitoring validation forms, sync statuses, and FMR field insights.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Welcome back</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.secondary },
            ]}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.secondary },
            ]}
          />
        </View>
        <TouchableOpacity style={styles.forgotButton}>
          <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
          <Text style={styles.submitText}>Sign In</Text>
        </TouchableOpacity>

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logoText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    gap: spacing.md,
    shadowColor: '#2c3a57',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
});
