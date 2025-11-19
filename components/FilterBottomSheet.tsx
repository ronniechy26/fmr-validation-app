import { FilterChip } from '@/components/FilterChip';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, FormStatus, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ForwardedRef, forwardRef, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type StatusFilter = 'All' | FormStatus;

interface FilterBottomSheetProps {
  activeFilter: StatusFilter;
  onApply: (filter: StatusFilter) => void;
  snapPoints: string[];
}

const statusFilters: StatusFilter[] = ['All', 'Draft', 'Pending Sync', 'Synced', 'Error'];

export const FilterBottomSheet = forwardRef(function FilterSheet(
  { activeFilter, onApply, snapPoints }: FilterBottomSheetProps,
  ref: ForwardedRef<BottomSheetModal>,
) {
  const { colors, mode } = useThemeMode();
  const accent = colors.primary;
  const heroTint = mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(31,75,143,0.08)';
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>(activeFilter);

  useEffect(() => {
    setSelectedFilter(activeFilter);
  }, [activeFilter]);

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
    onApply(selectedFilter);
    close();
  };

  const handleSelect = (filter: StatusFilter) => {
    setSelectedFilter(filter);
  };

  return (
    <BottomSheetModal
      index={1}
      ref={ref}
      snapPoints={snapPoints}
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

        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.8}
        >
          <Text style={styles.applyText}>Apply Filters</Text>
        </TouchableOpacity>
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
  applyButton: {
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
});
