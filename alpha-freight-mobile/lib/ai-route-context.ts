import {
  fetchDrivingRoute,
  formatDistance,
  formatDuration,
  geocodePlace,
  getMapboxToken,
} from "@/lib/mapbox";
import { isRouteDistanceQuestion, parseRouteFromMessage } from "@/lib/ai-route-detect";

export type AiRouteContext = {
  origin: string;
  destination: string;
  originResolved?: string;
  destinationResolved?: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceLabel: string;
  durationLabel: string;
  hgvDurationLabel: string;
};

function estimateHgvDurationSeconds(carSeconds: number) {
  return Math.round(carSeconds * 1.18);
}

export { isRouteDistanceQuestion, parseRouteFromMessage };

export async function fetchAiRouteContext(message: string): Promise<AiRouteContext | null> {
  if (!getMapboxToken()) return null;

  const parsed = parseRouteFromMessage(message);
  if (!parsed) return null;

  const [originCoords, destCoords] = await Promise.all([
    geocodePlace(parsed.origin),
    geocodePlace(parsed.destination),
  ]);

  if (!originCoords || !destCoords) return null;

  const route = await fetchDrivingRoute(
    parsed.origin,
    parsed.destination,
    originCoords,
    destCoords
  );

  if (!route) return null;

  return {
    origin: parsed.origin,
    destination: parsed.destination,
    originResolved: parsed.origin,
    destinationResolved: parsed.destination,
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    distanceLabel: formatDistance(route.distanceMeters),
    durationLabel: formatDuration(route.durationSeconds),
    hgvDurationLabel: formatDuration(estimateHgvDurationSeconds(route.durationSeconds)),
  };
}
