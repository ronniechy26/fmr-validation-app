import { Screen } from '@/components/Screen';
import { annexForms } from '@/constants/annexes';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function AnnexSelectScreen() {
  const { colors } = useThemeMode();
  const router = useRouter();

  return (
    <Screen applyTopInset={false} style={{ paddingTop: spacing.md }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Choose a Form</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Select which annex to use when creating a new FMR validation.
        </Text>
      </View>

      <View style={styles.cards}>
        {annexForms.map((annex) => {
          const disabled = annex.status !== 'available';
          return (
            <TouchableOpacity
              key={annex.id}
              style={[
                styles.card,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  opacity: disabled ? 0.6 : 1,
                },
              ]}
              disabled={disabled}
              onPress={() =>
                router.replace({
                  pathname: '/form-editor',
                  params: { annex: annex.title },
                })
              }
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{annex.title}</Text>
              <Text style={[styles.cardDescription, { color: colors.textMuted }]}>{annex.description}</Text>
              <Text
                style={[
                  styles.cardStatus,
                  { color: annex.status === 'available' ? colors.primary : colors.textMuted },
                ]}
              >
                {annex.status === 'available' ? 'Available' : 'Coming soon'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  cards: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#2c3a57',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  cardDescription: {
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  cardStatus: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});
