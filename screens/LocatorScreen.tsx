import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { FilterChip } from '@/components/FilterChip';
import { StatusBadge } from '@/components/StatusBadge';
import { fonts, spacing } from '@/theme';
import { dummyProjects } from '@/constants/forms';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';

const filterOptions = ['All', 'North', 'Central', 'South'] as const;

export function LocatorScreen() {
  const [selectedZone, setSelectedZone] = useState<(typeof filterOptions)[number]>('All');
  const { colors, mode } = useThemeMode();

  const highlightedForms = useMemo(() => {
    const forms = dummyProjects.flatMap((project) =>
      project.forms.map((form) => ({
        id: form.id,
        projectName: project.name,
        barangay: project.locationBarangay,
        municipality: project.locationMunicipality,
        status: form.status,
        updatedAt: form.updatedAt,
      })),
    );
    if (selectedZone === 'All') return forms;
    return forms.slice(0, 2);
  }, [selectedZone]);

  return (
    <Screen scroll>
      <View
        style={[
          styles.mapCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: mode === 'dark' ? '#000' : '#2c3a57',
          },
        ]}
      >
        <View style={styles.mapHeader}>
          <Text style={[styles.mapLabel, { color: colors.textPrimary }]}>FMR Locator</Text>
          <Text style={[styles.mapSubtitle, { color: colors.textMuted }]}>
            Check barangays needing validation and sync progress.
          </Text>
        </View>
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="map" size={42} color={colors.textMuted} />
          <Text style={[styles.mapPlaceholderText, { color: colors.textMuted }]}>Interactive map coming soon</Text>
        </View>
        <TouchableOpacity style={[styles.mapButton, { backgroundColor: colors.secondary }]}>
          <Ionicons name="compass" size={16} color={colors.primary} />
          <Text style={[styles.mapButtonText, { color: colors.primary }]}>Center on current location</Text>
        </TouchableOpacity>
      </View>

      <Section title="Quick Filters">
        <View style={styles.filterWrap}>
          {filterOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={option === selectedZone}
              onPress={() => setSelectedZone(option)}
            />
          ))}
        </View>
        <View style={styles.filterRow}>
          <View style={[styles.filterIndicator, { backgroundColor: colors.primary }]} />
          <Text style={[styles.filterText, { color: colors.textMuted }]}>
            Showing barangays within 15km radius
          </Text>
        </View>
      </Section>

      <Section title="Nearby Projects">
        {highlightedForms.map((form) => (
          <View key={form.id} style={[styles.nearbyCard, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nearbyTitle, { color: colors.textPrimary }]}>{form.projectName}</Text>
              <Text style={[styles.nearbySubtitle, { color: colors.textPrimary }]}>
                {form.barangay}, {form.municipality}
              </Text>
              <Text style={[styles.nearbyMeta, { color: colors.textMuted }]}>
                Last updated {new Date(form.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <StatusBadge status={form.status} />
          </View>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.md,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 1,
  },
  mapHeader: {
    gap: spacing.xs,
  },
  mapLabel: {
    fontFamily: fonts.semibold,
    fontSize: 20,
  },
  mapSubtitle: {
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  mapPlaceholder: {
    borderRadius: 16,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapPlaceholderText: {
    fontFamily: fonts.medium,
  },
  mapButton: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  mapButtonText: {
    fontFamily: fonts.semibold,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterIndicator: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  filterText: {
    fontFamily: fonts.regular,
  },
  nearbyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  nearbyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  nearbySubtitle: {
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  nearbyMeta: {
    fontFamily: fonts.regular,
    marginTop: 2,
  },
});
