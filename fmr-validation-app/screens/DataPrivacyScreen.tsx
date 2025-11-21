import { Screen } from '@/components/Screen';
import { fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { StyleSheet, Text, View } from 'react-native';

const ITEM_BULLETS = [
  {
    id: 1,
    title: 'Transparency',
    desc: 'We clearly explain how your data is collected, used, and stored.',
  },
  {
    id: 2,
    title: 'Legitimate purpose',
    desc: 'Information is used only to support the FMR validation program as described.',
  },
  {
    id: 3,
    title: 'Proportionality',
    desc: 'We collect only what is necessary to fulfill validation and reporting requirements.',
  },
  {
    id: 4,
    title: 'Data security',
    desc: 'Safeguards prevent unauthorized access in line with the Data Privacy Act (RA 10173).',
  },
];

export function DataPrivacyScreen() {
  const { colors } = useThemeMode();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Data Privacy Policy</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          We comply with the Data Privacy Act of 2012 (RA 10173). Your information stays protected and is used only for
          FMR validation activities.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {ITEM_BULLETS.map((item) => (
          <View key={item.id} style={styles.bulletRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bulletTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.bulletDesc, { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={[styles.bulletTitle, { color: colors.textPrimary }]}>Your rights</Text>
        <Text style={[styles.bulletDesc, { color: colors.textMuted }]}>
          You may access, correct, or object to processing of your personal data and may file complaints with the National
          Privacy Commission.
        </Text>
        <Text style={[styles.bulletDesc, { color: colors.textMuted }]}>
          For questions, contact us at (02) 8351-8120 or (02) 8294-9741.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  bulletTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  bulletDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs / 2,
  },
});
