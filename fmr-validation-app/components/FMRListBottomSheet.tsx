import { SheetBackdrop } from '@/components/SheetBackdrop';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { FMRItem } from '@/types/filters';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ForwardedRef, forwardRef, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    if (data.length === 0) {
      setSelectedId(null);
      setView('list');
      return;
    }
    if (!selectedId || !data.some((item) => item.id === selectedId)) {
      setSelectedId(data[0].id);
    }
  }, [data, selectedId]);

  const close = () => {
    if (!ref || typeof ref === 'function') return;
    ref.current?.dismiss();
  };

  const selectedItem = data.find((item) => item.id === selectedId) ?? null;

  const handleItemPress = (item: FMRItem) => {
    setSelectedId(item.id);
    setView('detail');
    onItemPress?.(item);
  };

  const handleBackToList = () => {
    setView('list');
  };

  const formatCoordinate = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return null;
    return Number(value).toFixed(5);
  };

  const renderDetails = (item: FMRItem) => {
    const rows = [
      { label: 'ABEMIS ID', value: item.abemisId },
      { label: 'Project Code', value: item.projectCode },
      { label: 'Status', value: item.status },
      { label: 'Region', value: item.region },
      { label: 'Province', value: item.province },
      { label: 'Municipality', value: item.municipality },
      { label: 'Barangay', value: item.barangay },
      {
        label: 'Coordinates',
        value:
          formatCoordinate(item.latitude) && formatCoordinate(item.longitude)
            ? `${formatCoordinate(item.latitude)}, ${formatCoordinate(item.longitude)}`
            : 'Not available',
      },
    ];

    return (
      <View style={[styles.detailCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        {rows.map((row) => (
          <View key={row.label} style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{row.label}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {row.value || '—'}
            </Text>
          </View>
        ))}

        {item.geotags && item.geotags.length > 0 && (
          <View style={styles.geotagSection}>
            <Text style={[styles.geotagTitle, { color: colors.textPrimary }]}>Geotag Photos</Text>
            <View style={styles.geotagGrid}>
              {item.geotags.map((tag) => (
                <View key={tag.id} style={[styles.geotagCard, { borderColor: colors.border }]}>
                  <Image
                    source={{ uri: tag.url }}
                    style={styles.geotagImage}
                    resizeMode="cover"
                  />
                  {tag.photoName ? (
                    <Text style={[styles.geotagLabel, { color: colors.textMuted }]} numberOfLines={1}>
                      {tag.photoName}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderItem = (item: FMRItem, index: number) => {
    return (
      <View key={item.id}>
        <TouchableOpacity
          style={[
            styles.listItem,
            {
              backgroundColor: colors.surface,
              borderColor: selectedId === item.id ? colors.primary : colors.border,
              borderWidth: selectedId === item.id ? 1.5 : 1,
            },
          ]}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
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
        </TouchableOpacity>
        {index < data.length - 1 && <View style={{ height: spacing.sm }} />}
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
      <BottomSheetScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
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
        {view === 'list' && (
          <>
            {data.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No FMR projects found
                </Text>
              </View>
            ) : (
              data.map((item, index) => renderItem(item, index))
            )}
          </>
        )}

        {/* Detail View */}
        {view === 'detail' && selectedItem && (
          <View>
            <TouchableOpacity
              style={[styles.backRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleBackToList}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
              <Text style={[styles.backText, { color: colors.textPrimary }]}>Back to list</Text>
            </TouchableOpacity>

            <View style={[styles.detailHeaderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBadge, { backgroundColor: heroTint }]}>
                <Ionicons name="location" size={20} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {selectedItem.projectName}
                </Text>
                <Text style={[styles.detailSub, { color: colors.textMuted }]} numberOfLines={2}>
                  {selectedItem.barangay ? `${selectedItem.barangay}, ` : ''}{selectedItem.municipality}
                </Text>
              </View>
            </View>

            {renderDetails(selectedItem)}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
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
  listItem: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
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
  detailCard: {
    marginTop: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailHeaderCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  geotagSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  geotagTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  geotagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  geotagCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  geotagImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#0f172a0d',
  },
  geotagLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginBottom: 4,
  },
  detailSub: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  backText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
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
