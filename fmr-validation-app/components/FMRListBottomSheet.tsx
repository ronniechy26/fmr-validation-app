import { SheetBackdrop } from '@/components/SheetBackdrop';
import { StatusBadge } from '@/components/StatusBadge';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { FMRItem } from '@/types/filters';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ForwardedRef, forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FMRListBottomSheetProps {
  data: FMRItem[];
  onItemPress?: (item: FMRItem) => void;
  snapPoints: string[];
  index?: number;
}

export const FMRListBottomSheet = forwardRef(function FMRListSheet(
  {
    data,
    onItemPress,
    snapPoints,
    index = 1,
  }: FMRListBottomSheetProps,
  ref: ForwardedRef<BottomSheetModal>,
) {
  const { colors, mode } = useThemeMode();
  const accent = colors.primary;
  const heroTint = mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(31,75,143,0.08)';

  const close = () => {
    if (!ref || typeof ref === 'function') return;
    ref.current?.dismiss();
  };

  const renderItem = ({ item }: { item: FMRItem }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={[styles.iconBadge, { backgroundColor: heroTint }]}>
            <Ionicons name="location" size={16} color={accent} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.projectName}
            </Text>
            <View style={styles.itemLocation}>
              <Ionicons name="pin-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.itemLocationText, { color: colors.textMuted }]} numberOfLines={1}>
                {item.barangay}, {item.municipality}
              </Text>
            </View>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: heroTint }]}>
              <Ionicons name="list-outline" size={22} color={accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>FMR Projects</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {data.length} project{data.length !== 1 ? 's' : ''} found
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

        {/* List */}
        <BottomSheetFlatList
          data={data}
          keyExtractor={(item: FMRItem) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No FMR projects found
              </Text>
            </View>
          }
        />
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  listItem: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  itemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemLocationText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
});
