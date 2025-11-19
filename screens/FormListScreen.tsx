import { FilterBottomSheet } from '@/components/FilterBottomSheet';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { annexForms } from '@/constants/annexes';
import { dummyProjects, ProjectRecord } from '@/constants/forms';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, FormStatus, spacing } from '@/theme';
import { ValidationForm } from '@/types/forms';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const filters: ('All' | FormStatus)[] = ['All', 'Draft', 'Pending Sync', 'Synced', 'Error'];

export function FormListScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { colors, mode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const filterSnapPoints = useMemo(() => ["50%", "70%"], []);

  const openFilters = () => {
    bottomSheetRef.current?.present();
  };

  const projects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return dummyProjects
      .map((project) => {
        const matchingForms = project.forms.filter((form) => {
          const matchesStatus = activeFilter === 'All' || form.status === activeFilter;
          const matchesQuery =
            !query ||
            [project.name, project.locationBarangay, project.locationMunicipality, form.annexTitle]
              .join(' ')
              .toLowerCase()
              .includes(query) ||
            form.data.nameOfProject.toLowerCase().includes(query);
          return matchesStatus && matchesQuery;
        });
        if (!matchingForms.length) return null;
        return { ...project, forms: matchingForms };
      })
      .filter(Boolean) as ProjectRecord[];
  }, [activeFilter, searchQuery]);

  const handleFormPress = (form: ValidationForm, annexTitle = 'Annex C – Validation Form') => {
    router.push({
      pathname: '/form-detail',
      params: { form: JSON.stringify(form), annex: annexTitle },
    });
  };

  const fabBottomInset = spacing.lg + insets.bottom;
  const listBottomSpacer = spacing.lg * 2;

  return (
    <>
      <Screen style={{ paddingBottom: spacing.xxl }}>
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
          contentContainerStyle={[styles.listContent, { paddingBottom: listBottomSpacer }]}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: spacing.md }} />}
          renderItem={({ item }) => {
            const primaryForm = item.forms[0];
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
                onPress={() => handleFormPress(primaryForm.data, primaryForm.annexTitle)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.name}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="pin" size={14} color={colors.textMuted} />
                      <Text style={[styles.locationText, { color: colors.textMuted }]}>
                        {item.locationBarangay}, {item.locationMunicipality}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={primaryForm.status} />
                </View>

                <View style={styles.cardMetaRow}>
                  <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.metaPillLabel, { color: colors.textMuted }]}>Barangay</Text>
                    <Text style={[styles.metaPillValue, { color: colors.textPrimary }]}>{item.locationBarangay}</Text>
                  </View>
                  <View style={[styles.metaPill, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.metaPillLabel, { color: colors.textMuted }]}>Municipality</Text>
                    <Text style={[styles.metaPillValue, { color: colors.textPrimary }]}>{item.locationMunicipality}</Text>
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
                                onPress={() => handleFormPress(instance.data, annex.title)}
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
  listContent: {
    paddingBottom: 120,
  },
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
});
