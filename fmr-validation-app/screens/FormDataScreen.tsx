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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

  const detailRow = (icon: string, label: string, value?: string) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIconContainer}>
        <Ionicons name={icon as any} size={14} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <Screen scroll applyTopInset={false}>
      {/* Premium Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary + 'DD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="document-text" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {form.nameOfProject || 'Validation Form'}
            </Text>
            {location ? (
              <View style={styles.headerMetaRow}>
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={styles.headerMeta}>{location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.headerBadgeRow}>
          <StatusBadge status={formStatus} />
          <View style={styles.timestampPill}>
            <Ionicons name="time-outline" size={12} color="#fff" />
            <Text style={styles.timestampText}>
              {new Date(formUpdatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Annex Tag */}
      <View style={[styles.annexBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="bookmark" size={16} color={colors.primary} />
        <Text style={[styles.annexBannerText, { color: colors.textPrimary }]}>{annexTitle}</Text>
      </View>

      {/* Header / Basic Info */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Header / Basic Info</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('calendar-outline', 'Validation Date', form.validationDate)}
          {detailRow('map-outline', 'District', form.district)}
          {detailRow('document-text-outline', 'Name of Project', form.nameOfProject)}
          {detailRow('layers-outline', 'Type of Project', form.typeOfProject)}
          {detailRow('person-outline', 'Proponent', form.proponent)}
        </View>
      </View>

      {/* Location */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Location</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('navigate-outline', 'Barangay', form.locationBarangay)}
          {detailRow('business-outline', 'Municipality', form.locationMunicipality)}
          {detailRow('map-outline', 'Province', form.locationProvince)}
        </View>
      </View>

      {/* Scope, Cost & Length */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="construct" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Scope, Cost & Length</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('hammer-outline', 'Scope of Works', form.scopeOfWorks)}
          {detailRow('cash-outline', 'Estimated Cost (₱)', form.estimatedCost)}
          {detailRow('resize-outline', 'Length (Linear meters)', form.estimatedLengthLinear)}
          {detailRow('swap-horizontal-outline', 'Width (m)', form.estimatedLengthWidth)}
          {detailRow('swap-vertical-outline', 'Thickness (m)', form.estimatedLengthThickness)}
        </View>
      </View>

      {/* Project Link */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="link" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Project Link</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('chatbox-outline', 'Narrative', form.projectLinkNarrative)}
          {detailRow('storefront-outline', 'Public Market Name', form.publicMarketName)}
          {detailRow('speedometer-outline', 'Distance (km)', form.distanceKm)}
        </View>
      </View>

      {/* Agricultural Commodities & Area */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="leaf" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Agricultural Commodities & Area</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('nutrition-outline', 'Commodities', form.agriCommodities)}
          {detailRow('expand-outline', 'Area (Hectares)', form.areaHectares)}
        </View>
      </View>

      {/* Beneficiaries & Road Condition */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Beneficiaries & Road Condition</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('people-outline', 'No. of Farmers', form.numFarmers)}
          {detailRow('trail-sign-outline', 'Road Remarks', form.roadRemarks)}
        </View>
      </View>

      {/* Barangays Covered & Coordinates */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="compass" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Barangays Covered & Coordinates</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('location-outline', 'Barangays Covered', form.barangaysCovered)}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.sectionHeader}>
            <Ionicons name="radio-button-on" size={16} color={colors.primary} />
            <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>Start Coordinates</Text>
          </View>
          {detailRow('compass-outline', 'Latitude (DMS)', form.startLatDMS)}
          {detailRow('compass-outline', 'Longitude (DMS)', form.startLonDMS)}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.sectionHeader}>
            <Ionicons name="radio-button-off" size={16} color={colors.primary} />
            <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>End Coordinates</Text>
          </View>
          {detailRow('compass-outline', 'Latitude (DMS)', form.endLatDMS)}
          {detailRow('compass-outline', 'Longitude (DMS)', form.endLonDMS)}
        </View>
      </View>

      {/* Signatories */}
      <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="create" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Signatories</Text>
        </View>
        <View style={styles.cardContent}>
          {detailRow('pencil-outline', 'Prepared By', `${form.preparedByName}${form.preparedByDesignation ? ` (${form.preparedByDesignation})` : ''}`)}
          {detailRow('checkmark-circle-outline', 'Recommended By', form.recommendedByName)}
          {detailRow('eye-outline', 'Noted By', form.notedByName)}
        </View>
      </View>
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
  gradientHeader: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#fff',
    lineHeight: 26,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  headerMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  timestampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  timestampText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#fff',
  },
  annexBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  annexBannerText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  premiumCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionHeaderText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
