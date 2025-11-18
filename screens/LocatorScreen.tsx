import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { FilterChip } from '@/components/FilterChip';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, fonts, spacing } from '@/theme';
import { dummyForms } from '@/constants/forms';
import { Ionicons } from '@expo/vector-icons';

const filterOptions = ['All', 'North', 'Central', 'South'] as const;

export function LocatorScreen() {
  const [selectedZone, setSelectedZone] = useState<(typeof filterOptions)[number]>('All');

  const highlightedForms = useMemo(() => {
    if (selectedZone === 'All') return dummyForms;
    return dummyForms.slice(0, 2);
  }, [selectedZone]);

  return (
    <Screen scroll>
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapLabel}>FMR Locator</Text>
          <Text style={styles.mapSubtitle}>Check barangays needing validation and sync progress.</Text>
        </View>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={42} color="#d6def1" />
          <Text style={styles.mapPlaceholderText}>Interactive map coming soon</Text>
        </View>
        <TouchableOpacity style={styles.mapButton}>
          <Ionicons name="compass" size={16} color={colors.primary} />
          <Text style={styles.mapButtonText}>Center on current location</Text>
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
          <View style={styles.filterIndicator} />
          <Text style={styles.filterText}>Showing barangays within 15km radius</Text>
        </View>
      </Section>

      <Section title="Nearby Projects">
        {highlightedForms.map((form) => (
          <View key={form.id} style={styles.nearbyCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nearbyTitle}>{form.nameOfProject}</Text>
              <Text style={styles.nearbySubtitle}>
                {form.locationBarangay}, {form.locationMunicipality}
              </Text>
              <Text style={styles.nearbyMeta}>Last updated {new Date(form.updatedAt).toLocaleDateString()}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#2c3a57',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 1,
    borderColor: '#e6eaf3',
  },
  mapHeader: {
    gap: spacing.xs,
  },
  mapLabel: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  mapSubtitle: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    lineHeight: 20,
  },
  mapPlaceholder: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapPlaceholderText: {
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  mapButton: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    backgroundColor: '#e0e8fb',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  mapButtonText: {
    fontFamily: fonts.semibold,
    color: colors.primary,
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
    backgroundColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  nearbyCard: {
    borderWidth: 1,
    borderColor: '#e3e7ef',
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  nearbyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  nearbySubtitle: {
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    marginTop: 4,
  },
  nearbyMeta: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
});
