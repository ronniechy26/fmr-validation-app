import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { savePrivacyConsent } from '@/storage/privacy';

export function OnboardingPrivacyScreen() {
  const { colors } = useThemeMode();
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    await savePrivacyConsent(true);
    router.replace('/onboarding-sync');
  };

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Data Privacy Policy</Text>

        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          We comply with the Data Privacy Act of 2012 (RA 10173). Your information stays protected
          and is only used for FMR validation.
        </Text>

        <View style={styles.principlesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Our Principles</Text>
          {PRIVACY_PRINCIPLES.map((item) => (
            <View key={item.id} style={styles.principleRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <View style={styles.principleText}>
                <Text style={[styles.principleTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.principleDesc, { color: colors.textMuted }]}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <View style={styles.contactText}>
            <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Questions or Concerns?</Text>
            <Text style={[styles.contactInfo, { color: colors.textMuted }]}>
              Contact us at (02) 8351-8120 or (02) 8294-9741
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={handleAccept}
          disabled={accepting}
          activeOpacity={0.9}
        >
          <Text style={styles.acceptText}>{accepting ? 'Please wait…' : 'Accept & Continue'}</Text>
          {!accepting && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const PRIVACY_PRINCIPLES = [
  {
    id: '1',
    title: 'Transparency',
    text: 'We explain how your data is collected, used, and stored.',
  },
  {
    id: '2',
    title: 'Legitimate Purpose',
    text: 'Information is used only for FMR validation workflows.',
  },
  {
    id: '3',
    title: 'Proportionality',
    text: 'We only collect the minimum data needed.',
  },
  {
    id: '4',
    title: 'Data Security',
    text: 'Safeguards prevent unauthorized access under RA 10173.',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  principlesContainer: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  principleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  principleText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  principleTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  principleDesc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  contactTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  contactInfo: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
  },
  acceptText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
});
