import { SheetBackdrop } from '@/components/SheetBackdrop';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { RegionFilter } from '@/types/filters';
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

interface LocationFilterBottomSheetProps {
  activeRegionFilter?: RegionFilter;
  onApply: (regionFilter: RegionFilter) => void;
  snapPoints: string[];
  locationOptions?: RegionFilter[];
  index?: number;
}

export const LocationFilterBottomSheet = forwardRef(function LocationFilterSheet(
  {
    activeRegionFilter,
    onApply,
    snapPoints,
    locationOptions = [],
    index = 1,
  }: LocationFilterBottomSheetProps,
  ref: ForwardedRef<BottomSheetModal>,
) {
  const { colors, mode } = useThemeMode();
  const accent = colors.primary;
  const heroTint = mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(31,75,143,0.08)';
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>({
    ...(activeRegionFilter ?? {}),
  });

  const regionOptions = useMemo(() => {
    return Array.from(
      new Set(
        locationOptions
          .map((item) => item.region?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [locationOptions]);

  const provinceOptions = useMemo(() => {
    const source = selectedRegion.region
      ? locationOptions.filter(
        (item) => item.region?.toLowerCase() === selectedRegion.region?.toLowerCase(),
      )
      : locationOptions;
    return Array.from(
      new Set(
        source.map((item) => item.province?.trim()).filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [locationOptions, selectedRegion.region]);

  const municipalityOptions = useMemo(() => {
    const source = selectedRegion.province
      ? locationOptions.filter(
        (item) => item.province?.toLowerCase() === selectedRegion.province?.toLowerCase(),
      )
      : locationOptions;
    return Array.from(
      new Set(
        source.map((item) => item.municipality?.trim()).filter((value): value is string => Boolean(value)),
      ),
    ).sort();
  }, [locationOptions, selectedRegion.province]);

  useEffect(() => {
    setSelectedRegion({ ...(activeRegionFilter ?? {}) });
  }, [activeRegionFilter]);

  const close = () => {
    if (!ref || typeof ref === 'function') return;
    ref.current?.dismiss();
  };

  const handleApply = () => {
    setIsLoading(true);
    setTimeout(() => {
      onApply(selectedRegion);
      setIsLoading(false);
      close();
    }, 500);
  };

  const handleClear = () => {
    onApply({});
    close();
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
    const hasSelection = Boolean(selected);

    if (Platform.OS === 'android') {
      return (
        <View style={styles.dropdownWrapper}>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>

          <View
            style={[
              styles.pickerContainer,
              {
                borderColor: hasSelection ? colors.primary : colors.border,
                backgroundColor: hasSelection
                  ? mode === 'dark'
                    ? 'rgba(59, 130, 246, 0.1)'
                    : '#eff6ff'
                  : colors.surface,
                borderWidth: hasSelection ? 1.5 : 1,
              },
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
      <View style={styles.dropdownWrapper}>
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.iosPicker,
            {
              borderColor: hasSelection ? colors.primary : colors.border,
              backgroundColor: hasSelection
                ? mode === 'dark'
                  ? 'rgba(59, 130, 246, 0.1)'
                  : '#eff6ff'
                : colors.surface,
              borderWidth: hasSelection ? 1.5 : 1,
            },
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
          <Text
            style={[
              styles.iosPickerText,
              {
                color: hasSelection ? colors.primary : colors.textPrimary,
                fontFamily: hasSelection ? fonts.semibold : fonts.regular,
              },
            ]}
            numberOfLines={1}
          >
            {currentLabel}
          </Text>
          <Ionicons name="chevron-down" size={18} color={hasSelection ? colors.primary : colors.textMuted} />
        </TouchableOpacity>
      </View>
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
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: heroTint }]}>
              <Ionicons name="location-outline" size={22} color={accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Filter by Location</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Select region, province, or municipality
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}
            onPress={close}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LOCATION</Text>
          </View>
          <View style={styles.locationInputs}>
            {renderDropdown('Region', [undefined, ...regionOptions], selectedRegion.region, (val) =>
              handleRegionSelect('region', val),
            )}
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                {renderDropdown('Province', [undefined, ...provinceOptions], selectedRegion.province, (val) =>
                  handleRegionSelect('province', val),
                )}
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                {renderDropdown(
                  'Municipality',
                  [undefined, ...municipalityOptions],
                  selectedRegion.municipality,
                  (val) => handleRegionSelect('municipality', val),
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: colors.border }]}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={[styles.clearButtonText, { color: colors.textPrimary }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.applyButton,
              {
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.8 : 1,
                shadowColor: colors.primary,
              },
            ]}
            onPress={handleApply}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.applyText}>Show Results</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  divider: {
    height: 1,
    marginBottom: spacing.xl,
    opacity: 0.5,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationInputs: {
    gap: spacing.md,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 2,
  },
  dropdownWrapper: {
    marginBottom: 0,
  },
  pickerContainer: {
    borderRadius: 14,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 52,
  },
  iosPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  iosPickerText: {
    fontSize: 15,
    flex: 1,
    marginRight: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  clearButton: {
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flex: 1,
  },
  clearButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  applyButton: {
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
