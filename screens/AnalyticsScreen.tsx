import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { dummyProjects } from '@/constants/forms';
import { annexForms } from '@/constants/annexes';

export function AnalyticsScreen() {
  const { colors, mode } = useThemeMode();
  const allForms = useMemo(() => dummyProjects.flatMap((project) => project.forms), []);

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Validation Overview</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={260}
          decelerationRate="fast"
          style={{ marginTop: spacing.md }}
        >
          {heroStats(allForms).map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: stat.background,
                  borderColor: `${stat.accent}25`,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: stat.accent }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <Text style={[styles.statSubLabel, { color: stat.accent }]}>{stat.subLabel}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Annex Distribution</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          {annexForms.map((annex) => {
            const count = allForms.filter((form) => form.annexTitle === annex.title).length;
            return (
              <View key={annex.id} style={styles.listRow}>
                <Text style={[styles.listLabel, { color: colors.textPrimary }]}>{annex.title}</Text>
                <Text style={[styles.listValue, { color: colors.textPrimary }]}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const heroStats = (forms: typeof dummyProjects[number]['forms']) => {
  const drafts = forms.filter((form) => form.status === 'Draft').length;
  const pending = forms.filter((form) => form.status === 'Pending Sync').length;
  const synced = forms.filter((form) => form.status === 'Synced').length;
  return [
    {
      label: 'Total Forms',
      value: forms.length.toString(),
      subLabel: '+2 created this week',
      background: '#ede9fe',
      accent: '#4338ca',
    },
    {
      label: 'Pending Sync',
      value: pending.toString(),
      subLabel: 'Requires upload',
      background: '#e0f2fe',
      accent: '#0369a1',
    },
    {
      label: 'Drafts',
      value: drafts.toString(),
      subLabel: 'Needs completion',
      background: '#fef3c7',
      accent: '#b45309',
    },
    {
      label: 'Synced',
      value: synced.toString(),
      subLabel: 'Up to date',
      background: '#ecfdf5',
      accent: '#047857',
    },
  ];
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  statCard: {
    width: 240,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  statLabel: {
    fontFamily: fonts.medium,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 28,
  },
  statSubLabel: {
    fontFamily: fonts.regular,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listLabel: {
    fontFamily: fonts.semibold,
  },
  listValue: {
    fontFamily: fonts.medium,
  },
});
