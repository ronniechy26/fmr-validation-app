import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;
    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your position on the map.');
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting current position:', error);
      }
    };

    startWatching();

    return () => {
      isMounted = false;
      locationWatcher.current?.remove();
    };
  }, []);

  return userLocation;
}
