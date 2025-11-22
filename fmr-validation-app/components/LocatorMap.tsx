/**
 * LocatorMap Component
 *
 * This component represents a map view using react-native-maps to display FMR project markers.
 * It supports the display of FMR project locations as markers with color-coded status indicators.
 *
 * Props:
 * - handleMarkerPress (function): Function to handle marker press events.
 * - mapRef (object): Ref for the MapView component to control the map programmatically.
 * - data (array): List of FMR projects to display as markers, including latitude, longitude, status, and other information.
 *
 * Behavior:
 * - Initializes the map to a specified region (Philippines center).
 * - Displays user location and follows the user's location.
 * - Allows users to press on markers to interact with them.
 * - Markers are color-coded based on FMR status (Draft, Pending Sync, Synced, Error).
 */

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, Platform } from 'react-native';
import { useCallback } from 'react';

// Initial region to center the map on Philippines
const INITIAL_REGION = {
  latitude: 12.8797,
  longitude: 121.7740,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

// Marker colors based on FMR status
const statusColors = {
  Draft: '#94a3b8', // gray
  'Pending Sync': '#f59e0b', // amber
  Synced: '#10b981', // green
  Error: '#ef4444', // red
};

interface LocatorMapProps {
  handleMarkerPress?: (marker: any) => void;
  mapRef: React.RefObject<MapView | null>;
  data?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    projectName: string;
    barangay: string;
    municipality: string;
    status: 'Draft' | 'Pending Sync' | 'Synced' | 'Error';
  }>;
}

const LocatorMap = ({ handleMarkerPress, mapRef, data = [] }: LocatorMapProps) => {
  // Function to animate the map to the initial region when the map is ready
  const onMapReady = useCallback(() => {
    if (mapRef.current && data.length > 0) {
      // Calculate bounds to fit all markers
      const lats = data.map((m) => m.latitude);
      const lngs = data.map((m) => m.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      mapRef.current.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.5),
          longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.5),
        },
        1000
      );
    } else if (mapRef.current) {
      mapRef.current.animateToRegion(INITIAL_REGION, 1000);
    }
  }, [data, mapRef]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={INITIAL_REGION}
      showsUserLocation={true}
      showsMyLocationButton={false}
      followsUserLocation={false}
      showsCompass={true}
      zoomEnabled={true}
      onMapReady={onMapReady}
    >
      {/* Render markers for each FMR project */}
      {data.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.projectName}
          description={`${marker.barangay}, ${marker.municipality}`}
          pinColor={statusColors[marker.status] || '#3b82f6'}
          onPress={() => handleMarkerPress?.(marker)}
        />
      ))}
    </MapView>
  );
};

export default LocatorMap;

// Styles for the map container
const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
