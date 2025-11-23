import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ForwardedRef, forwardRef, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';

interface RouteDetails {
  mode: 'driving' | 'bike' | 'foot';
  distance: number;
  duration: number;
  summary?: string;
  steps?: any[];
  projectName: string;
}

interface RouteDetailsBottomSheetProps {
  route?: RouteDetails | null;
  snapPoints: string[];
  index?: number;
  isLoading?: boolean;
  onChangeMode?: (mode: 'driving' | 'bike' | 'foot') => void;
  onClearRoute?: () => void;
}

export const RouteDetailsBottomSheet = forwardRef(function RouteDetailsSheet(
  { route, snapPoints, index = 1, isLoading = false, onChangeMode, onClearRoute }: RouteDetailsBottomSheetProps,
  ref: ForwardedRef<BottomSheetModal>,
) {
  const { colors } = useThemeMode();

  const formatted = useMemo(() => {
    if (!route) return null;
    const distanceKm = (route.distance / 1000).toFixed(2);
    const minutes = Math.round(route.duration / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${minutes} min`;
    return { distanceKm, durationLabel };
  }, [route]);

  const modeLabel = route?.mode === 'bike' ? 'Bike' : route?.mode === 'foot' ? 'Foot' : 'Car';
  const modeButtons = [
    { label: 'Car', value: 'driving', icon: 'car' as const },
    { label: 'Bike', value: 'bike', icon: 'bicycle' as const },
    { label: 'Foot', value: 'foot', icon: 'walk' as const },
  ];

  return (
    <BottomSheetModal
      index={index}
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="map" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Route preview</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {route ? route.projectName : 'No route selected'}
              </Text>
            </View>
          </View>
          {route && (
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={onClearRoute}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={16} color={colors.textPrimary} />
              <Text style={[styles.clearText, { color: colors.textPrimary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {!route ? (
          <View style={styles.empty}>
            <Ionicons name="navigate-circle-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No route selected</Text>
          </View>
        ) : (
          <>
            <View style={[styles.modeCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.modeHeader}>
                <Text style={[styles.modeTitle, { color: colors.textPrimary }]}>Mode</Text>
                {isLoading && <Ionicons name="refresh" size={16} color={colors.primary} />}
              </View>
              <View style={styles.modeRow}>
                {modeButtons.map((opt) => {
                  const active = route.mode === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.modePill,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      disabled={isLoading}
                      onPress={() => onChangeMode?.(opt.value)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={opt.icon} size={14} color={active ? '#fff' : colors.textPrimary} />
                      <Text
                        style={[
                          styles.modePillLabel,
                          { color: active ? '#fff' : colors.textPrimary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Mode</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{modeLabel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Distance</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  {formatted?.distanceKm ?? '--'} km
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Duration</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  {formatted?.durationLabel ?? '--'}
                </Text>
              </View>
              {route.summary ? (
                <View style={[styles.summaryRow, { alignItems: 'flex-start' }]}>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Via</Text>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary, flex: 1 }]} numberOfLines={2}>
                    {route.summary}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.stepsHeader}>
              <Text style={[styles.stepsTitle, { color: colors.textPrimary }]}>Steps</Text>
              <Text style={[styles.stepsCount, { color: colors.textMuted }]}>
                {route.steps?.length ?? 0} instruction{(route.steps?.length ?? 0) === 1 ? '' : 's'}
              </Text>
            </View>

            {route.steps?.length ? (
              route.steps.map((step: any, idx: number) => {
                const instruction = step.maneuver?.instruction || step.name || 'Continue';
                const distance = ((step.distance ?? 0) / 1000).toFixed(2);
                const duration = Math.round((step.duration ?? 0) / 60);
                const maneuverIcon = () => {
                  const type = (step.maneuver?.type ?? '').toLowerCase();
                  return (
                    {
                      depart: <FontAwesome5 name="location-arrow" size={18} color={colors.primary} />,
                      arrive: <FontAwesome5 name="map-marker-alt" size={18} color={colors.primary} />,
                      'new name': <FontAwesome5 name="road" size={18} color={colors.primary} />,
                      merge: <FontAwesome5 name="random" size={18} color={colors.primary} />,
                      'on ramp': <FontAwesome5 name="sign-in-alt" size={18} color={colors.primary} />,
                      'off ramp': <FontAwesome5 name="sign-out-alt" size={18} color={colors.primary} />,
                      fork: <FontAwesome5 name="code-branch" size={18} color={colors.primary} />,
                      'end of road': <FontAwesome5 name="flag-checkered" size={18} color={colors.primary} />,
                      'use lane': <FontAwesome5 name="grip-lines" size={18} color={colors.primary} />,
                      continue: <FontAwesome5 name="arrow-up" size={18} color={colors.primary} />,
                      roundabout: <FontAwesome5 name="sync-alt" size={18} color={colors.primary} />,
                      rotary: <FontAwesome5 name="circle-notch" size={18} color={colors.primary} />,
                      'roundabout turn': <FontAwesome5 name="redo" size={18} color={colors.primary} />,
                      notification: <FontAwesome5 name="info-circle" size={18} color={colors.primary} />,
                    } as Record<string, JSX.Element>
                  )[type] ?? <FontAwesome5 name="question-circle" size={18} color={colors.primary} />;
                };

                const modifierIcon =
                  {
                    uturn: <FontAwesome5 name="undo" size={16} color={colors.textMuted} />,
                    'sharp right': <Ionicons name="arrow-redo-sharp" size={16} color={colors.textMuted} />,
                    right: <FontAwesome5 name="arrow-right" size={16} color={colors.textMuted} />,
                    'slight right': <MaterialIcons name="turn-slight-right" size={16} color={colors.textMuted} />,
                    straight: <FontAwesome5 name="arrow-up" size={16} color={colors.textMuted} />,
                    'slight left': <MaterialIcons name="turn-slight-left" size={16} color={colors.textMuted} />,
                    left: <FontAwesome5 name="arrow-left" size={16} color={colors.textMuted} />,
                    'sharp left': <Ionicons name="arrow-undo-sharp" size={16} color={colors.textMuted} />,
                  }[step.maneuver?.modifier?.toLowerCase() ?? ''];

                return (
                  <View key={`${instruction}-${idx}`} style={[styles.stepRow, { borderColor: colors.border }]}>
                    <View style={[styles.stepIcon, { backgroundColor: colors.surface }]}>
                      {maneuverIcon()}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepText, { color: colors.textPrimary }]} numberOfLines={2}>
                        {instruction}
                      </Text>
                      <Text style={[styles.stepMeta, { color: colors.textMuted }]}>
                        {distance} km • {duration} min
                      </Text>
                    </View>
                    {modifierIcon && <View style={styles.modifierIcon}>{modifierIcon}</View>}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptySteps}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No step data</Text>
              </View>
            )}

          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  divider: {
    height: 1,
    opacity: 0.4,
  },
  modeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  modePillLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  summaryValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  stepsCount: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifierIcon: {
    marginLeft: spacing.sm,
  },
  stepText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  stepMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptySteps: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  clearButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clearText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});

export default RouteDetailsBottomSheet;
