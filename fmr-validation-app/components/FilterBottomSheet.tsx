import { FilterChip } from '@/components/FilterChip';
import { SheetBackdrop } from '@/components/SheetBackdrop';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { FormStatus } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ForwardedRef, forwardRef, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

type StatusFilter = 'All' | FormStatus;
type KeyFilter = 'all' | 'withForms' | 'withoutForms' | 'withGeotags' | 'withDocs';
type RegionFilter = { region?: string; province?: string; municipality?: string };

interface FilterBottomSheetProps {
  activeFilter: StatusFilter;
  activeKeyFilter: KeyFilter;
  activeRegionFilter?: RegionFilter;
  onApply: (filter: StatusFilter, keyFilter: KeyFilter, regionFilter: RegionFilter) => void;
  snapPoints: string[];
  locationOptions?: RegionFilter[];
  index?: number;
}

const statusFilters: StatusFilter[] = ['All', 'Draft', 'Pending Sync', 'Synced', 'Error'];
const keyFilters: { label: string; value: KeyFilter }[] = [
  { label: 'All projects', value: 'all' },
  { label: 'With forms', value: 'withForms' },
  { label: 'No forms', value: 'withoutForms' },
  { label: 'With geotags', value: 'withGeotags' },
  { label: 'With documents', value: 'withDocs' },
];

export const FilterBottomSheet = forwardRef(function FilterSheet(
  {
    activeFilter,
    activeKeyFilter,
    activeRegionFilter,
    onApply,
    snapPoints,
    locationOptions = [],
    index = 1,
  }: FilterBottomSheetProps,
  ref: ForwardedRef<BottomSheetModal>,
) {
  const { colors, mode } = useThemeMode();
  const accent = colors.primary;
  const heroTint = mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(31,75,143,0.08)';
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>(activeFilter);
  const [selectedKeyFilter, setSelectedKeyFilter] = useState<KeyFilter>(activeKeyFilter);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>({
    ...(activeRegionFilter ?? {}),
  });
  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          locationOptions
            .map((item) => item.region?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [locationOptions],
  );
  const provinceOptions = useMemo(() => {
    const source = selectedRegion.region
      ? locationOptions.filter(
        (item) =>
          item.region?.toLowerCase() === selectedRegion.region?.toLowerCase(),
      )
      : locationOptions;
    return Array.from(
      new Set(
        source
          .map((item) => item.province?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [locationOptions, selectedRegion.region]);
  const municipalityOptions = useMemo(() => {
    const source = selectedRegion.province
      ? locationOptions.filter(
        (item) =>
          item.province?.toLowerCase() ===
          selectedRegion.province?.toLowerCase(),
      )
      : locationOptions;
    return Array.from(
      new Set(
        source
          .map((item) => item.municipality?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [locationOptions, selectedRegion.province]);

  useEffect(() => {
    setSelectedFilter(activeFilter);
    setSelectedKeyFilter(activeKeyFilter);
    setSelectedRegion({ ...(activeRegionFilter ?? {}) });
  }, [activeFilter, activeKeyFilter, activeRegionFilter]);

  const statusHint = useMemo(() => {
    switch (selectedFilter) {
      case 'Draft':
        return 'Showing drafts still in progress';
      case 'Pending Sync':
        return 'Forms waiting to sync';
      case 'Synced':
        return 'Completed and synced forms';
      case 'Error':
        return 'Forms with sync issues';
      default:
        return 'Viewing all validation forms';
    }
  }, [selectedFilter]);

  const close = () => {
    if (!ref || typeof ref === 'function') return;
    ref.current?.dismiss();
  };

  const handleApply = () => {
    setIsLoading(true);
    setTimeout(() => {
      onApply(selectedFilter, selectedKeyFilter, selectedRegion);
      setIsLoading(false);
      close();
    }, 500);
  };

  const handleClear = () => {
    onApply('All', 'all', {});
    close();
  };

  const handleSelect = (filter: StatusFilter) => {
    setSelectedFilter(filter);
  };

  const handleRegionSelect = (field: keyof RegionFilter, value?: string) => {
    setSelectedRegion((prev) => {
      const next = { ...prev };
      if (field === 'region') {
        next.region = value;
        next.province = undefined;
        next.municipality = undefined;
      } else if (field === 'province') {
        next.province = value;
        next.municipality = undefined;
      } else {
        next.municipality = value;
      }
      return next;
    });
  };

  const renderDropdown = (
    label: string,
    options: (string | undefined)[],
    selected?: string,
    onSelect?: (value?: string) => void,
  ) => {
    const stringOptions = options.filter((opt): opt is string => Boolean(opt));
    const currentLabel = selected || 'Any';
    if (Platform.OS === 'android') {
      return (
        <View style={styles.dropdownWrapper}>
          <Text style={[styles.locationLabel, { color: colors.textMuted }]}>
            {label}
          </Text>

          <View
            style={[
              styles.pickerContainer,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Picker
              selectedValue={selected ?? ''}
              onValueChange={(value) => onSelect?.(value || undefined)}
              style={styles.picker}
              dropdownIconColor={colors.textMuted}
              mode="dropdown"
            >
              <Picker.Item label="Any" value="" />
              {stringOptions.map((opt) => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
          </View>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={[
          styles.iosPicker,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
        onPress={() =>
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Any', ...stringOptions, 'Cancel'],
              cancelButtonIndex: stringOptions.length + 1,
            },
            (index) => {
              if (index === 0) {
                onSelect?.(undefined);
              } else if (index > 0 && index <= stringOptions.length) {
                const choice = stringOptions[index - 1];
                onSelect?.(choice);
              }
            },
          )
        }
      >
        <View>
          <Text style={[styles.locationLabel, { color: colors.textMuted }]}>{label}</Text>
          <Text style={[styles.iosPickerText, { color: colors.textPrimary }]}>
            {currentLabel || 'Any'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheetModal
      index={index}
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={SheetBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: heroTint }]}>
              <Ionicons name="funnel" size={20} color={accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Filters</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{statusHint}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={close}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Filter Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>STATUS</Text>
          <View style={styles.chipContainer}>
            {statusFilters.map((filter) => (
              <FilterChip key={filter} label={filter} active={filter === selectedFilter} onPress={() => handleSelect(filter)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PROJECTS</Text>
          <View style={styles.keyFilterList}>
            {keyFilters.map((filter) => {
              const active = filter.value === selectedKeyFilter;
              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.keyFilterPill,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.surfaceMuted : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedKeyFilter(filter.value)}
                >
                  <Text
                    style={[
                      styles.keyFilterText,
                      { color: active ? colors.primary : colors.textPrimary },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LOCATION</Text>
          {renderDropdown('Region', [undefined, ...regionOptions], selectedRegion.region, (val) =>
            handleRegionSelect('region', val),
          )}
          {renderDropdown('Province', [undefined, ...provinceOptions], selectedRegion.province, (val) =>
            handleRegionSelect('province', val),
          )}
          {renderDropdown(
            'Municipality',
            [undefined, ...municipalityOptions],
            selectedRegion.municipality,
            (val) => handleRegionSelect('municipality', val),
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: colors.border }]}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Text style={[styles.clearButtonText, { color: colors.textPrimary }]}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.8 : 1 }]}
            onPress={handleApply}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.applyText}>Apply Filters</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  keyFilterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  keyFilterPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  keyFilterText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  locationLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    marginRight: spacing.xs,
  },
  locationPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  locationPillText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: 48,
  },
  iosPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  iosPickerText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  applyButton: {
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  applyText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  dropdownWrapper: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  clearButton: {
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flex: 1,
  },
  clearButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
});