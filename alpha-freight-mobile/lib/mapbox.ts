import Constants from "expo-constants";

export type MapCoords = { lng: number; lat: number };
export type LatLng = { latitude: number; longitude: number };

export type RouteResult = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
};

const routeCache = new Map<string, RouteResult>();

function routeCacheKey(origin: string, destination: string) {
  return `${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;
}

export function getMapboxToken(): string {
  return (
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim() ||
    (Constants.expoConfig?.extra?.mapboxToken as string | undefined)?.trim() ||
    ""
  );
}

export async function geocodePlace(query: string, country = "gb"): Promise<MapCoords | null> {
  const token = getMapboxToken();
  if (!token || !query || query.length < 3) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&country=${country}`
    );
    const data = await res.json();
    if (data.features?.length) {
      const [lng, lat] = data.features[0].center as [number, number];
      return { lng, lat };
    }
  } catch (error) {
    console.error("geocodePlace", error);
  }

  return null;
}

export async function fetchDrivingRoute(
  origin: string,
  destination: string,
  originCoords: MapCoords,
  destCoords: MapCoords
): Promise<RouteResult | null> {
  const cached = routeCache.get(routeCacheKey(origin, destination));
  if (cached) return cached;

  const token = getMapboxToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?geometries=geojson&access_token=${token}`
    );
    const data = await res.json();
    if (!data.routes?.[0]) return null;

    const route = data.routes[0];
    const result: RouteResult = {
      coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };

    routeCache.set(routeCacheKey(origin, destination), result);
    return result;
  } catch (error) {
    console.error("fetchDrivingRoute", error);
    return null;
  }
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null) return "Calculating…";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "Calculating…";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function simplifyPath(coords: LatLng[], maxPoints = 30): string {
  if (!coords.length) return "";
  if (coords.length <= maxPoints) {
    return coords
      .map((c) => `${c.longitude.toFixed(5)},${c.latitude.toFixed(5)}`)
      .join(";");
  }

  const step = Math.ceil(coords.length / maxPoints);
  const sampled = coords.filter((_, index) => index % step === 0 || index === coords.length - 1);
  return sampled
    .map((c) => `${c.longitude.toFixed(5)},${c.latitude.toFixed(5)}`)
    .join(";");
}

export function getRouteBounds(
  originCoords?: MapCoords | null,
  destCoords?: MapCoords | null,
  route?: LatLng[]
) {
  const lngs: number[] = [];
  const lats: number[] = [];

  if (originCoords) {
    lngs.push(originCoords.lng);
    lats.push(originCoords.lat);
  }
  if (destCoords) {
    lngs.push(destCoords.lng);
    lats.push(destCoords.lat);
  }
  route?.forEach((point) => {
    lngs.push(point.longitude);
    lats.push(point.latitude);
  });

  if (!lngs.length || !lats.length) return null;

  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

export function coordsToMapPosition(
  coords: MapCoords,
  bounds: NonNullable<ReturnType<typeof getRouteBounds>>,
  inset = 0.14
) {
  const lngSpan = bounds.maxLng - bounds.minLng || 0.02;
  const latSpan = bounds.maxLat - bounds.minLat || 0.02;
  const x = (coords.lng - bounds.minLng) / lngSpan;
  const y = 1 - (coords.lat - bounds.minLat) / latSpan;

  return {
    left: `${(inset + x * (1 - inset * 2)) * 100}%`,
    top: `${(inset + y * (1 - inset * 2)) * 100}%`,
  };
}

export function buildStaticMapUrl(options: {
  width: number;
  height: number;
  originCoords?: MapCoords | null;
  destCoords?: MapCoords | null;
  route?: LatLng[];
}): string | null {
  const token = getMapboxToken();
  if (!token) return null;

  const { width, height, originCoords, destCoords, route } = options;
  if (!originCoords || !destCoords) return null;

  const pixelWidth = Math.min(Math.max(Math.round(width * 2), 200), 1280);
  const pixelHeight = Math.min(Math.max(Math.round(height * 2), 120), 1280);
  const overlays: string[] = [];

  if (originCoords) {
    overlays.push(
      `pin-s-a+BFFF07(${originCoords.lng.toFixed(5)},${originCoords.lat.toFixed(5)})`
    );
  }
  if (destCoords) {
    overlays.push(
      `pin-s-b+BFFF07(${destCoords.lng.toFixed(5)},${destCoords.lat.toFixed(5)})`
    );
  }

  if (route && route.length >= 2) {
    const path = simplifyPath(route);
    if (path) overlays.push(`path-5+151B24-0.85(${path})`);
  }

  if (!overlays.length) return null;

  const overlayPath = encodeURIComponent(overlays.join(","));
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${overlayPath}/auto/${pixelWidth}x${pixelHeight}@2x?access_token=${token}&padding=48&logo=false&attribution=false`;
}
