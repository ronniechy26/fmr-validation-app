import { Screen } from '@/components/Screen';
import { annexForms } from '@/constants/annexes';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { fonts, spacing } from '@/theme';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormRecord } from '@/types/forms';

type FormAggregates = {
  total: number;
  drafts: number;
  pending: number;
  synced: number;
  annexCounts: Record<string, number>;
};

export function AnalyticsScreen() {
  const { colors, mode } = useThemeMode();
  const { projects, standaloneDrafts } = useOfflineData();
  const allForms = useMemo<FormRecord[]>(() => {
    if (!projects.length && !standaloneDrafts.length) return [];
    return [...projects.flatMap((project) => project.forms ?? []), ...standaloneDrafts];
  }, [projects, standaloneDrafts]);

  const aggregates = useMemo(() => {
    const annexCounts: Record<string, number> = {};
    let total = 0;
    let drafts = 0;
    let pending = 0;
    let synced = 0;

    for (const form of allForms) {
      total += 1;
      if (form.status === 'Draft') drafts += 1;
      if (form.status === 'Pending Sync') pending += 1;
      if (form.status === 'Synced') synced += 1;
      if (form.annexTitle) {
        annexCounts[form.annexTitle] = (annexCounts[form.annexTitle] || 0) + 1;
      }
    }

    return { total, drafts, pending, synced, annexCounts };
  }, [allForms]);

  const projectsWithCounts = useMemo(
    () =>
      projects.map((project) => {
        const pendingCount = project.forms.reduce(
          (sum, form) => (form.status === 'Pending Sync' ? sum + 1 : sum),
          0,
        );
        return {
          ...project,
          totalForms: project.forms.length,
          pending: pendingCount,
        };
      }),
    [projects],
  );

  const stats = useMemo(() => heroStats(aggregates), [aggregates]);
  const annexDistribution = useMemo(
    () =>
      annexForms.map((annex) => ({
        id: annex.id,
        title: annex.title,
        count: aggregates.annexCounts[annex.title] || 0,
      })),
    [aggregates.annexCounts],
  );
  const heroBackground = mode === 'dark' ? '#0f172a' : colors.primary;
  const heroSubtitleColor = mode === 'dark' ? '#94a3b8' : '#e0e7ff';

  return (
    <Screen scroll contentContainerStyle={styles.wrapper}>
      <View style={[styles.hero, { backgroundColor: heroBackground }]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={[styles.heroTitle, { color: '#fff' }]}>Insights Dashboard</Text>
            <Text style={[styles.heroSubtitle, { color: heroSubtitleColor }]}>
              Monitor validation volumes across annex forms and projects.
            </Text>
          </View>
        </View>
        <View style={styles.statGrid}>
          {stats.map((stat) => (
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
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { backgroundColor: stat.accent, width: parseInt(stat.progress) }]} />
              </View>
              <Text style={[styles.statSubLabel, { color: stat.accent }]}>{stat.subLabel}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Annex Distribution</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          {annexDistribution.map((annex) => (
            <View key={annex.id} style={styles.listRow}>
              <Text style={[styles.listLabel, { color: colors.textPrimary }]}>{annex.title}</Text>
              <Text style={[styles.listValue, { color: colors.textPrimary }]}>{annex.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Projects Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {projectsWithCounts.map((project) => (
            <View
              key={project.id}
              style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.projectName, { color: colors.textPrimary }]}>{project.title}</Text>
              <Text style={[styles.projectMeta, { color: colors.textMuted }]}>
                {project.barangay ?? '—'}, {project.municipality ?? '—'}
              </Text>
              <View style={styles.projectStats}>
                <Text style={[styles.projectValue, { color: colors.textPrimary }]}>{project.totalForms}</Text>
                <Text style={[styles.projectLabel, { color: colors.textMuted }]}>Total forms</Text>
              </View>
              <View style={styles.projectStats}>
                <Text style={[styles.projectValue, { color: colors.textPrimary }]}>{project.pending}</Text>
                <Text style={[styles.projectLabel, { color: colors.textMuted }]}>Pending sync</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

const heroStats = (forms: FormAggregates) => {
  const { total, drafts, pending, synced } = forms;
  const safeTotal = Math.max(total, 1);
  return [
    {
      label: 'Total Forms',
      value: total.toString(),
      subLabel: '+2 created this week',
      background: '#ede9fe',
      accent: '#4338ca',
      progress: `${Math.min(total / (total + 5), 1) * 100}%`,
    },
    {
      label: 'Pending Sync',
      value: pending.toString(),
      subLabel: 'Requires upload',
      background: '#e0f2fe',
      accent: '#0369a1',
      progress: `${Math.min(pending / safeTotal, 1) * 100}%`,
    },
    {
      label: 'Drafts',
      value: drafts.toString(),
      subLabel: 'Needs completion',
      background: '#fef3c7',
      accent: '#b45309',
      progress: `${Math.min(drafts / safeTotal, 1) * 100}%`,
    },
    {
      label: 'Synced',
      value: synced.toString(),
      subLabel: 'Up to date',
      background: '#ecfdf5',
      accent: '#047857',
      progress: `${Math.min(synced / safeTotal, 1) * 100}%`,
    },
  ];
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xl,
  },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#fff',
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    color: '#94a3b8',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  heroBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontFamily: fonts.semibold,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statLabel: {
    fontFamily: fonts.medium,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  statSubLabel: {
    fontFamily: fonts.regular,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#ffffff40',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
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
  projectCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  projectName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  projectMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  projectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  projectValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  projectLabel: {
    fontFamily: fonts.regular,
    color: '#94a3b8',
  },
});
