import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FilterChip } from '@/components/FilterChip';
import { StatusBadge } from '@/components/StatusBadge';
import { fonts, FormStatus, spacing, typography } from '@/theme';
import { dummyForms } from '@/constants/forms';
import { ValidationForm } from '@/types/forms';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';

type IoniconName = keyof typeof Ionicons.glyphMap;

type HeroStat = {
  label: string;
  value: string;
  subLabel: string;
  icon: IoniconName;
  progress: number;
  background: string;
  accent: string;
  progressColor: string;
};

const filters: ('All' | FormStatus)[] = ['All', 'Draft', 'Pending Sync', 'Synced', 'Error'];

export function FormListScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All');
  const [statIndex, setStatIndex] = useState(0);
  const statsRef = useRef<ScrollView>(null);
  const { colors, mode } = useThemeMode();

  const forms = useMemo(() => {
    if (activeFilter === 'All') {
      return dummyForms;
    }
    return dummyForms.filter((form) => form.status === activeFilter);
  }, [activeFilter]);

  const handleFormPress = (form: ValidationForm) => {
    router.push({
      pathname: '/form-detail',
      params: { form: JSON.stringify(form) },
    });
  };

  const handleNewForm = () => {
    router.push('/form-editor');
  };

  const heroStats = useMemo<HeroStat[]>(() => {
    const drafts = dummyForms.filter((form) => form.status === 'Draft').length;
    const pending = dummyForms.filter((form) => form.status === 'Pending Sync').length;
    const synced = dummyForms.filter((form) => form.status === 'Synced').length;
    return [
      {
        label: 'Total Forms',
        value: dummyForms.length.toString(),
        subLabel: '+2 created this week',
        icon: 'layers',
        progress: 0.85,
        background: '#ede9fe',
        accent: '#4338ca',
        progressColor: '#c4b5fd',
      },
      {
        label: 'Pending Sync',
        value: pending.toString(),
        subLabel: 'Requires upload',
        icon: 'cloud-upload',
        progress: pending === 0 ? 0.2 : 0.6,
        background: '#e0f2fe',
        accent: '#0369a1',
        progressColor: '#7dd3fc',
      },
      {
        label: 'Drafts',
        value: drafts.toString(),
        subLabel: 'Needs completion',
        icon: 'create',
        progress: drafts === 0 ? 0.3 : 0.5,
        background: '#fef3c7',
        accent: '#b45309',
        progressColor: '#fcd34d',
      },
      {
        label: 'Synced',
        value: synced.toString(),
        subLabel: 'Up to date',
        icon: 'checkmark-done',
        progress: synced === 0 ? 0.3 : 0.9,
        background: '#ecfdf5',
        accent: '#047857',
        progressColor: '#6ee7b7',
      },
    ];
  }, []);

  const screenWidth = Dimensions.get('window').width;
  const heroCardWidth = Math.max(screenWidth - spacing.lg * 2, 240);
  const heroSnapInterval = heroCardWidth + spacing.sm;

  useEffect(() => {
    const timer = setInterval(() => {
      setStatIndex((prev) => (prev + 1) % heroStats.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroStats.length]);

  useEffect(() => {
    const offset = statIndex * heroSnapInterval;
    statsRef.current?.scrollTo({ x: offset, animated: true });
  }, [heroSnapInterval, statIndex]);

  const handleStatMomentum = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const nextIndex = Math.round(contentOffset.x / heroSnapInterval);
    if (nextIndex !== statIndex) {
      setStatIndex(nextIndex);
    }
  };

  return (
    <Screen style={{ paddingBottom: spacing.xxl }}>
      <View style={styles.topBanner}>
        <View style={styles.heroBrand}>
          <View style={[styles.heroLogo, { backgroundColor: colors.secondary }]}>
            <Ionicons name="leaf" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.appTitle, { color: colors.textPrimary }]}>FMR Validation</Text>
            <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>Field Monitoring & Reporting</Text>
          </View>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary, borderColor: colors.secondary }]}>
          <Text style={styles.avatarText}>MP</Text>
        </View>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Plan, validate, and sync FMR inspections.</Text>
          <Text style={styles.heroSubtitle}>Stay informed about drafts, pending syncs, and synced records in one glance.</Text>
          <TouchableOpacity style={styles.heroButton} onPress={handleNewForm}>
            <Ionicons name="add-circle" size={16} color="#fff" />
            <Text style={styles.heroButtonText}>New Validation</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={statsRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={heroSnapInterval}
          contentContainerStyle={[styles.statsRow, { paddingRight: 0 }]}
          onMomentumScrollEnd={handleStatMomentum}
        >
          {heroStats.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                {
                  width: heroCardWidth,
                  backgroundColor: stat.background,
                  borderColor: `${stat.accent}30`,
                },
              ]}
            >
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.accent}22` }]}>
                  <Ionicons name={stat.icon} size={18} color={stat.accent} />
                </View>
                <Text style={[styles.statLabel, { color: stat.accent }]}>{stat.label}</Text>
              </View>
              <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <View style={styles.statFooter}>
                <View style={[styles.progressTrack, { backgroundColor: `${stat.accent}22` }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(Math.max(stat.progress, 0), 1) * 100}%`,
                        backgroundColor: stat.progressColor,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.statSubLabel, { color: stat.accent }]}>{stat.subLabel}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filters}>
        {filters.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={filter === activeFilter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </View>

      <FlatList
        style={styles.list}
        data={forms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: mode === 'dark' ? '#000' : '#2c3a57',
              },
            ]}
            onPress={() => handleFormPress(item)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.nameOfProject}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="pin" size={14} color={colors.textMuted} />
                  <Text style={[styles.locationText, { color: colors.textMuted }]}>
                    {item.locationBarangay}, {item.locationMunicipality}
                  </Text>
                </View>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardMetaRow}>
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.metaPillLabel, { color: colors.textMuted }]}>Barangay</Text>
                <Text style={[styles.metaPillValue, { color: colors.textPrimary }]}>{item.locationBarangay}</Text>
              </View>
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.metaPillLabel, { color: colors.textMuted }]}>Municipality</Text>
                <Text style={[styles.metaPillValue, { color: colors.textPrimary }]}>{item.locationMunicipality}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Updated {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
              <View style={styles.viewDetails}>
                <Text style={[styles.viewDetailsText, { color: colors.primary }]}>Open details</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleNewForm}>
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabLabel}>New Validation</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
  },
  appSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontFamily: fonts.semibold,
    color: '#fff',
  },
  hero: {
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroContent: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#fff',
  },
  heroSubtitle: {
    color: '#e4ebff',
    fontFamily: fonts.regular,
    lineHeight: 18,
    fontSize: 13,
  },
  heroButton: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroButtonText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 120,
    borderWidth: 1,
    gap: spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  statFooter: {
    gap: 6,
  },
  statSubLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  locationText: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },
  metaText: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaPill: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  metaPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  metaPillValue: {
    fontFamily: fonts.semibold,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontFamily: fonts.semibold,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 18,
    fontFamily: fonts.bold,
  },
  fabLabel: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
});
