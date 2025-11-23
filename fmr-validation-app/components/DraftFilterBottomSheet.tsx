import { SheetBackdrop } from '@/components/SheetBackdrop';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { FormStatus } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ForwardedRef, forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type StatusFilter = 'All' | FormStatus;

interface DraftFilterBottomSheetProps {
  activeFilter: StatusFilter;
  onApply: (filter: StatusFilter) => void;
  snapPoints: string[];
  index?: number;
}

const statusFilters: StatusFilter[] = ['All', 'Draft', 'Pending Sync', 'Synced', 'Error'];

export const DraftFilterBottomSheet = forwardRef(function DraftFilterSheet(
  {
    activeFilter,
    onApply,
    snapPoints,
    index = 1,
  }: DraftFilterBottomSheetProps,
  ref: ForwardedRef<BottomSheetModal>,
) {
  const { colors, mode } = useThemeMode();
  const accent = colors.primary;
  const heroTint = mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(31,75,143,0.08)';
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>(activeFilter);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedFilter(activeFilter);
  }, [activeFilter]);

  const statusHint = () => {
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
        return 'Viewing all standalone drafts';
    }
  };

  const close = () => {
    if (!ref || typeof ref === 'function') return;
    ref.current?.dismiss();
  };

  const handleApply = () => {
    setIsLoading(true);
    setTimeout(() => {
      onApply(selectedFilter);
      setIsLoading(false);
      close();
    }, 500);
  };

  const handleClear = () => {
    onApply('All');
    close();
  };

  const handleSelect = (filter: StatusFilter) => {
    setSelectedFilter(filter);
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
              <Ionicons name="document-text-outline" size={22} color={accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Filter Drafts</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {statusHint()}
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

        {/* Filter Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FORM STATUS</Text>
          </View>
          <View style={styles.chipContainer}>
            {statusFilters.map((filter) => {
              const active = filter === selectedFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.statusChip,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelect(filter)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: active ? '#fff' : colors.textPrimary },
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  statusChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
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
