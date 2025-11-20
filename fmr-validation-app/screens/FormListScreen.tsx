import { FilterBottomSheet } from '@/components/FilterBottomSheet';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { annexForms } from '@/constants/annexes';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { fonts, FormStatus, spacing } from '@/theme';
import { FormRecord, FormRoutePayload, ProjectRecord } from '@/types/forms';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const filters: ('All' | FormStatus)[] = ['All', 'Draft', 'Pending Sync', 'Synced', 'Error'];

type LegacyProjectRecord = ProjectRecord & {
  name?: string;
  locationBarangay?: string;
  locationMunicipality?: string;
  locationProvince?: string;
};

const normalizeProjectForDisplay = (project: ProjectRecord): ProjectRecord => {
  const legacy = project as LegacyProjectRecord;
  return {
    ...project,
    title: (project.title as unknown as string | undefined) ?? legacy.name ?? 'Untitled FMR',
    barangay: project.barangay ?? legacy.locationBarangay,
    municipality: project.municipality ?? legacy.locationMunicipality,
    province: project.province ?? legacy.locationProvince,
  };
};

export function FormListScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { colors, mode } = useThemeMode();
  const { loading, projects: cachedProjects, standaloneDrafts } = useOfflineData();
  const insets = useSafeAreaInsets();
  const filterSnapPoints = useMemo(() => ['50%', '70%'], []);

  const openFilters = () => {
    bottomSheetRef.current?.present();
  };

  const projects = useMemo<ProjectRecord[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    return cachedProjects
      .map((project) => {
        const normalizedProject = normalizeProjectForDisplay(project);
        const matchingForms = normalizedProject.forms.filter((form) => {
          const matchesStatus = activeFilter === 'All' || form.status === activeFilter;
          const haystack = [
            normalizedProject.title,
            normalizedProject.barangay ?? '',
            normalizedProject.municipality ?? '',
            normalizedProject.province ?? '',
            form.annexTitle,
            form.data.nameOfProject,
          ]
            .join(' ')
            .toLowerCase();
          const matchesQuery = !query || haystack.includes(query);
          return matchesStatus && matchesQuery;
        });
        if (!matchingForms.length) return null;
        return { ...normalizedProject, forms: matchingForms };
      })
      .filter(Boolean) as ProjectRecord[];
  }, [activeFilter, cachedProjects, searchQuery]);

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
  }, [activeFilter, searchQuery]);

  const handleNavigate = (entry: FormRecord, project?: ProjectRecord) => {
    const normalizedProject = project ? normalizeProjectForDisplay(project) : undefined;
    const payload: FormRoutePayload = {
      form: entry.data,
      meta: {
        id: entry.id,
        annexTitle: entry.annexTitle,
        status: entry.status,
        abemisId: entry.abemisId ?? normalizedProject?.abemisId,
        qrReference: entry.qrReference ?? normalizedProject?.qrReference,
        linkedProjectId: normalizedProject?.id ?? entry.linkedProjectId,
        linkedProjectTitle: normalizedProject?.title,
        projectCode: normalizedProject?.projectCode,
        barangay: normalizedProject?.barangay ?? entry.data.locationBarangay,
        municipality: normalizedProject?.municipality ?? entry.data.locationMunicipality,
        province: normalizedProject?.province ?? entry.data.locationProvince,
        zone: normalizedProject?.zone,
      },
    };
    router.push({
      pathname: '/form-detail',
      params: { record: JSON.stringify(payload) },
    });
  };

  const listBottomSpacer = (insets.bottom || spacing.lg) + spacing.xxl;

  return (
    <>
      <Screen>
        {loading && (
          <View style={[styles.loadingCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Preparing offline dataset…</Text>
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
              placeholder="Search project or location"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={openFilters}
          >
            <Ionicons name="options" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.list}
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={{ paddingTop: spacing.xl, paddingBottom: listBottomSpacer }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Standalone drafts</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Drafts waiting for QR or ABEMIS attachment.</Text>
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {filteredStandaloneDrafts.length === 0 ? (
                  <View style={[styles.emptyStandalone, { borderColor: colors.border }]}> 
                    <Ionicons name="document-outline" size={18} color={colors.textMuted} />
                    <Text style={[styles.emptyStandaloneText, { color: colors.textMuted }]}>No standalone drafts match the filter.</Text>
                  </View>
                ) : (
                  filteredStandaloneDrafts.map((draft) => (
                    <TouchableOpacity
                      key={draft.id}
                      style={[styles.standaloneCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
                      onPress={() => handleNavigate(draft)}
                    >
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <Text style={[styles.standaloneTitle, { color: colors.textPrimary }]}>{draft.data.nameOfProject}</Text>
                        <Text style={[styles.standaloneMeta, { color: colors.textMuted }]}>
                          {draft.data.locationBarangay}, {draft.data.locationMunicipality}
                        </Text>
                        <Text style={[styles.standaloneNote, { color: colors.textMuted }]}>
                          Updated {new Date(draft.updatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <StatusBadge status={draft.status} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const normalizedItem = normalizeProjectForDisplay(item);
            const primaryForm = normalizedItem.forms[0];
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

      </Screen>
      <FilterBottomSheet
        ref={bottomSheetRef}
        snapPoints={filterSnapPoints}
        activeFilter={activeFilter}
        onApply={(filter) => setActiveFilter(filter)}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
});
