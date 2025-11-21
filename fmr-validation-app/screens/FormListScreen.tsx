import { FilterBottomSheet } from '@/components/FilterBottomSheet';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { annexForms } from '@/constants/annexes';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { fonts, spacing } from '@/theme';
import { FormRecord, FormRoutePayload, ProjectRecord } from '@/types/forms';
import { FormStatus } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FlashList } from '@shopify/flash-list';

const filters: ('All' | FormStatus)[] = ['All', 'Draft', 'Pending Sync', 'Synced', 'Error'];

type LegacyProjectRecord = ProjectRecord & {
  name?: string;
  locationBarangay?: string;
  locationMunicipality?: string;
  locationProvince?: string;
};

function normalizeProjectForDisplay(project: ProjectRecord): ProjectRecord {
  const legacy = project as LegacyProjectRecord;
  return {
    ...project,
    title: (project.title as unknown as string | undefined) ?? legacy.name ?? 'Untitled FMR',
    barangay: project.barangay ?? legacy.locationBarangay,
    municipality: project.municipality ?? legacy.locationMunicipality,
    province: project.province ?? legacy.locationProvince,
  };
}

export function FormListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projects' | 'drafts'>('projects');
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [keyFilter, setKeyFilter] = useState<'all' | 'withForms' | 'withoutForms' | 'withGeotags' | 'withDocs'>('all');
  const [regionFilter, setRegionFilter] = useState<{ region?: string; province?: string; municipality?: string }>({});
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const { colors, mode } = useThemeMode();
  const { loading, projects: cachedProjects, standaloneDrafts, deleteDraft } = useOfflineData();
  const insets = useSafeAreaInsets();
  const [deleteTarget, setDeleteTarget] = useState<FormRecord | null>(null);
  const [deleteInFlight, setDeleteInFlight] = useState(false);
  const filterSnapPoints = useMemo(() => ['50%', '70%', '90%'], []);
  const PAGE_SIZE = 20;

  const openFilters = () => {
    bottomSheetRef.current?.present();
  };

  const normalizedProjects = useMemo(() => cachedProjects.map(normalizeProjectForDisplay), [cachedProjects]);

  const searchPlaceholder =
    activeTab === 'projects'
      ? 'Search by project, ABEMIS ID, code, or location'
      : 'Search standalone drafts by name or location';

  const searchableFields = (project: ProjectRecord) =>
    [
      project.title,
      project.barangay,
      project.municipality,
      project.province,
      project.abemisId,
      project.projectCode,
    ]
      .filter(Boolean)
      .map((value) => (value ?? '').toString().toLowerCase());

  const filteredProjects = useMemo<ProjectRecord[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    return normalizedProjects.filter((project) => {
      const matchesQuery = query
        ? searchableFields(project).some((value) => value.includes(query))
        : true;
      const matchesStatus =
        activeFilter === 'All' ||
        project.forms.some((form) => form.status === activeFilter);
      const hasForms = (project.forms?.length ?? 0) > 0;
      const hasGeotags = (project.geotags?.length ?? 0) > 0;
      const hasDocs = (project.proposalDocuments?.length ?? 0) > 0;
      const matchesKey =
        keyFilter === 'all' ||
        (keyFilter === 'withForms' && hasForms) ||
        (keyFilter === 'withoutForms' && !hasForms) ||
        (keyFilter === 'withGeotags' && hasGeotags) ||
        (keyFilter === 'withDocs' && hasDocs);
      const matchesRegion =
        (!regionFilter.region ||
          (project.region ?? '').toLowerCase().includes(regionFilter.region.toLowerCase())) &&
        (!regionFilter.province ||
          (project.province ?? '').toLowerCase().includes(regionFilter.province.toLowerCase())) &&
        (!regionFilter.municipality ||
          (project.municipality ?? '')
            .toLowerCase()
            .includes(regionFilter.municipality.toLowerCase()));
      return matchesQuery && matchesStatus && matchesKey && matchesRegion;
    });
  }, [activeFilter, keyFilter, normalizedProjects, regionFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery, cachedProjects, keyFilter, regionFilter, activeTab]);

  useEffect(() => {
    if (!loading) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, pulseAnim]);

  const projects = useMemo<ProjectRecord[]>(() => {
    const sorted = [...filteredProjects].sort((a, b) => {
      const resolveTimestamp = (project: ProjectRecord) => {
        const raw =
          project.forms[0]?.updatedAt ??
          (project.forms[0]?.data as any)?.updatedAt ??
          project.title ??
          '';
        return new Date(raw).getTime() || 0;
      };
      return resolveTimestamp(b) - resolveTimestamp(a);
    });
    return sorted.slice(0, page * PAGE_SIZE);
  }, [filteredProjects, page]);

  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          normalizedProjects
            .map((project) => project.region?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [normalizedProjects],
  );

  const provinceOptions = useMemo(() => {
    const source = regionFilter.region
      ? normalizedProjects.filter(
        (project) =>
          project.region?.toLowerCase() === regionFilter.region?.toLowerCase(),
      )
      : normalizedProjects;
    return Array.from(
      new Set(
        source
          .map((project) => project.province?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [normalizedProjects, regionFilter.region]);

  const municipalityOptions = useMemo(() => {
    const source = regionFilter.province
      ? normalizedProjects.filter(
        (project) =>
          project.province?.toLowerCase() ===
          regionFilter.province?.toLowerCase(),
      )
      : normalizedProjects;
    return Array.from(
      new Set(
        source
          .map((project) => project.municipality?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [normalizedProjects, regionFilter.province]);

  const locationOptions = useMemo(
    () =>
      normalizedProjects.map((project) => ({
        region: project.region,
        province: project.province,
        municipality: project.municipality,
      })),
    [normalizedProjects],
  );

  const buildFallbackForm = (project: ProjectRecord): FormRecord => {
    const now = new Date().toISOString();
    return {
      id: project.id ?? `project-${now}`,
      annexTitle: 'Annex C – Validation Form',
      status: 'Draft',
      updatedAt: now,
      abemisId: project.abemisId,
      qrReference: project.qrReference,
      linkedProjectId: project.id,
      data: {
        id: project.id ?? `project-${now}`,
        validationDate: '',
        district: project.district ?? '',
        nameOfProject: project.title ?? 'Untitled FMR',
        typeOfProject: project.projectType ?? 'FMR',
        proponent: project.beneficiary ?? '',
        locationBarangay: project.barangay ?? '',
        locationMunicipality: project.municipality ?? '',
        locationProvince: project.province ?? '',
        scopeOfWorks: '',
        estimatedCost: project.allocatedAmount ?? '',
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
        updatedAt: now,
      },
    };
  };

  const filteredStandaloneDrafts = useMemo<FormRecord[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    return standaloneDrafts.filter((draft) => {
      const matchesStatus = activeFilter === 'All' || draft.status === activeFilter;
      const haystack = [
        draft.data.nameOfProject,
        draft.data.locationBarangay,
        draft.data.locationMunicipality,
        draft.annexTitle,
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [activeFilter, searchQuery, standaloneDrafts]);

  const handleNavigate = (entry: FormRecord | undefined, project?: ProjectRecord) => {
    const normalizedProject = project ? normalizeProjectForDisplay(project) : undefined;
    const formRecord: FormRecord =
      entry ??
      ({
        id: normalizedProject?.id ?? `draft-${Date.now()}`,
        annexTitle: 'Annex C – Validation Form',
        status: 'Draft',
        updatedAt: new Date().toISOString(),
        abemisId: normalizedProject?.abemisId,
        qrReference: normalizedProject?.qrReference,
        linkedProjectId: normalizedProject?.id,
        data: {
          id: normalizedProject?.id ?? `draft-${Date.now()}`,
          validationDate: '',
          district: normalizedProject?.district ?? '',
          nameOfProject: normalizedProject?.title ?? 'Untitled FMR',
          typeOfProject: normalizedProject?.projectType ?? 'FMR',
          proponent: normalizedProject?.beneficiary ?? '',
          locationBarangay: normalizedProject?.barangay ?? '',
          locationMunicipality: normalizedProject?.municipality ?? '',
          locationProvince: normalizedProject?.province ?? '',
          scopeOfWorks: '',
          estimatedCost: normalizedProject?.allocatedAmount ?? '',
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
      } as FormRecord);

    const normalizedFormProject = normalizedProject ?? (formRecord.linkedProjectId ? project : undefined);
    const payload: FormRoutePayload = {
      form: formRecord.data,
      meta: {
        id: formRecord.id,
        annexTitle: formRecord.annexTitle,
        status: formRecord.status,
        abemisId: formRecord.abemisId ?? normalizedFormProject?.abemisId,
        qrReference: formRecord.qrReference ?? normalizedFormProject?.qrReference,
        linkedProjectId: normalizedFormProject?.id ?? formRecord.linkedProjectId,
        linkedProjectTitle: normalizedFormProject?.title,
        projectCode: normalizedFormProject?.projectCode,
        barangay: normalizedFormProject?.barangay ?? formRecord.data.locationBarangay,
        municipality: normalizedFormProject?.municipality ?? formRecord.data.locationMunicipality,
        province: normalizedFormProject?.province ?? formRecord.data.locationProvince,
        zone: normalizedFormProject?.zone,
      },
    };
    router.push({
      pathname: '/form-detail',
      params: {
        record: JSON.stringify(payload),
        projectId: normalizedFormProject?.id,
        formId: formRecord.id,
      },
    });
  };

  const listBottomSpacer = (insets.bottom || spacing.lg) + spacing.xxl;
  const filterDisabled = activeTab === 'drafts';
  const loadMore = () => {
    if (activeTab !== 'projects') return;
    if (projects.length < filteredProjects.length) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <>
      <Screen noBottomPadding>
        {loading && (
          <View style={[styles.loadingCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Preparing offline dataset…</Text>
            <View style={styles.loadingRow}>
              <Animated.View
                style={[
                  styles.pulseDot,
                  {
                    backgroundColor: colors.success ?? '#16a34a',
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.3],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.6],
                    }),
                  },
                ]}
              />
              <Text style={[styles.pulseText, { color: colors.textPrimary }]}>Syncing data</Text>
            </View>
          </View>
        )}
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
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.avatar, { backgroundColor: colors.primary, borderColor: colors.secondary }]}
          >
            <Text style={styles.avatarText}>MP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
              <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterToggle,
              { borderColor: colors.border, backgroundColor: colors.surface },
              filterDisabled ? { opacity: 0.5 } : null,
            ]}
            onPress={filterDisabled ? undefined : openFilters}
            disabled={filterDisabled}
          >
            <Ionicons name="options" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.tabRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {[
            { key: 'projects', label: 'FMR Projects' },
            { key: 'drafts', label: 'Standalone Drafts' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setActiveTab(tab.key as typeof activeTab)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: isActive ? '#fff' : colors.textPrimary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'projects' ? (
          <FlashList
            data={projects}
            estimatedItemSize={260}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: (insets.bottom || spacing.md) + 40 }]}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={<View style={{ height: spacing.md }} />}
            renderItem={({ item }) => {
              const normalizedItem = normalizeProjectForDisplay(item);
              const primaryForm = normalizedItem.forms[0] ?? buildFallbackForm(normalizedItem);
              return (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: mode === 'dark' ? '#000' : '#2c3a57',
                    },
                  ]}
                  onPress={() => handleNavigate(primaryForm, normalizedItem)}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                        {normalizedItem.title || 'Untitled FMR'}
                      </Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="pin" size={14} color={colors.textMuted} />
                        <Text style={[styles.locationText, { color: colors.textMuted }]}>
                          {normalizedItem.barangay ?? '—'}, {normalizedItem.municipality ?? '—'}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge status={primaryForm.status} />
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
                      <Text style={[styles.metaPillLabel, { color: colors.textMuted }]}>Barangay</Text>
                      <Text style={[styles.metaPillValue, { color: colors.textPrimary }]}>
                        {normalizedItem.barangay ?? '—'}
                      </Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
                      <Text style={[styles.metaPillLabel, { color: colors.textMuted }]}>Municipality</Text>
                      <Text style={[styles.metaPillValue, { color: colors.textPrimary }]}>
                        {normalizedItem.municipality ?? '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      Last form updated {new Date(primaryForm.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.formsRow}>
                    <Text style={[styles.formsLabel, { color: colors.textMuted }]}>Forms</Text>
                    <View style={styles.formsList}>
                      {annexForms.map((annex) => {
                        const instances = item.forms.filter((form) => form.annexTitle === annex.title);
                        if (!instances.length) {
                          return (
                            <View key={annex.id} style={[styles.formButton, { backgroundColor: colors.surfaceMuted }]}>
                              <Text style={[styles.formButtonText, { color: colors.textMuted }]}>{annex.title}</Text>
                            </View>
                          );
                        }
                        return (
                          <View key={annex.id} style={styles.formGroup}>
                            <Text style={[styles.formGroupLabel, { color: colors.textMuted }]}>{annex.title}</Text>
                            <View style={styles.formInstances}>
                              {instances.map((instance, index) => (
                                <TouchableOpacity
                                  key={instance.id}
                                  style={[styles.formButton, { backgroundColor: colors.primary }]}
                                  onPress={() => handleNavigate(instance, item)}
                                >
                                  <Text style={[styles.formButtonText, { color: '#fff' }]}>Form #{index + 1}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <FlashList
            data={filteredStandaloneDrafts}
            estimatedItemSize={160}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: listBottomSpacer, gap: spacing.sm },
            ]}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[styles.emptyStandalone, { borderColor: colors.border }]}>
                <Ionicons name="document-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.emptyStandaloneText, { color: colors.textMuted }]}>
                  No standalone drafts match the filter.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.standaloneCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    shadowColor: mode === 'dark' ? '#000' : '#2c3a57',
                  },
                ]}
                onPress={() => handleNavigate(item)}
              >
                <View style={styles.standaloneHeader}>
                  <View style={styles.standaloneBadge}>
                    <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                    <Text style={[styles.standaloneBadgeText, { color: colors.primary }]}>
                      {item.annexTitle || 'Standalone draft'}
                    </Text>
                  </View>
                  <View style={styles.standaloneActions}>
                    <TouchableOpacity onPress={() => setDeleteTarget(item)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                    <StatusBadge status={item.status} />
                  </View>
                </View>

                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text style={[styles.standaloneTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.data.nameOfProject || 'Untitled validation'}
                  </Text>
                  <View style={styles.standaloneInfoRow}>
                    <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.standaloneNote, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.createdBy || 'Unknown creator'}
                    </Text>
                  </View>
                  <View style={styles.standaloneMetaRow}>
                    <Ionicons name="pin-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.standaloneMeta, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.data.locationBarangay || '—'}, {item.data.locationMunicipality || '—'}
                    </Text>
                  </View>
                  <View style={styles.standaloneInfoRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.standaloneNote, { color: colors.textMuted }]}>
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.standaloneInfoRow}>
                    <Ionicons name="qr-code-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.standaloneNote, { color: colors.textMuted }]}>
                      {item.qrReference || item.abemisId || 'Not attached'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

      </Screen>
      <FilterBottomSheet
        index={3}
        ref={bottomSheetRef}
        snapPoints={filterSnapPoints}
        activeFilter={activeFilter}
        activeKeyFilter={keyFilter}
        activeRegionFilter={regionFilter}
        locationOptions={locationOptions}
        onApply={(status, key, region) => {
          setActiveFilter(status);
          setKeyFilter(key);
          setRegionFilter(region);
        }}
      />

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Delete draft?"
        subtitle="This will remove the standalone draft from your offline cache."
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        loading={deleteInFlight}
        onConfirm={async () => {
          if (!deleteTarget || deleteInFlight) return;
          setDeleteInFlight(true);
          await deleteDraft(deleteTarget.id);
          setDeleteInFlight(false);
          setDeleteTarget(null);
        }}
      />
    </>
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
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  filterToggle: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.xs,
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {},
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
  formsRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  formsLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  formsList: {
    gap: spacing.xs,
  },
  formGroup: {
    gap: spacing.xs,
  },
  formGroupLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  formInstances: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  formButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  formButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  sheetSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  standaloneCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  standaloneTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  standaloneMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  standaloneNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  standaloneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  standaloneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#eef2fb',
  },
  standaloneBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  standaloneActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  standaloneMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  standaloneInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyStandalone: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyStandaloneText: {
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pulseText: {
    fontFamily: fonts.semibold,
  },
});
