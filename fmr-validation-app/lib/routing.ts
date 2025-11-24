import axios from 'axios';
import { Alert } from 'react-native';
import { RouteInfo, LatLng } from '../types/route';

const osrmUrl = process.env.EXPO_PUBLIC_OSRM_ROUTE_API;


export async function fetchRoute(
  start: LatLng,
  end: LatLng,
  mode: 'driving' | 'bike' | 'foot' = 'driving'
): Promise<RouteInfo | null> {
  if (!osrmUrl) {
    Alert.alert('Configuration Error', 'The routing service URL is not configured.');
    return null;
  }

  const profile = mode === 'bike' ? 'bike' : mode === 'foot' ? 'foot' : 'car';
  const url = `${osrmUrl}/${profile}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;

  try {
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
      return null;
    }

    const coordinates =
      route.geometry?.coordinates?.map(
        ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
      ) ?? [];
    
    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      summary: route.legs?.[0]?.summary,
      steps: route.legs?.[0]?.steps,
    };
  } catch (error) {
    console.error('osrm:route:fetch', error);
    Alert.alert('Directions Error', 'Unable to fetch route. Please check your connection and try again.');
    return null;
  }
}
