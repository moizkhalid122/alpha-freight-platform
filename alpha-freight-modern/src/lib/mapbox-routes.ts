import { MAPBOX_TOKEN } from "@/lib/mapbox";

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
  mancheste: "Manchester, UK",
  birminghm: "Birmingham, UK",
  londom: "London, UK",
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

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} min`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours <= 0) return `${minutes} min`;
  return `${hours}h ${minutes}m`;
}

export async function geocodePlace(query: string, country = "gb"): Promise<MapCoords | null> {
  const token = MAPBOX_TOKEN;
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

  const token = MAPBOX_TOKEN;
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
