import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function OnboardingWelcomeScreen() {
  const { colors } = useThemeMode();
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding-privacy');
  };

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={[styles.logoBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="leaf" size={64} color={colors.primary} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>FMR Validation</Text>
          <Text style={[styles.appTagline, { color: colors.textMuted }]}>Field Monitoring & Reporting</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Monitor validation forms, sync statuses, and FMR field insights with ease.
          Your comprehensive tool for agricultural and fisheries engineering data management.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.id} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={feature.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.continueText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Powered by Department of Agriculture
        </Text>
      </View>
    </Screen>
  );
}

const FEATURES = [
  {
    id: '1',
    icon: 'cloud-offline',
    title: 'Offline First',
    description: 'Work seamlessly without internet connection',
  },
  {
    id: '2',
    icon: 'sync',
    title: 'Auto Sync',
    description: 'Automatic data synchronization when online',
  },
  {
    id: '3',
    icon: 'shield-checkmark',
    title: 'Secure & Private',
    description: 'Compliant with Data Privacy Act of 2012',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  titleContainer: {
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  appName: {
    fontFamily: fonts.bold,
    fontSize: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  content: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  bafeBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
  },
  bafeText: {
    fontFamily: fonts.bold,
    fontSize: 26,
    letterSpacing: 3,
  },
  bafeSubtext: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  features: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  featureTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  featureDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  continueText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 17,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
  },
});
