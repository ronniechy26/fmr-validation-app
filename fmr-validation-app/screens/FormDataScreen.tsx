import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SectionDivider } from '@/components/SectionDivider';
import { StatusBadge } from '@/components/StatusBadge';
import { fonts, spacing, typography } from '@/theme';
import { FormRoutePayload, ValidationForm } from '@/types/forms';
import { useThemeColors } from '@/providers/ThemeProvider';

export function FormDataScreen() {
  const params = useLocalSearchParams<{ record?: string }>();
  const colors = useThemeColors();

  const recordParam = useMemo(() => {
    const raw = params.record;
    if (!raw) return null;
    const value = Array.isArray(raw) ? raw[0] : raw;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }, [params.record]);

  const payload = useMemo<FormRoutePayload>(() => {
    if (!recordParam) {
      Alert.alert('Missing data', 'No form data was provided.');
      return {
        form: fallbackForm(),
        meta: {
          id: 'fallback',
          annexTitle: 'Annex C – Validation Form',
          status: 'Draft',
        },
      };
    }
    try {
      return JSON.parse(recordParam) as FormRoutePayload;
    } catch {
      return {
        form: fallbackForm(),
        meta: {
          id: 'fallback',
          annexTitle: 'Annex C – Validation Form',
          status: 'Draft',
        },
      };
    }
  }, [params.record]);

  const form = payload.form;
  const annexTitle = payload.meta.annexTitle || 'Annex C – Validation Form';
  const formStatus = (payload.form as any).status ?? payload.meta.status ?? 'Draft';
  const formUpdatedAt = payload.form.updatedAt ?? new Date().toISOString();
  const location = [payload.meta.barangay, payload.meta.municipality, payload.meta.province]
    .filter(Boolean)
    .join(', ');

  const detailRow = (label: string, value?: string) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
    </View>
  );

  return (
    <Screen scroll applyTopInset={false}>
      <View style={[styles.headerCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
            {form.nameOfProject || 'Annex C Form'}
          </Text>
          {location ? (
            <Text style={[styles.locationText, { color: colors.textMuted }]}>{location}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            <StatusBadge status={formStatus} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Last updated {new Date(formUpdatedAt).toLocaleString()}
            </Text>
          </View>
          <Text style={[styles.annexTag, { color: colors.textPrimary }]}>{annexTitle}</Text>
        </View>
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
    </Screen>
  );
}

function fallbackForm(): ValidationForm {
  return {
    id: 'fallback',
    validationDate: '',
    district: '',
    nameOfProject: '',
    typeOfProject: 'FMR',
    proponent: '',
    locationBarangay: '',
    locationMunicipality: '',
    locationProvince: '',
    scopeOfWorks: '',
    estimatedCost: '',
    estimatedLengthLinear: '',
    estimatedLengthWidth: '',
    estimatedLengthThickness: '',
    projectLinkNarrative: '',
    publicMarketName: '',
    distanceKm: '',
    agriCommodities: '',
    areaHectares: '',
    numFarmers: '',
    roadRemarks: '',
    barangaysCovered: '',
    startLatDMS: '',
    startLonDMS: '',
    endLatDMS: '',
    endLonDMS: '',
    preparedByName: '',
    preparedByDesignation: '',
    recommendedByName: '',
    notedByName: '',
    status: 'Draft',
    updatedAt: new Date().toISOString(),
  };
}

const styles = StyleSheet.create({
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  formTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationText: {
    fontFamily: fonts.regular,
    fontSize: 13,
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
});
