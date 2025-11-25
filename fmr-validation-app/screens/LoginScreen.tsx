import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadRememberPrefs, saveRememberPrefs, clearRememberPrefs } from '@/storage/remember';

export function LoginScreen() {
  const { colors } = useThemeMode();
  const { signIn, isSignedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const passwordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadRememberPrefs().then((prefs) => {
      if (prefs.email) setUsername(prefs.email); // Using email field for username storage
      if (typeof prefs.remember === 'boolean') setRememberMe(prefs.remember);
    }).catch(() => null);
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn, router]);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Enter your username and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(username.trim(), password, { remember: rememberMe });
      if (rememberMe) {
        await saveRememberPrefs({ email: username.trim(), remember: true }); // Store username in email field
      } else {
        await clearRememberPrefs();
      }
      // Navigation is handled by useEffect when isSignedIn changes
    } catch (err) {
      setError((err as Error).message ?? 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <Text style={[styles.label, { color: colors.textMuted }]}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.secondary },
            ]}
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
          <View style={{ justifyContent: 'center' }}>
            <TextInput
              ref={passwordInputRef}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  backgroundColor: colors.secondary,
                  paddingRight: 40
                },
              ]}
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>


        {error ? <Text style={[styles.errorText, { color: '#c53030' }]}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={rememberMe ? 'checkbox' : 'square-outline'}
            size={18}
            color={rememberMe ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.rememberText, { color: colors.textPrimary }]}>Remember me on this device</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary, opacity: submitting || authLoading ? 0.8 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={submitting || authLoading}
        >
          <Text style={styles.submitText}>{submitting ? 'Signing in…' : 'Sign In'}</Text>
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
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rememberText: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
});
