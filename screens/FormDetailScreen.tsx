import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SectionDivider } from '@/components/SectionDivider';
import { StatusBadge } from '@/components/StatusBadge';
import { fonts, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ValidationForm } from '@/types/forms';
import { dummyForms } from '@/constants/forms';
import { useThemeColors } from '@/providers/ThemeProvider';

export function FormDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ form?: string; annex?: string }>();
  const annexTitle =
    typeof params.annex === 'string' && params.annex.trim().length > 0 ? params.annex : 'Annex C – Validation Form';
  const form = useMemo<ValidationForm>(() => {
    if (params.form) {
      try {
        return JSON.parse(params.form as string) as ValidationForm;
      } catch {
        // fall back to sample data below
      }
    }
    return dummyForms[0];
  }, [params.form]);

  const detailRow = (label: string, value?: string) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
    </View>
  );

  return (
    <Screen scroll applyTopInset={false} style={{ paddingTop: spacing.md }}>
      <View style={styles.statusRow}>
        <StatusBadge status={form.status} />
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          Last updated {new Date(form.updatedAt).toLocaleString()}
        </Text>
        <Text style={[styles.annexTag, { color: colors.textPrimary }]}>{annexTitle}</Text>
      </View>

      <Section title="Header / Basic Info">
        {detailRow('Validation Date', form.validationDate)}
        {detailRow('District', form.district)}
        {detailRow('Name of Project', form.nameOfProject)}
        {detailRow('Type of Project', form.typeOfProject)}
        {detailRow('Proponent', form.proponent)}
      </Section>

      <Section title="Location">
        {detailRow('Barangay', form.locationBarangay)}
        {detailRow('Municipality', form.locationMunicipality)}
        {detailRow('Province', form.locationProvince)}
      </Section>

      <Section title="Scope, Cost & Length">
        {detailRow('Scope of Works', form.scopeOfWorks)}
        {detailRow('Estimated Cost (₱)', form.estimatedCost)}
        {detailRow('Length (Linear meters)', form.estimatedLengthLinear)}
        {detailRow('Width (m)', form.estimatedLengthWidth)}
        {detailRow('Thickness (m)', form.estimatedLengthThickness)}
      </Section>

      <Section title="Project Link">
        {detailRow('Narrative', form.projectLinkNarrative)}
        {detailRow('Public Market Name', form.publicMarketName)}
        {detailRow('Distance (km)', form.distanceKm)}
      </Section>

      <Section title="Agricultural Commodities & Area">
        {detailRow('Commodities', form.agriCommodities)}
        {detailRow('Area (Hectares)', form.areaHectares)}
      </Section>

      <Section title="Beneficiaries & Road Condition">
        {detailRow('No. of Farmers', form.numFarmers)}
        {detailRow('Road Remarks', form.roadRemarks)}
      </Section>

      <Section title="Barangays Covered & Coordinates">
        {detailRow('Barangays Covered', form.barangaysCovered)}
        <SectionDivider label="Start Coordinates" />
        {detailRow('Latitude (DMS)', form.startLatDMS)}
        {detailRow('Longitude (DMS)', form.startLonDMS)}
        <SectionDivider label="End Coordinates" />
        {detailRow('Latitude (DMS)', form.endLatDMS)}
        {detailRow('Longitude (DMS)', form.endLonDMS)}
      </Section>

      <Section title="Signatories">
        {detailRow('Prepared By', `${form.preparedByName} (${form.preparedByDesignation})`)}
        {detailRow('Recommended By', form.recommendedByName)}
        {detailRow('Noted By', form.notedByName)}
      </Section>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: colors.primary }]}
        onPress={() =>
          router.push({
            pathname: '/form-editor',
            params: { form: JSON.stringify(form) },
          })
        }
      >
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    gap: spacing.xs,
  },
  metaText: {
    fontFamily: fonts.regular,
  },
  annexTag: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.label,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  editButton: {
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  editText: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
});
