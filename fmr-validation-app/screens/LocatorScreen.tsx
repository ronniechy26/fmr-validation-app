/**
 * LocatorScreen
 *
 * This screen displays all FMR project locations on an interactive map.
 * Users can filter projects by location (Region, Province, Municipality) using a bottom sheet.
 * The map renders all FMR points from SQLite with color-coded markers based on status.
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { LocationFilterBottomSheet } from '@/components/LocationFilterBottomSheet';
import { FMRListBottomSheet } from '@/components/FMRListBottomSheet';
import LocatorMap from '@/components/LocatorMap';
import RouteDetailsBottomSheet from '@/components/RouteDetailsBottomSheet';
import { fonts, spacing } from '@/theme';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FMRItem, LocatorFilter } from '@/types/filters';
import { fetchRoute } from '@/lib/routing';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useProjectFilter } from '@/hooks/useProjectFilter';

type FilterableProject = Parameters<typeof useProjectFilter>[0][number];
type MarkerItem = FMRItem & { latitude: number; longitude: number };

const toNumericCoordinate = (value?: string | number | null) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function LocatorScreen() {
  const { colors } = useThemeMode();
  const { projects, standaloneDrafts } = useOfflineData();
  const filterSheetRef = useRef<BottomSheetModal | null>(null);
  const listSheetRef = useRef<BottomSheetModal | null>(null);
  const routeSheetRef = useRef<BottomSheetModal | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [activeRoute, setActiveRoute] = useState<{
    coordinates: { latitude: number; longitude: number }[];
    mode: 'driving' | 'bike' | 'foot';
    distance: number;
    duration: number;
    projectName: string;
    summary?: string;
    steps?: any[];
    targetLatitude: number;
    targetLongitude: number;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocatorFilter>({});

  const userLocation = useUserLocation();
  const insets = useSafeAreaInsets();
  const tabBarInset = spacing.xl + (insets.bottom || spacing.md);

  const locationOptions = useMemo(() => {
    const locations: Array<{
      region?: string;
      province?: string;
      municipality?: string;
    }> = [];

    projects.forEach((project) => {
      locations.push({
        region: project.region,
        province: project.province,
        municipality: project.municipality,
      });
    });

    standaloneDrafts.forEach((form) => {
      locations.push({
        region: form.region,
        province: form.data.locationProvince,
        municipality: form.data.locationMunicipality,
      });
    });

    return locations;
  }, [projects, standaloneDrafts]);

  const fitRouteBounds = (coordinates: { latitude: number; longitude: number }[]) => {
    if (!mapRef.current || coordinates.length === 0) return;
    const lats = coordinates.map((c) => c.latitude);
    const lngs = coordinates.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latPadding = (maxLat - minLat) * 0.2 || 0.1;
    const lngPadding = (maxLng - minLng) * 0.2 || 0.1;

    mapRef.current.animateToRegion(
      {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) + latPadding, 0.1),
        longitudeDelta: Math.max((maxLng - minLng) + lngPadding, 0.1),
      },
      800,
    );
  };

  const allProjects = useMemo<FilterableProject[]>(() => {
    return projects.map((project) => ({
      id: project.id,
      projectName: project.title,
      abemisId: project.abemisId ?? undefined,
      projectCode: project.projectCode,
      barangay: project.barangay,
      municipality: project.municipality,
      province: project.province,
      region: project.region,
      latitude: toNumericCoordinate(project.latitude),
      longitude: toNumericCoordinate(project.longitude),
    }));
  }, [projects]);

  const filteredProjects = useProjectFilter(allProjects, selectedLocation);

  const mapMarkers = useMemo<MarkerItem[]>(() => {
    return filteredProjects
      .filter(
        (project): project is typeof project & { latitude: number; longitude: number } =>
          typeof project.latitude === 'number' && typeof project.longitude === 'number',
      )
      .map((project) => ({
        id: project.id,
        latitude: project.latitude,
        longitude: project.longitude,
        projectName: project.projectName,
        projectCode: project.projectCode,
        abemisId: project.abemisId ?? undefined,
        barangay: project.barangay || '',
        municipality: project.municipality || '',
        province: project.province || '',
        region: project.region || '',
        status: 'Synced' as const,
      }));
  }, [filteredProjects]);

  const handleRouteReady = (payload: any) => {
    setActiveRoute(payload);
    if (payload.coordinates.length > 0) {
      fitRouteBounds(payload.coordinates);
    }
    routeSheetRef.current?.present();
  };

  const handleRoutePress = () => {
    if (!activeRoute) return;
    routeSheetRef.current?.present();
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
  };

  const refetchRoute = async (mode: 'driving' | 'bike' | 'foot') => {
    if (!activeRoute || !userLocation) return;

    setRouteLoading(true);
    const route = await fetchRoute(
      userLocation,
      { latitude: activeRoute.targetLatitude, longitude: activeRoute.targetLongitude },
      mode
    );
    setRouteLoading(false);

    if (route) {
      const updated = {
        ...activeRoute,
        mode,
        ...route,
      };
      setActiveRoute(updated);
      if (route.coordinates.length > 0) {
        fitRouteBounds(route.coordinates);
      }
    }
  };

  useEffect(() => {
    if (mapRef.current && mapMarkers.length > 0) {
      const lats = mapMarkers.map((m) => m.latitude);
      const lngs = mapMarkers.map((m) => m.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const latPadding = (maxLat - minLat) * 0.2 || 0.1;
      const lngPadding = (maxLng - minLng) * 0.2 || 0.1;

      mapRef.current.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max((maxLat - minLat) + latPadding, 0.1),
          longitudeDelta: Math.max((maxLng - minLng) + lngPadding, 0.1),
        },
        1000
      );
    }
  }, [mapMarkers]);

  useEffect(() => {
    if (mapRef.current && userLocation && activeRoute) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        500,
      );
    }
  }, [userLocation, activeRoute]);

  const handleFilterApply = (location: LocatorFilter) => {
    setSelectedLocation(location);
  };

  const openFilterSheet = () => {
    filterSheetRef.current?.present();
  };

  const openListSheet = () => {
    listSheetRef.current?.present();
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        },
        1000
      );
    } else {
      Alert.alert('Location Unavailable', 'Unable to get your current location.');
    }
  };

  const handleMarkerPress = (marker: any) => {
    console.log('Marker pressed:', marker);
    // TODO: Navigate to form detail or show info
  };

  const handleListItemPress = (item: any) => {
    const target = mapMarkers.find((marker) => marker.id === item.id);
    if (target && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: target.latitude,
          longitude: target.longitude,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        },
        800,
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Map Container */}
      <View style={[styles.mapContainer, { paddingBottom: tabBarInset }]}>
        <LocatorMap
          mapRef={mapRef}
          data={mapMarkers}
          handleMarkerPress={handleMarkerPress}
          routePath={activeRoute?.coordinates}
          routeMode={activeRoute?.mode}
          onRoutePress={handleRoutePress}
        />

        {/* Floating Filter Button */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[styles.filterFloatingButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={openFilterSheet}
            activeOpacity={0.9}
          >
            <Ionicons name="options" size={20} color={colors.primary} />
            <Text style={[styles.filterFloatingText, { color: colors.textPrimary }]}>
              {selectedLocation.municipality || selectedLocation.province || selectedLocation.region || 'Filter Location'}
            </Text>
          </TouchableOpacity>

          <View style={styles.locationStack}>
            {/* Center on Location Button */}
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: colors.primary }]}
              onPress={centerOnUserLocation}
              activeOpacity={0.9}
            >
              <Ionicons name="locate" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Marker Count Badge - Now Clickable */}
        <TouchableOpacity
          style={[
            styles.countBadge,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              bottom: (spacing.xxl + spacing.xxl + spacing.lg) + (insets.bottom || spacing.sm),
              left: spacing.xs,
            },
          ]}
          onPress={openListSheet}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.textPrimary }]}>
            {mapMarkers.length} Project{mapMarkers.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>

        {/* Brand badge */}
        <Image
          source={require('../assets/images/bafe_logo.png')}
          style={[
            styles.brandLogo,
            {
              bottom: spacing.sm + (insets.bottom || spacing.md),
              right: spacing.lg,
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Filter Bottom Sheet - Location Only */}
      <LocationFilterBottomSheet
        ref={filterSheetRef}
        activeFilter={selectedLocation}
        onApply={handleFilterApply}
        snapPoints={['70%']}
        locationOptions={locationOptions}
      />

      {/* FMR List Bottom Sheet */}
      <FMRListBottomSheet
        ref={listSheetRef}
        data={mapMarkers}
        onItemPress={handleListItemPress}
        onRouteReady={handleRouteReady}
        snapPoints={['70%', '90%']}
        userLocation={userLocation}
      />

      <RouteDetailsBottomSheet
        ref={routeSheetRef}
        route={activeRoute}
        snapPoints={['45%', '70%']}
        isLoading={routeLoading}
        onChangeMode={refetchRoute}
        onClearRoute={handleClearRoute}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingControls: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 10,
  },
  locationStack: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  filterFloatingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterFloatingText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    flex: 1,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  countBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  brandLogo: {
    position: 'absolute',
    width: 140,
    height: 140,
  },
});
