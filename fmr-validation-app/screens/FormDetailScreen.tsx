import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { SectionDivider } from '@/components/SectionDivider';
import { AttachmentSheet } from '@/components/AttachmentSheet';
import { fonts, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AttachmentPayload, FormRecord, FormRoutePayload, ProjectRecord, ValidationForm } from '@/types/forms';
import { useThemeColors } from '@/providers/ThemeProvider';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { Image } from 'expo-image';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function FormDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { projects, standaloneDrafts, attachDraft, findProjectByCode } = useOfflineData();
  const attachmentSheetRef = useRef<BottomSheetModal>(null);
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
      const project = parsed.meta.linkedProjectId ? findProjectByAnyId(parsed.meta.linkedProjectId) : undefined;
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
    const fromParams = resolveSelectionFromProject();
    if (fromParams) return fromParams;
    const fromRecord = resolveSelectionFromRecord();
    if (fromRecord) return fromRecord;
    const fromStandalone = resolveSelectionFromStandalone();
    if (fromStandalone) return fromStandalone;
    return null;
  }, [resolveSelectionFromProject, resolveSelectionFromRecord, resolveSelectionFromStandalone]);

  const [selection, setSelection] = useState(initialSelection);
  useEffect(() => {
    setSelection(initialSelection);
  }, [initialSelection]);

  const activeFormRecord = selection?.formRecord;
  const activeProject = selection?.project;

  const meta = useMemo(() => {
    return {
      id: activeFormRecord?.id ?? '',
      annexTitle: activeFormRecord?.annexTitle || params.annex,
      status: activeFormRecord?.status,
      linkedProjectId: activeProject?.id ?? activeFormRecord?.linkedProjectId,
      linkedProjectTitle: activeProject?.title,
      projectCode: activeProject?.projectCode,
      abemisId: activeFormRecord?.abemisId ?? activeProject?.abemisId,
      qrReference: activeFormRecord?.qrReference ?? activeProject?.qrReference,
      barangay: activeProject?.barangay ?? activeFormRecord?.data.locationBarangay,
      municipality: activeProject?.municipality ?? activeFormRecord?.data.locationMunicipality,
      province: activeProject?.province ?? activeFormRecord?.data.locationProvince,
      zone: activeProject?.zone,
    };
  }, [activeFormRecord, activeProject, params.annex]);

  const annexTitle = meta.annexTitle ?? '';
  const projectForms = useMemo(() => activeProject?.forms ?? [], [activeProject]);
  const geotagImages = useMemo(() => activeProject?.geotags ?? [], [activeProject]);
  const handleSelectForm = (formId: string) => {
    const next = projectForms.find((f) => f.id === formId);
    if (next) {
      if (!activeProject) return;
      setSelection({ formRecord: next, project: activeProject as ProjectRecord });
    }
  };
  const openAttachmentSheet = () => {
    attachmentSheetRef.current?.present();
  };

  const handleAttachment = async (payload: AttachmentPayload) => {
    if (!activeFormRecord) {
      return { success: false, error: 'No draft selected.' };
    }
    const result = await attachDraft(activeFormRecord.id, payload);
    if (!result.record) {
      return { success: false, error: result.error ?? 'No matching FMR found for that reference.' };
    }
    const updated = result.record;
    const lookup =
      updated.linkedProjectId || updated.abemisId || updated.qrReference || activeProject?.id || activeProject?.projectCode;
    const project = lookup ? findProjectByCode(lookup) : undefined;
    const normalizedProject = project ? normalizeProjectForDisplay(project) : activeProject;
    setSelection({
      formRecord: { ...updated, data: updated.data },
      project: normalizedProject,
    });
    attachmentSheetRef.current?.dismiss();
    return { success: true, message: 'Draft attached.' };
  };

  const detailRow = (icon: string, label: string, value?: string) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIconContainer}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
      </View>
    </View>
  );

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
    const record = encodeURIComponent(JSON.stringify(payload));
    router.push({
      pathname: '/form-data',
      params: { record },
    });
  };

  if (!selection || !activeFormRecord) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No record selected</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Please select a form to view its details
          </Text>
        </View>
      </Screen>
    );
  }

  if (!activeProject) {
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
              <Ionicons name="document-text" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {activeFormRecord.data.nameOfProject || 'Standalone Draft'}
              </Text>
              <View style={styles.headerMetaRow}>
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={styles.headerMeta}>
                  {activeFormRecord.data.locationBarangay || '—'}, {activeFormRecord.data.locationMunicipality || '—'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerBadgeRow}>
            <StatusBadge status={activeFormRecord.status} />
            <View style={styles.timestampPill}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.timestampText}>
                {new Date(activeFormRecord.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Annex Tag */}
        <View style={[styles.annexBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="bookmark" size={16} color={colors.primary} />
          <Text style={[styles.annexBannerText, { color: colors.textPrimary }]}>{annexTitle || 'Standalone Draft'}</Text>
        </View>

        {/* Draft Details Card */}
        <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Draft Details</Text>
          </View>
          <View style={styles.cardContent}>
            {detailRow('document-text-outline', 'Annex', annexTitle || '—')}
            {detailRow('flag-outline', 'Status', activeFormRecord.status)}
            {detailRow('navigate-outline', 'Barangay', activeFormRecord.data.locationBarangay)}
            {detailRow('business-outline', 'Municipality', activeFormRecord.data.locationMunicipality)}
            {detailRow('map-outline', 'Province', activeFormRecord.data.locationProvince)}
          </View>
        </View>

        {/* View Form Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => openFormData(activeFormRecord)}
        >
          <Ionicons name="eye-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>View Form Data</Text>
        </TouchableOpacity>

        {/* Attachment Card */}
        <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="link" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Attach to FMR Project</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={[styles.infoBanner, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.infoBannerText, { color: colors.textMuted }]}>
                Link this standalone draft using a QR scan or ABEMIS ID to connect it with an existing project.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={openAttachmentSheet}
            >
              <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Scan QR or Enter ABEMIS ID</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AttachmentSheet
          ref={attachmentSheetRef}
          onAttach={handleAttachment}
          initialAbemisId={activeFormRecord.abemisId}
        />
      </Screen>
    );
  }

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
            <Ionicons name="folder-open" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {activeProject?.title ?? 'Standalone Draft'}
            </Text>
            {activeProject ? (
              <View style={styles.headerMetaRow}>
                <Ionicons name="location-outline" size={14} color="#fff" />
                <Text style={styles.headerMeta}>
                  {activeProject.barangay ?? '—'}, {activeProject.municipality ?? '—'}
                </Text>
              </View>
            ) : (
              <Text style={styles.headerMeta}>Draft not yet linked to a project</Text>
            )}
          </View>
        </View>

        <View style={styles.headerBadgeRow}>
          <StatusBadge status={activeFormRecord.status} />
          {activeProject?.zone && (
            <View style={styles.zonePill}>
              <Text style={styles.zonePillText}>{activeProject.zone}</Text>
            </View>
          )}
          <View style={styles.timestampPill}>
            <Ionicons name="time-outline" size={12} color="#fff" />
            <Text style={styles.timestampText}>
              {new Date(activeFormRecord.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Annex Tag */}
      <View style={[styles.annexBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="bookmark" size={16} color={colors.primary} />
        <Text style={[styles.annexBannerText, { color: colors.textPrimary }]}>{annexTitle}</Text>
      </View>

      {/* Project Details Card */}
      {activeProject && (
        <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="briefcase" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Project Details</Text>
          </View>
          <View style={styles.cardContent}>
            <SectionDivider label="Overview" />
            {detailRow('code-slash-outline', 'Project Code', activeProject.projectCode)}
            {detailRow('layers-outline', 'Type', activeProject.projectType)}
            {detailRow('trending-up-outline', 'Stage', activeProject.stage)}
            {detailRow('checkmark-circle-outline', 'Status', activeProject.status)}
            {detailRow('business-outline', 'Operating Unit', activeProject.operatingUnit)}
            {detailRow('ribbon-outline', 'Banner Program', activeProject.bannerProgram)}
            {detailRow('apps-outline', 'PREXC Program', activeProject.prexcProgram)}
            {detailRow('git-branch-outline', 'Sub Program', activeProject.subProgram)}
            {detailRow('people-outline', 'Recipient Type', activeProject.recipientType)}
            {detailRow('calculator-outline', 'Budget Process', activeProject.budgetProcess)}

            <SectionDivider label="Funding" />
            {detailRow('calendar-outline', 'Year Funded', activeProject.yearFunded?.toString())}
            {detailRow('cash-outline', 'Allocated Amount', activeProject.allocatedAmount)}
            {detailRow('person-outline', 'Beneficiary', activeProject.beneficiary ?? undefined)}

            <SectionDivider label="Location" />
            {detailRow('globe-outline', 'Region', activeProject.region)}
            {detailRow('map-outline', 'Province', activeProject.province)}
            {detailRow('business-outline', 'Municipality', activeProject.municipality)}
            {detailRow('navigate-outline', 'Barangay', activeProject.barangay)}
            {detailRow('compass-outline', 'Latitude', activeProject.latitude)}
            {detailRow('compass-outline', 'Longitude', activeProject.longitude)}
          </View>
        </View>
      )}

      {/* Geotag Photos */}
      {geotagImages.length > 0 && (
        <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="images" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Geotag Photos</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{geotagImages.length}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={280 + spacing.sm}
            decelerationRate="fast"
            contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
          >
            {geotagImages.map((item) => (
              <View key={item.id} style={[styles.geotagCard, { borderColor: colors.border }]}>
                <Image
                  style={styles.geotagImage}
                  source={{ uri: item.url }}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.geotagOverlay}
                >
                  <Text style={styles.geotagTitle} numberOfLines={1}>
                    {item.photoName || 'Geotag'}
                  </Text>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Proposal Documents */}
      {activeProject?.proposalDocuments?.length ? (
        <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="documents" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Proposal Documents</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{activeProject.proposalDocuments.length}</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            {activeProject.proposalDocuments.map((doc) => (
              <View key={doc.id} style={[styles.documentRow, { borderColor: colors.border }]}>
                <View style={[styles.documentIcon, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="document-text" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.documentTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {doc.fileName}
                  </Text>
                  <Text style={[styles.documentCategory, { color: colors.textMuted }]}>
                    {doc.category || 'Document'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: colors.surfaceMuted }]}
                  disabled
                >
                  <Ionicons name="download-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Attached Forms */}
      {activeProject && projectForms.length > 0 && (
        <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Attached Forms</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{projectForms.length}</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            {projectForms.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.formCard,
                  {
                    borderColor: entry.id === activeFormRecord.id ? colors.primary : colors.border,
                    backgroundColor: entry.id === activeFormRecord.id ? colors.surfaceMuted : colors.surface,
                  },
                ]}
                onPress={() => openFormData(entry)}
              >
                <View style={[styles.formIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="document-text" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formCardTitle, { color: colors.textPrimary }]}>{entry.annexTitle}</Text>
                  <Text style={[styles.formCardMeta, { color: colors.textMuted }]} numberOfLines={1}>
                    {entry.data.nameOfProject || 'Untitled form'}
                  </Text>
                </View>
                <StatusBadge status={entry.status} />
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 20,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
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
    width: 56,
    height: 56,
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
  zonePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  zonePillText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: '#fff',
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
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  countBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#fff',
  },
  cardContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
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
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  infoBannerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  geotagCard: {
    width: 280,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  geotagImage: {
    width: '100%',
    height: '100%',
  },
  geotagOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  geotagTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: '#fff',
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginBottom: 2,
  },
  documentCategory: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
  },
  formIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginBottom: 2,
  },
  formCardMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
