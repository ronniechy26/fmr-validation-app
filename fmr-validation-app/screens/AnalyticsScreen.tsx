import { Screen } from '@/components/Screen';
import { annexForms } from '@/constants/annexes';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { FormRecord } from '@/types/forms';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type FormAggregates = {
  total: number;
  drafts: number;
  pending: number;
  synced: number;
  standalone: number;
  annexCounts: Record<string, number>;
};

type StatCard = {
  label: string;
  value: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

export function AnalyticsScreen() {
  const { colors, mode } = useThemeMode();
  const { projects, standaloneDrafts } = useOfflineData();

  const allForms = useMemo<FormRecord[]>(() => {
    if (!projects.length && !standaloneDrafts.length) return [];
    return [...projects.flatMap((project) => project.forms ?? []), ...standaloneDrafts];
  }, [projects, standaloneDrafts]);

  const aggregates = useMemo<FormAggregates>(() => {
    const annexCounts: Record<string, number> = {};
    let total = 0;
    let drafts = 0;
    let pending = 0;
    let synced = 0;
    let standalone = 0;

    for (const form of allForms) {
      total += 1;
      if (form.status === 'Draft') drafts += 1;
      if (form.status === 'Pending Sync') pending += 1;
      if (form.status === 'Synced') synced += 1;
      if (!form.linkedProjectId) standalone += 1;
      if (form.annexTitle) {
        annexCounts[form.annexTitle] = (annexCounts[form.annexTitle] || 0) + 1;
      }
    }

    return { total, drafts, pending, synced, standalone, annexCounts };
  }, [allForms]);

  const recentActivity = useMemo(() => {
    return [...allForms]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [allForms]);

  const topProjects = useMemo(() => {
    return [...projects]
      .map((project) => ({
        ...project,
        totalForms: project.forms?.length ?? 0,
        pending: project.forms?.filter((form) => form.status === 'Pending Sync').length ?? 0,
      }))
      .sort((a, b) => (b.totalForms || 0) - (a.totalForms || 0))
      .slice(0, 5);
  }, [projects]);

  const annexDistribution = useMemo(
    () =>
      annexForms.map((annex) => ({
        id: annex.id,
        title: annex.title,
        count: aggregates.annexCounts[annex.title] || 0,
      })),
    [aggregates.annexCounts],
  );

  const statCards: StatCard[] = useMemo(
    () => [
      {
        label: 'Total forms',
        value: aggregates.total.toString(),
        accent: colors.primary,
        icon: 'layers-outline',
        description: 'Overall validations tracked',
      },
      {
        label: 'Pending sync',
        value: aggregates.pending.toString(),
        accent: '#f59e0b',
        icon: 'cloud-upload-outline',
        description: 'Waiting to upload',
      },
      {
        label: 'Drafts',
        value: aggregates.drafts.toString(),
        accent: '#6366f1',
        icon: 'pencil-outline',
        description: 'Need completion',
      },
      {
        label: 'Standalone',
        value: aggregates.standalone.toString(),
        accent: '#0ea5e9',
        icon: 'link-outline',
        description: 'Ready to attach to FMR',
      },
      {
        label: 'Synced',
        value: aggregates.synced.toString(),
        accent: '#22c55e',
        icon: 'sparkles-outline',
        description: 'Up to date with server',
      },
    ],
    [aggregates, colors.primary],
  );

  const heroBackground = mode === 'dark' ? '#0f172a' : colors.primary;
  const heroSubtitleColor = mode === 'dark' ? '#94a3b8' : '#e0e7ff';

  const projectAggregates = useMemo(() => {
    let totalProjects = 0;
    let totalAmount = 0;
    const byYear: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const project of projects) {
      totalProjects += 1;

      // Parse amount
      if (project.allocatedAmount) {
        const amount = parseFloat(project.allocatedAmount.toString().replace(/[^0-9.-]+/g, ''));
        if (!isNaN(amount)) {
          totalAmount += amount;
        }
      }

      // Year
      if (project.yearFunded) {
        byYear[project.yearFunded] = (byYear[project.yearFunded] || 0) + 1;
      }

      // Type
      if (project.projectType) {
        byType[project.projectType] = (byType[project.projectType] || 0) + 1;
      }
    }

    return { totalProjects, totalAmount, byYear, byType };
  }, [projects]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `₱${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
      return `₱${(amount / 1_000_000).toFixed(1)}M`;
    }
    return `₱${amount.toLocaleString()}`;
  };

  const projectStats = useMemo(() => [
    {
      label: 'Total Projects',
      value: projectAggregates.totalProjects.toString(),
      icon: 'briefcase-outline' as const,
      color: colors.primary,
    },
    {
      label: 'Total Budget',
      value: formatCurrency(projectAggregates.totalAmount),
      icon: 'wallet-outline' as const,
      color: '#10b981', // Emerald
    },
  ], [projectAggregates, colors.primary]);

  const yearsList = useMemo(() => {
    return Object.entries(projectAggregates.byYear)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .slice(0, 5);
  }, [projectAggregates.byYear]);

  return (
    <Screen scroll contentContainerStyle={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: heroBackground }]}>
        <View style={styles.heroHeader}>
          <View style={[styles.heroBadge, { borderColor: '#ffffff30', backgroundColor: '#ffffff12' }]}>
            <Ionicons name="speedometer-outline" size={16} color="#fff" />
            <Text style={[styles.heroBadgeText, { color: '#fff' }]}>Live overview</Text>
          </View>
          <Text style={[styles.heroTitle, { color: '#fff' }]}>Analytics</Text>
          <Text style={[styles.heroSubtitle, { color: heroSubtitleColor }]}>
            Quick health check of validations, sync, and annex coverage.
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
        >
          {statCards.map((card) => (
            <View
              key={card.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: '#ffffff10',
                  borderColor: `${card.accent}30`,
                },
              ]}
            >
              <View style={styles.statCardHeader}>
                <View style={[styles.iconPill, { backgroundColor: `${card.accent}20` }]}>
                  <Ionicons name={card.icon} size={16} color={card.accent} />
                </View>
                <Text style={[styles.statLabel, { color: heroSubtitleColor }]}>{card.label}</Text>
              </View>
              <Text style={[styles.statValue, { color: '#fff' }]}>{card.value}</Text>
              <Text style={[styles.statDescription, { color: heroSubtitleColor }]}>{card.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Project Insights Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Project Insights</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Overview of FMR projects</Text>
          </View>
        </View>

        <View style={styles.projectGrid}>
          {projectStats.map((stat) => (
            <View key={stat.label} style={[styles.projectStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.projectIconContainer, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <View>
                <Text style={[styles.projectStatValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                <Text style={[styles.projectStatLabel, { color: colors.textMuted }]}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {yearsList.length > 0 && (
          <View style={[styles.yearCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>Projects by Year</Text>
            <View style={styles.yearList}>
              {yearsList.map(([year, count]) => (
                <View key={year} style={styles.yearRow}>
                  <Text style={[styles.yearLabel, { color: colors.textPrimary }]}>{year}</Text>
                  <View style={styles.yearBarContainer}>
                    <View
                      style={[
                        styles.yearBar,
                        {
                          width: `${(count / Math.max(...Object.values(projectAggregates.byYear))) * 100}%`,
                          backgroundColor: colors.primary
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.yearCount, { color: colors.textMuted }]}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Annex distribution</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Forms per annex type</Text>
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          {annexDistribution.map((annex) => (
            <View key={annex.id} style={[styles.listRow, { borderColor: colors.border }]}>
              <Text style={[styles.listLabel, { color: colors.textPrimary }]}>{annex.title}</Text>
              <View style={styles.listValuePill}>
                <Ionicons name="duplicate-outline" size={14} color={colors.textPrimary} />
                <Text style={[styles.listValue, { color: colors.textPrimary }]}>{annex.count}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top projects</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Most active FMRs by form count</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {topProjects.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No project data yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Sync to see project activity and pending items.
              </Text>
            </View>
          ) : (
            topProjects.map((project) => (
              <View
                key={project.id}
                style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={{ gap: spacing.xs }}>
                  <Text style={[styles.projectName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {project.title || 'Untitled FMR'}
                  </Text>
                  <Text style={[styles.projectMeta, { color: colors.textMuted }]} numberOfLines={1}>
                    {project.barangay ?? '—'}, {project.municipality ?? '—'}
                  </Text>
                </View>
                <View style={styles.projectStatsRow}>
                  <View style={styles.projectBadge}>
                    <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                    <Text style={[styles.projectBadgeLabel, { color: colors.primary }]}>
                      {project.totalForms} form{project.totalForms === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={styles.projectBadgeMuted}>
                    <Ionicons name="cloud-upload-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.projectBadgeLabel, { color: colors.textMuted }]}>
                      {project.pending} pending
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent activity</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Latest updates across synced and draft forms
            </Text>
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          {recentActivity.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No recent updates</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Create or sync a form to see activity here.
              </Text>
            </View>
          ) : (
            recentActivity.map((form) => (
              <View
                key={form.id}
                style={[styles.timelineRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <View style={styles.timelineIcon}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {form.annexTitle || 'Validation form'}
                  </Text>
                  <Text style={[styles.timelineSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                    {form.data?.nameOfProject || 'Untitled project'}
                  </Text>
                </View>
                <View style={[styles.statusPill, { borderColor: colors.border }]}>
                  <Text style={[styles.statusText, { color: colors.textMuted }]}>{form.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg,
  },
  hero: {
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.md,
  },
  heroHeader: {
    gap: spacing.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroBadgeText: {
    fontFamily: fonts.medium,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    width: 180,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPill: {
    padding: spacing.xs,
    borderRadius: 999,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  statDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  section: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  listLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  listValuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  projectCard: {
    width: 220,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  projectName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  projectMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  projectStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#eef2fb',
  },
  projectBadgeMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  projectBadgeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    width: 220,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2fb',
  },
  timelineTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  timelineSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  projectGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  projectStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
  },
  projectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectStatValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  projectStatLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  yearCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHeaderTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  yearList: {
    gap: spacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  yearLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    width: 40,
  },
  yearBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  yearBar: {
    height: '100%',
    borderRadius: 4,
  },
  yearCount: {
    fontFamily: fonts.medium,
    fontSize: 13,
    width: 30,
    textAlign: 'right',
  },
});
