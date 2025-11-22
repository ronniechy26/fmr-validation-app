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
import LocatorMap from '@/components/LocatorMap';
import { fonts, spacing } from '@/theme';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FormStatus } from '@/types/theme';

export function LocatorScreen() {
  const { colors, mode } = useThemeMode();
  const { projects, standaloneDrafts } = useOfflineData();
  const filterSheetRef = useRef<BottomSheetModal>(null);
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
      barangay?: string;
    }> = [];

    projects.forEach((project) => {
      project.forms.forEach((form) => {
        locations.push({
          region: project.region || form.region,
          province: project.province || form.data.locationProvince,
          municipality: project.municipality || form.data.locationMunicipality,
          barangay: project.barangay || form.data.locationBarangay,
        });
      });
    });

    standaloneDrafts.forEach((form) => {
      locations.push({
        region: form.region,
        province: form.data.locationProvince,
        municipality: form.data.locationMunicipality,
        barangay: form.data.locationBarangay,
      });
    });

    return locations;
  }, [projects, standaloneDrafts]);

  // Combine all forms (linked + standalone) with coordinates from SQLite
  const allForms = useMemo(() => {
    const linked = projects.flatMap((project) =>
      project.forms.map((form) => ({
        id: form.id,
        projectName: project.title,
        barangay: project.barangay ?? form.data.locationBarangay,
        municipality: project.municipality ?? form.data.locationMunicipality,
        province: project.province ?? form.data.locationProvince,
        region: project.region ?? form.region,
        status: form.status,
        updatedAt: form.updatedAt,
        latitude: project.latitude,
        longitude: project.longitude,
      }))
    );

    const unlinked = standaloneDrafts.map((form) => ({
      id: form.id,
      projectName: form.data.nameOfProject,
      barangay: form.data.locationBarangay,
      municipality: form.data.locationMunicipality,
      province: form.data.locationProvince,
      region: form.region,
      status: form.status,
      updatedAt: form.updatedAt,
      latitude: undefined,
      longitude: undefined,
    }));

    return [...linked, ...unlinked];
  }, [projects, standaloneDrafts]);

  // Apply location filters only
  const filteredForms = useMemo(() => {
    return allForms.filter((form) => {
      // Location filters
      if (selectedLocation.region && form.region?.toLowerCase() !== selectedLocation.region.toLowerCase()) {
        return false;
      }
      if (
        selectedLocation.province &&
        form.province?.toLowerCase() !== selectedLocation.province.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedLocation.municipality &&
        form.municipality?.toLowerCase() !== selectedLocation.municipality.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [allForms, selectedLocation]);

  // Prepare markers from filtered forms with valid coordinates
  const mapMarkers = useMemo(() => {
    return filteredForms
      .filter((form) => form.latitude && form.longitude)
      .map((form) => ({
        id: form.id,
        latitude: parseFloat(form.latitude!),
        longitude: parseFloat(form.longitude!),
        projectName: form.projectName,
        barangay: form.barangay,
        municipality: form.municipality,
        status: form.status,
      }));
  }, [filteredForms]);

  const handleFilterApply = (location: { region?: string; province?: string; municipality?: string }) => {
    setSelectedLocation(location);
  };

  const openFilterSheet = () => {
    filterSheetRef.current?.present();
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

        {/* Marker Count Badge */}
        <View style={[styles.countBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.textPrimary }]}>
            {mapMarkers.length} FMR{mapMarkers.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Filter Bottom Sheet - Location Only */}
      <LocationFilterBottomSheet
        ref={filterSheetRef}
        activeRegionFilter={selectedLocation}
        onApply={handleFilterApply}
        snapPoints={['60%']}
        locationOptions={locationOptions}
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
