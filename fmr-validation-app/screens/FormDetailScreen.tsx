import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SectionDivider } from '@/components/SectionDivider';
import { StatusBadge } from '@/components/StatusBadge';
import { AttachmentSheet } from '@/components/AttachmentSheet';
import { fonts, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttachmentPayload, FormRecord, FormRoutePayload, ValidationForm } from '@/types/forms';
import { useThemeColors } from '@/providers/ThemeProvider';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export function FormDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { projects, standaloneDrafts, attachDraft, findProjectByCode } = useOfflineData();
  const params = useLocalSearchParams<{ form?: string; annex?: string; record?: string }>();

  const pickFirstForm = useCallback((): FormRoutePayload | null => {
    const projectForm = projects[0]?.forms?.[0];
    if (projectForm) {
      return {
        form: projectForm.data,
        meta: {
          id: projectForm.id,
          annexTitle: projectForm.annexTitle,
          status: projectForm.status,
          linkedProjectId: projectForm.linkedProjectId,
          linkedProjectTitle: projects[0]?.title,
          projectCode: projects[0]?.projectCode,
          barangay: projects[0]?.barangay,
          municipality: projects[0]?.municipality,
          province: projects[0]?.province,
          zone: projects[0]?.zone,
        },
      };
    }
    const standalone = standaloneDrafts[0];
    if (standalone) {
      return {
        form: standalone.data,
        meta: {
          id: standalone.id,
          annexTitle: standalone.annexTitle,
          status: standalone.status,
        },
      };
    }
    return null;
  }, [projects, standaloneDrafts]);

  const payload = useMemo<FormRoutePayload>(() => {
    if (params.record) {
      try {
        return JSON.parse(params.record as string) as FormRoutePayload;
      } catch {
        return pickFirstForm() ?? {
          form: {
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
          },
          meta: {
            id: 'fallback',
            annexTitle: params.annex ?? 'Annex C – Validation Form',
            status: 'Draft',
          },
        };
      }
    }
    if (params.form) {
      try {
        const parsed = JSON.parse(params.form as string) as ValidationForm;
        return {
          form: parsed,
          meta: {
            id: parsed.id,
            annexTitle: params.annex ?? 'Annex C – Validation Form',
            status: parsed.status,
          },
        };
      } catch {
        const fallback = pickFirstForm();
        if (fallback) return fallback;
        throw new Error('No form available');
      }
    }
    const fallback = pickFirstForm();
    if (fallback) {
      return fallback;
    }
    return {
      form: {
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
      },
      meta: {
        id: 'fallback',
        annexTitle: params.annex ?? 'Annex C – Validation Form',
        status: 'Draft',
      },
    };
  }, [params.record, params.form, pickFirstForm]);

  const [meta, setMeta] = useState(payload.meta);
  useEffect(() => {
    setMeta(payload.meta);
  }, [payload.meta]);
  const annexTitle = meta.annexTitle || 'Annex C – Validation Form';
  const form = payload.form;
  const attachmentSheetRef = useRef<BottomSheetModal>(null);

  const detailRow = (label: string, value?: string) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
    </View>
  );

  const openAttachmentSheet = () => {
    attachmentSheetRef.current?.present();
  };

  const handleAttachment = async (payload: AttachmentPayload) => {
    const result = await attachDraft(meta.id, payload);
    if (!result.record) {
      Alert.alert('Not found', 'No FMR project matches that ABEMIS ID or QR reference.');
      return;
    }
    const updated = result.record;
    const lookupCode = updated.qrReference ?? updated.abemisId ?? updated.linkedProjectId ?? '';
    const project = updated.linkedProjectId ? findProjectByCode(lookupCode) : undefined;
    setMeta((prev) => ({
      ...prev,
      linkedProjectId: updated.linkedProjectId,
      linkedProjectTitle: project?.title ?? prev.linkedProjectTitle,
      projectCode: project?.projectCode ?? prev.projectCode,
      abemisId: updated.abemisId,
      qrReference: updated.qrReference,
      barangay: project?.barangay ?? prev.barangay,
      municipality: project?.municipality ?? prev.municipality,
      province: project?.province ?? prev.province,
      zone: project?.zone ?? prev.zone,
    }));
    attachmentSheetRef.current?.dismiss();
    Alert.alert(
      result.synced ? 'Attached' : 'Attached offline',
      result.synced
        ? project
          ? `Draft linked to ${project.title}.`
          : 'Draft updated and synced.'
        : 'Draft linked locally. It will sync once you are online and signed in.',
    );
  };

  const attachmentCtaLabel = meta.linkedProjectId ? 'Reattach' : 'Attach to FMR';
  const attachmentDescription = meta.linkedProjectTitle
    ? `Linked to ${meta.linkedProjectTitle}${meta.abemisId ? ` (${meta.abemisId})` : ''}`
    : 'This draft is not tied to an ABEMIS record yet.';

  return (
    <Screen scroll applyTopInset={false}>
      <View style={styles.statusRow}>
        <StatusBadge status={form.status} />
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          Last updated {new Date(form.updatedAt).toLocaleString()}
        </Text>
        <Text style={[styles.annexTag, { color: colors.textPrimary }]}>{annexTitle}</Text>
      </View>

      <View style={[styles.attachmentCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={[styles.attachmentTitle, { color: colors.textPrimary }]}>Attachment</Text>
          <Text style={[styles.attachmentDescription, { color: colors.textMuted }]}>{attachmentDescription}</Text>
          {!!meta.barangay && !!meta.municipality && (
            <Text style={[styles.attachmentLocation, { color: colors.textMuted }]}>
              {meta.barangay}, {meta.municipality}
            </Text>
          )}
        </View>
        <TouchableOpacity style={[styles.attachmentButton, { borderColor: colors.primary }]} onPress={openAttachmentSheet}>
          <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>{attachmentCtaLabel}</Text>
        </TouchableOpacity>
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

      <AttachmentSheet ref={attachmentSheetRef} onAttach={handleAttachment} initialAbemisId={meta.abemisId} />
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
  attachmentCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  attachmentTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  attachmentDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  attachmentLocation: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  attachmentButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  attachmentButtonText: {
    fontFamily: fonts.semibold,
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
