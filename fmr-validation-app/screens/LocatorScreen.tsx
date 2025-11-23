/**
 * LocatorScreen
 *
 * This screen displays all FMR project locations on an interactive map.
 * Users can filter projects by location (Region, Province, Municipality) using a bottom sheet.
 * The map renders all FMR points from SQLite with color-coded markers based on status.
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { LocationFilterBottomSheet } from '@/components/LocationFilterBottomSheet';
import { FMRListBottomSheet } from '@/components/FMRListBottomSheet';
import LocatorMap from '@/components/LocatorMap';
import RouteDetailsBottomSheet from '@/components/RouteDetailsBottomSheet';
import { fonts, spacing } from '@/theme';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LocatorFilter } from '@/types/filters';
import axios from 'axios';

export function LocatorScreen() {
  const { colors } = useThemeMode();
  const { projects, standaloneDrafts } = useOfflineData();
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const listSheetRef = useRef<BottomSheetModal>(null);
  const routeSheetRef = useRef<BottomSheetModal>(null);
  const mapRef = useRef<MapView>(null);
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
  const osrmUrl = process.env.EXPO_PUBLIC_OSRM_ROUTE_API;

  // Location filter state (only location, no status filter)
  const [selectedLocation, setSelectedLocation] = useState<LocatorFilter>({});

  // Map states
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Request location permissions and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to show your position on the map.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  // Extract all unique locations from projects and forms for filter options
  const locationOptions = useMemo(() => {
    const locations: Array<{
      region?: string;
      province?: string;
      municipality?: string;
    }> = [];

    // Add locations from projects
    projects.forEach((project) => {
      locations.push({
        region: project.region,
        province: project.province,
        municipality: project.municipality,
      });
    });

    // Add locations from standalone drafts
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

  // Combine all projects with their coordinates for map display
  const allProjects = useMemo(() => {
    // Map projects to marker data (without status - projects don't have status)
    const projectMarkers = projects.map((project) => ({
      id: project.id,
      projectName: project.title,
      abemisId: project.abemisId,
      projectCode: project.projectCode,
      barangay: project.barangay,
      municipality: project.municipality,
      province: project.province,
      region: project.region,
      latitude: project.latitude,
      longitude: project.longitude,
      geotags: project.geotags?.map((tag) => ({
        id: tag.id,
        url: tag.url,
        photoName: tag.photoName,
      })),
    }));

    return projectMarkers;
  }, [projects]);

  // Apply location filters - only show markers when a filter is applied
  const filteredProjects = useMemo(() => {
    const query = selectedLocation.searchQuery?.trim().toLowerCase() ?? '';
    const hasLocationFilter = Boolean(
      selectedLocation.region || selectedLocation.province || selectedLocation.municipality,
    );
    const hasFilter = hasLocationFilter || Boolean(query);

    if (!hasFilter) {
      return [];
    }

    return allProjects.filter((project) => {
      // Location filters
      if (selectedLocation.region && project.region?.toLowerCase() !== selectedLocation.region.toLowerCase()) {
        return false;
      }
      if (
        selectedLocation.province &&
        project.province?.toLowerCase() !== selectedLocation.province.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedLocation.municipality &&
        project.municipality?.toLowerCase() !== selectedLocation.municipality.toLowerCase()
      ) {
        return false;
      }

      if (query) {
        const matchesQuery = [project.projectName, project.abemisId]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
        if (!matchesQuery) {
          return false;
        }
      }

      return true;
    });
  }, [allProjects, selectedLocation]);

  // Prepare markers from filtered projects with valid coordinates
  const mapMarkers = useMemo(() => {
    return filteredProjects
      .filter((project) => project.latitude && project.longitude)
      .map((project) => ({
        id: project.id,
        latitude: parseFloat(project.latitude!),
        longitude: parseFloat(project.longitude!),
        projectName: project.projectName,
        projectCode: project.projectCode,
        abemisId: project.abemisId,
        barangay: project.barangay || '',
        municipality: project.municipality || '',
        province: project.province || '',
        region: project.region || '',
        geotags: project.geotags,
        status: 'Synced' as const, // Default status for display purposes only
      }));
  }, [filteredProjects]);

  const handleRouteReady = (payload: {
    mode: 'driving' | 'bike' | 'foot';
    distance: number;
    duration: number;
    coordinates: { latitude: number; longitude: number }[];
    projectName: string;
    summary?: string;
    steps?: any[];
    targetLatitude: number;
    targetLongitude: number;
  }) => {
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
    if (!activeRoute || !userLocation || !osrmUrl) return;
    try {
      setRouteLoading(true);
      const url = `${osrmUrl}/${mode}/${userLocation.longitude},${userLocation.latitude};${activeRoute.targetLongitude},${activeRoute.targetLatitude}`;
      const response = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true,
        },
      });
      const route = response.data?.routes?.[0];
      if (!route) {
        Alert.alert('Route not found', 'No route was returned for this selection.');
        return;
      }
      const coordinates =
        route.geometry?.coordinates?.map(
          ([longitude, latitude]: [number, number]) => ({ latitude, longitude }),
        ) ?? [];
      const updated = {
        ...activeRoute,
        mode,
        distance: route.distance,
        duration: route.duration,
        coordinates,
        summary: route.legs?.[0]?.summary,
        steps: route.legs?.[0]?.steps,
      };
      setActiveRoute(updated);
      if (coordinates.length > 0) fitRouteBounds(coordinates);
    } catch (error) {
      console.error('osrm:route:refetch', error);
      Alert.alert('Directions error', 'Unable to update route. Please try again.');
    } finally {
      setRouteLoading(false);
    }
  };

  // Auto-fit map to show all markers when filter is applied
  useEffect(() => {
    if (mapRef.current && mapMarkers.length > 0) {
      // Calculate bounds to fit all markers
      const lats = mapMarkers.map((m) => m.latitude);
      const lngs = mapMarkers.map((m) => m.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Add padding to the bounds
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
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

          {/* Center on Location Button */}
          <TouchableOpacity
            style={[styles.locationButton, { backgroundColor: colors.primary }]}
            onPress={centerOnUserLocation}
            activeOpacity={0.9}
          >
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Marker Count Badge - Now Clickable */}
        <TouchableOpacity
          style={[styles.countBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openListSheet}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.textPrimary }]}>
            {mapMarkers.length} Project{mapMarkers.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
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
    bottom: spacing.lg,
    right: spacing.lg,
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
});
