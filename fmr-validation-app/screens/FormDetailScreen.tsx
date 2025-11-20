import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { AttachmentSheet } from '@/components/AttachmentSheet';
import { SectionDivider } from '@/components/SectionDivider';
import { fonts, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttachmentPayload, FormRecord, FormRoutePayload, ProjectRecord, ValidationForm } from '@/types/forms';
import { useThemeColors } from '@/providers/ThemeProvider';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';

export function FormDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { projects, standaloneDrafts, attachDraft, findProjectByCode } = useOfflineData();
  const params = useLocalSearchParams<{
    form?: string;
    annex?: string;
    record?: string;
    projectId?: string;
    formId?: string;
  }>();

  const normalizeProjectForDisplay = useCallback((project: ProjectRecord): ProjectRecord => {
    return {
      ...project,
      title: project.title || (project as any).name || 'Untitled FMR',
      barangay: project.barangay ?? (project as any).locationBarangay,
      municipality: project.municipality ?? (project as any).locationMunicipality,
      province: project.province ?? (project as any).locationProvince,
    };
  }, []);

  const findProjectByAnyId = useCallback(
    (id?: string) => {
      if (!id) return undefined;
      const needle = id.trim().toLowerCase();
      return projects.find((project) =>
        [project.id, project.projectCode, project.abemisId]
          .filter(Boolean)
          .some((value) => value?.toLowerCase() === needle),
      );
    },
    [projects],
  );

  const resolveSelectionFromProject = useCallback(() => {
    const projectId = (params.projectId as string | undefined) ?? undefined;
    const project = findProjectByAnyId(projectId);
    if (!project) return null;
    const normalized = normalizeProjectForDisplay(project);
    const formId = params.formId as string | undefined;
    const candidateForm = (formId && normalized.forms.find((f) => f.id === formId)) || normalized.forms[0];
    if (!candidateForm) return null;
    return { formRecord: candidateForm, project: normalized };
  }, [findProjectByAnyId, normalizeProjectForDisplay, params.formId, params.projectId]);

  const resolveSelectionFromStandalone = useCallback(() => {
    const formId = params.formId as string | undefined;
    if (!formId) return null;
    const draft = standaloneDrafts.find((f) => f.id === formId);
    return draft ? { formRecord: draft, project: undefined } : null;
  }, [params.formId, standaloneDrafts]);

  const resolveSelectionFromRecord = useCallback(() => {
    if (!params.record) return null;
    try {
      const parsed = JSON.parse(params.record as string) as FormRoutePayload;
      const project =
        findProjectByAnyId(parsed.meta.linkedProjectId) ??
        findProjectByAnyId(parsed.meta.projectCode) ??
        findProjectByAnyId(parsed.meta.abemisId);
      const normalized = project ? normalizeProjectForDisplay(project) : undefined;
      const formRecord: FormRecord = {
        id: parsed.meta.id,
        annexTitle: parsed.meta.annexTitle,
        status: parsed.meta.status,
        updatedAt: parsed.form.updatedAt,
        abemisId: parsed.meta.abemisId,
        qrReference: parsed.meta.qrReference,
        linkedProjectId: parsed.meta.linkedProjectId,
        data: parsed.form,
      };
      return { formRecord, project: normalized };
    } catch {
      return null;
    }
  }, [findProjectByAnyId, normalizeProjectForDisplay, params.record]);

  const resolveFallbackSelection = useCallback(() => {
    const firstProject = projects[0];
    if (firstProject?.forms?.length) {
      const normalized = normalizeProjectForDisplay(firstProject);
      return { formRecord: normalized.forms[0], project: normalized };
    }
    if (standaloneDrafts[0]) {
      return { formRecord: standaloneDrafts[0], project: undefined };
    }
    return null;
  }, [normalizeProjectForDisplay, projects, standaloneDrafts]);

  const emptyForm: ValidationForm = useMemo(
    () => ({
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
    }),
    [],
  );

  const initialSelection = useMemo(() => {
    return (
      resolveSelectionFromProject() ??
      resolveSelectionFromStandalone() ??
      resolveSelectionFromRecord() ??
      resolveFallbackSelection() ?? {
        formRecord: {
          id: 'fallback',
          annexTitle: params.annex ?? 'Annex C – Validation Form',
          status: 'Draft',
          updatedAt: emptyForm.updatedAt,
          abemisId: undefined,
          qrReference: undefined,
          linkedProjectId: undefined,
          data: emptyForm,
        } as FormRecord,
        project: undefined,
      }
    );
  }, [
    emptyForm,
    params.annex,
    resolveFallbackSelection,
    resolveSelectionFromProject,
    resolveSelectionFromRecord,
    resolveSelectionFromStandalone,
  ]);

  const [selection, setSelection] = useState(initialSelection);
  useEffect(() => {
    setSelection(initialSelection);
  }, [initialSelection]);

  const activeFormRecord = selection.formRecord;
  const activeProject = selection.project;

  const meta = useMemo(() => {
    return {
      id: activeFormRecord.id,
      annexTitle: activeFormRecord.annexTitle || params.annex || 'Annex C – Validation Form',
      status: activeFormRecord.status,
      linkedProjectId: activeProject?.id ?? activeFormRecord.linkedProjectId,
      linkedProjectTitle: activeProject?.title,
      projectCode: activeProject?.projectCode,
      abemisId: activeFormRecord.abemisId ?? activeProject?.abemisId,
      qrReference: activeFormRecord.qrReference ?? activeProject?.qrReference,
      barangay: activeProject?.barangay ?? activeFormRecord.data.locationBarangay,
      municipality: activeProject?.municipality ?? activeFormRecord.data.locationMunicipality,
      province: activeProject?.province ?? activeFormRecord.data.locationProvince,
      zone: activeProject?.zone,
    };
  }, [activeFormRecord, activeProject, params.annex]);

  const annexTitle = meta.annexTitle ?? 'Annex C – Validation Form';
  const projectForms = useMemo(() => activeProject?.forms ?? [], [activeProject]);
  const geotagImages = useMemo(() => activeProject?.geotags ?? [], [activeProject]);
  const handleSelectForm = (formId: string) => {
    const next = projectForms.find((f) => f.id === formId);
    if (next) {
      setSelection({ formRecord: next, project: activeProject });
    }
  };
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
    const normalizedProject = project ? normalizeProjectForDisplay(project) : activeProject;
    setSelection({
      formRecord: { ...updated, data: updated.data },
      project: normalizedProject,
    });
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

  const openFormData = (entry: FormRecord) => {
    const payload: FormRoutePayload = {
      form: entry.data,
      meta: {
        id: entry.id,
        annexTitle: entry.annexTitle,
        status: entry.status,
        linkedProjectId: activeProject?.id ?? entry.linkedProjectId,
        linkedProjectTitle: activeProject?.title,
        projectCode: activeProject?.projectCode,
        abemisId: entry.abemisId ?? activeProject?.abemisId,
        qrReference: entry.qrReference ?? activeProject?.qrReference,
        barangay: activeProject?.barangay ?? entry.data.locationBarangay,
        municipality: activeProject?.municipality ?? entry.data.locationMunicipality,
        province: activeProject?.province ?? entry.data.locationProvince,
        zone: activeProject?.zone,
      },
    };
    router.push({
      pathname: '/form-data',
      params: { record: JSON.stringify(payload) },
    });
  };

  return (
    <Screen scroll applyTopInset={false}>
      <View style={[styles.projectHeader, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Text style={[styles.projectTitle, { color: colors.textPrimary }]}>
            {activeProject?.title ?? 'Standalone Draft'}
          </Text>
          {activeProject ? (
            <Text style={[styles.projectMeta, { color: colors.textMuted }]}>
              {activeProject.barangay ?? '—'}, {activeProject.municipality ?? '—'}, {activeProject.province ?? '—'}
            </Text>
          ) : (
            <Text style={[styles.projectMeta, { color: colors.textMuted }]}>
              Draft not yet linked to a project
            </Text>
          )}
          <View style={styles.badgeRow}>
            <StatusBadge status={activeFormRecord.status} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Last updated {new Date(activeFormRecord.updatedAt).toLocaleString()}
            </Text>
          </View>
          <Text style={[styles.annexTag, { color: colors.textPrimary }]}>{annexTitle}</Text>
        </View>
      </View>

      {activeProject && (
      <View style={[styles.projectCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Project Details</Text>
        <View style={styles.projectGrid}>
          <SectionDivider label="Overview" />
          {detailRow('Project Code', activeProject.projectCode)}
            {detailRow('Type', activeProject.projectType)}
            {detailRow('Stage', activeProject.stage)}
            {detailRow('Status', activeProject.status)}
            {detailRow('Operating Unit', activeProject.operatingUnit)}
            {detailRow('Banner Program', activeProject.bannerProgram)}
            {detailRow('PREXC Program', activeProject.prexcProgram)}
            {detailRow('Sub Program', activeProject.subProgram)}
            {detailRow('Recipient Type', activeProject.recipientType)}
            {detailRow('Budget Process', activeProject.budgetProcess)}

            <SectionDivider label="Funding" />
            {detailRow('Year Funded', activeProject.yearFunded?.toString())}
            {detailRow('Allocated Amount', activeProject.allocatedAmount)}
            {detailRow('Beneficiary', activeProject.beneficiary ?? undefined)}

            <SectionDivider label="Location" />
            {detailRow('Region', activeProject.region)}
            {detailRow('Province', activeProject.province)}
            {detailRow('Municipality', activeProject.municipality)}
            {detailRow('Barangay', activeProject.barangay)}
            {detailRow('Latitude', activeProject.latitude)}
            {detailRow('Longitude', activeProject.longitude)}
          </View>
        </View>
      )}

      {geotagImages.length ? (
        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Geotag Photos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={260 + spacing.sm}
            decelerationRate="fast"
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {geotagImages.map((item) => (
              <View key={item.id} style={[styles.carouselItem, { borderColor: colors.border }]}>
                <Image
                  style={styles.geotagImage}
                  source={{ uri: item.url }}
                  contentFit="cover"
                  transition={200}
                />
                <View style={[styles.carouselMeta, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.photoName || 'Geotag'}
                  </Text>
                  <Text style={[styles.listSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.url}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {activeProject?.proposalDocuments?.length ? (
        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Proposal Documents</Text>
          <View style={{ gap: spacing.sm }}>
            {activeProject.proposalDocuments.map((doc) => (
              <View key={doc.id} style={[styles.listRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {doc.fileName}
                  </Text>
                  <Text style={[styles.listSubtitle, { color: colors.textMuted }]}>
                    {doc.category || 'Document'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.linkPill, { borderColor: colors.primary }]}
                  onPress={() => router.push({ pathname: '/form-data', params: { record: JSON.stringify({}) } })}
                  disabled
                >
                  <Text style={[styles.linkPillText, { color: colors.primary }]}>Open</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : null}

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

      {activeProject && projectForms.length > 0 && (
        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Attached Forms</Text>
          <View style={{ gap: spacing.sm }}>
            {projectForms.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.formChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: entry.id === activeFormRecord.id ? colors.surfaceMuted : colors.surface,
                  },
                ]}
                onPress={() => openFormData(entry)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formChipTitle, { color: colors.textPrimary }]}>{entry.annexTitle}</Text>
                  <Text style={[styles.formChipMeta, { color: colors.textMuted }]}>
                    {entry.data.nameOfProject || 'Untitled form'}
                  </Text>
                </View>
                <StatusBadge status={entry.status} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!activeProject && (
        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Draft</Text>
          <Text style={[styles.projectMeta, { color: colors.textMuted }]}>
            This standalone draft is not yet linked to an ABEMIS project.
          </Text>
          <TouchableOpacity
            style={[styles.viewFormButton, { borderColor: colors.primary, marginTop: spacing.sm }]}
            onPress={() => openFormData(activeFormRecord)}
          >
            <Text style={[styles.viewFormText, { color: colors.primary }]}>View Form Data</Text>
          </TouchableOpacity>
        </View>
      )}

      <AttachmentSheet ref={attachmentSheetRef} onAttach={handleAttachment} initialAbemisId={meta.abemisId} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    gap: spacing.xs,
  },
  projectHeader: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontFamily: fonts.regular,
  },
  annexTag: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  projectCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  projectTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  projectMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  projectGrid: {
    gap: spacing.sm,
  },
  viewFormButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewFormText: {
    fontFamily: fonts.semibold,
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
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  listRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  listSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  linkPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  linkPillText: {
    fontFamily: fonts.semibold,
  },
  carouselItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  geotagImage: {
    width: '100%',
    height: 210,
  },
  carouselMeta: {
    padding: spacing.sm,
    backgroundColor: '#f8fafc',
    gap: 4,
  },
  cardLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  formChip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  formChipTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  formChipMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
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
