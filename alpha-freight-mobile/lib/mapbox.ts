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
  return `${normalizePlaceQuery(origin).toLowerCase()}|${normalizePlaceQuery(destination).toLowerCase()}`;
}

const UK_PLACE_ALIASES: Record<string, string> = {
  manchestr: "Manchester, UK",
  manchster: "Manchester, UK",
  mancheste: "Manchester, UK",
  birminghm: "Birmingham, UK",
  birmigham: "Birmingham, UK",
  londom: "London, UK",
  liverpol: "Liverpool, UK",
  glasgo: "Glasgow, UK",
  edinburg: "Edinburgh, UK",
  shefield: "Sheffield, UK",
  notingham: "Nottingham, UK",
  leicster: "Leicester, UK",
};

function normalizePlaceQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;

  const alias = UK_PLACE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  if (!/\b(uk|united kingdom)\b/i.test(trimmed)) {
    return `${trimmed}, UK`;
  }

  return trimmed;
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
  const normalizedQuery = normalizePlaceQuery(query);
  if (!token || !normalizedQuery || normalizedQuery.length < 3) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?access_token=${token}&limit=1&country=${country}&types=place,locality,address,postcode`
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

function simplifyPath(coords: LatLng[], maxPoints = 80): string {
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

export function getPointAlongRoute(coordinates: LatLng[], progress: number): LatLng | null {
  if (!coordinates.length) return null;
  if (progress <= 0) return coordinates[0];
  if (progress >= 100) return coordinates[coordinates.length - 1];

  const targetIndex = (progress / 100) * (coordinates.length - 1);
  const lowerIndex = Math.floor(targetIndex);
  const upperIndex = Math.min(lowerIndex + 1, coordinates.length - 1);
  const blend = targetIndex - lowerIndex;
  const lower = coordinates[lowerIndex];
  const upper = coordinates[upperIndex];

  return {
    latitude: lower.latitude + (upper.latitude - lower.latitude) * blend,
    longitude: lower.longitude + (upper.longitude - lower.longitude) * blend,
  };
}

export function getCompletedRouteSegment(coordinates: LatLng[], progress: number) {
  if (!coordinates.length) return [] as LatLng[];
  if (progress <= 0) return [coordinates[0]];
  if (progress >= 100) return coordinates;

  const targetIndex = Math.max(1, Math.round((progress / 100) * (coordinates.length - 1)));
  return coordinates.slice(0, targetIndex + 1);
}

export function getRouteBearingAtProgress(coordinates: LatLng[], progress: number) {
  if (coordinates.length < 2) return 0;

  const targetIndex = Math.max(
    0,
    Math.min((progress / 100) * (coordinates.length - 1), coordinates.length - 2)
  );
  const fromIndex = Math.floor(targetIndex);
  const toIndex = Math.min(fromIndex + 1, coordinates.length - 1);
  const from = coordinates[fromIndex];
  const to = coordinates[toIndex];

  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
}

function encodeMapboxOverlays(overlays: string[]) {
  // Commas separate overlays — encode each overlay separately, not the joined string.
  return overlays.map((overlay) => encodeURIComponent(overlay)).join(",");
}

export function buildStaticMapUrl(options: {
  width: number;
  height: number;
  originCoords?: MapCoords | null;
  destCoords?: MapCoords | null;
  route?: LatLng[];
  progress?: number;
  live?: boolean;
}): string | null {
  const token = getMapboxToken();
  if (!token) return null;

  const { width, height, originCoords, destCoords, route, progress = 0, live = false } = options;
  if (!originCoords || !destCoords) return null;

  // Mapbox caps output at 1280px; @2x doubles the requested size — keep base dims ≤640.
  const pixelWidth = Math.min(Math.max(Math.round(width), 120), 640);
  const pixelHeight = Math.min(Math.max(Math.round(height), 120), 640);
  const overlays: string[] = [];
  const routeCoords = route ?? [];

  if (routeCoords.length >= 2) {
    if (live && progress > 0 && progress < 100) {
      const completed = getCompletedRouteSegment(routeCoords, progress);
      const completedPath = simplifyPath(completed, 60);
      const remainingPath = simplifyPath(routeCoords, 80);

      if (remainingPath) {
        overlays.push(`path-5+C5CBD0-0.95(${remainingPath})`);
      }
      if (completed.length >= 2 && completedPath) {
        overlays.push(`path-7+BFFF07-1(${completedPath})`);
      }
    } else {
      const path = simplifyPath(routeCoords);
      if (path) overlays.push(`path-6+151B24-0.92(${path})`);
    }

    if (live) {
      const vehiclePoint = getPointAlongRoute(routeCoords, progress);
      if (vehiclePoint) {
        overlays.push(
          `pin-l-c+BFFF07(${vehiclePoint.longitude.toFixed(5)},${vehiclePoint.latitude.toFixed(5)})`
        );
      }
    }
  }

  overlays.push(
    `pin-s-a+BFFF07(${originCoords.lng.toFixed(5)},${originCoords.lat.toFixed(5)})`
  );
  overlays.push(`pin-s-b+151B24(${destCoords.lng.toFixed(5)},${destCoords.lat.toFixed(5)})`);

  if (!overlays.length) return null;

  const overlayPath = encodeMapboxOverlays(overlays);
  const padding = live ? "48,48,48,120" : "32,32,32,32";

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlayPath}/auto/${pixelWidth}x${pixelHeight}@2x?access_token=${token}&logo=false&attribution=false&padding=${padding}`;
}
