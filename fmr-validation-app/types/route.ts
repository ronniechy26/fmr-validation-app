export type RouteInfo = {
  coordinates: LatLng[];
  distance: number;
  duration: number;
  summary?: string;
  steps?: any[];
};

export type LatLng = {
  latitude: number;
  longitude: number;
};