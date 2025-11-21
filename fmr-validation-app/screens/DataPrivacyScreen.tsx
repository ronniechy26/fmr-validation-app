import { Screen } from '@/components/Screen';
import { fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { StyleSheet, Text, View } from 'react-native';

const PRIVACY_PRINCIPLES = [
  {
    id: '1',
    title: 'Transparency',
    text: 'We will be open about how we use your data.',
  },
  {
    id: '2',
    title: 'Legitimate Purpose',
    text: 'We will only collect and use your data for specified and legitimate purposes as outlined in this introduction.',
  },
  {
    id: '3',
    title: 'Proportionality',
    text: 'We will only collect the data that is necessary for the stated purpose.',
  },
  {
    id: '4',
    title: 'Data Security',
    text: 'We will implement appropriate security measures to protect your data from unauthorized access, use, or disclosure, in compliance with the Implementing Rules and Regulations (IRR) of the Data Privacy Act.',
  },
];

export function DataPrivacyScreen() {
  const { colors } = useThemeMode();

  return (
    <Screen scroll contentContainerStyle={styles.scrollContent}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Data Privacy Policy</Text>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        We are committed to protecting your privacy and ensuring the security of your data. The information collected in this survey will be used solely for the Knowledge Census of Agricultural Mechanization and Infrastructure. We will not share your responses with any third parties without your explicit consent, except as required by law. Specifically, we adhere to the principles of the Data Privacy Act of 2012 (Republic Act No. 10173), which includes:
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
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <View style={styles.contactText}>
          <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Your Rights</Text>
          <Text style={[styles.contactInfo, { color: colors.textMuted }]}>
            You have the right to access, correct, or object to the processing of your personal data, as well as to file a complaint with the National Privacy Commission (NPC).
          </Text>
        </View>
      </View>

      <View style={[styles.contactCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Ionicons name="call-outline" size={20} color={colors.primary} />
        <View style={styles.contactText}>
          <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Contact Us</Text>
          <Text style={[styles.contactInfo, { color: colors.textMuted }]}>
            For more information about our data privacy practices or to exercise your rights, please contact us at (02) 8351-8120 or (02) 8294-9741.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
});
