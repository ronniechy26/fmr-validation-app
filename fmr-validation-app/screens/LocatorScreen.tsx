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
import { fonts, spacing } from '@/theme';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export function LocatorScreen() {
  const { colors } = useThemeMode();
  const { projects, standaloneDrafts } = useOfflineData();
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const listSheetRef = useRef<BottomSheetModal>(null);
  const mapRef = useRef<MapView>(null);

  // Location filter state (only location, no status filter)
  const [selectedLocation, setSelectedLocation] = useState<{
    region?: string;
    province?: string;
    municipality?: string;
  }>({});

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

  // Combine all projects with their coordinates for map display
  const allProjects = useMemo(() => {
    // Map projects to marker data (without status - projects don't have status)
    const projectMarkers = projects.map((project) => ({
      id: project.id,
      projectName: project.title,
      barangay: project.barangay,
      municipality: project.municipality,
      province: project.province,
      region: project.region,
      latitude: project.latitude,
      longitude: project.longitude,
    }));

    return projectMarkers;
  }, [projects]);

  // Apply location filters - only show markers when a filter is applied
  const filteredProjects = useMemo(() => {
    // If no filter is applied, return empty array (show no markers)
    const hasFilter = selectedLocation.region || selectedLocation.province || selectedLocation.municipality;
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
        barangay: project.barangay || '',
        municipality: project.municipality || '',
        status: 'Synced' as const, // Default status for display purposes only
      }));
  }, [filteredProjects]);

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

  const handleFilterApply = (location: { region?: string; province?: string; municipality?: string }) => {
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
    console.log('List item pressed:', item);
    // TODO: Navigate to form detail or zoom to marker
    listSheetRef.current?.dismiss();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <LocatorMap mapRef={mapRef} data={mapMarkers} handleMarkerPress={handleMarkerPress} />

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
        activeRegionFilter={selectedLocation}
        onApply={handleFilterApply}
        snapPoints={['70%']}
        locationOptions={locationOptions}
      />

      {/* FMR List Bottom Sheet */}
      <FMRListBottomSheet
        ref={listSheetRef}
        data={mapMarkers}
        onItemPress={handleListItemPress}
        snapPoints={['70%', '90%']}
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
