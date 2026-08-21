import {
  AIR_HUB_ENTRIES,
  getHubEntryByLabel,
  hubEntryLabel,
  type AirHubEntry,
} from "@/lib/air-hubs-data";

export type AirHubCoords = {
  lng: number;
  lat: number;
  city: string;
  code: string;
};

export const AIR_HUB_COORDS: Record<string, AirHubCoords> = Object.fromEntries(
  AIR_HUB_ENTRIES.map((entry) => [
    entry.code,
    { lng: entry.lng, lat: entry.lat, city: entry.city, code: entry.code },
  ])
);

export function getHubCode(hubLabel: string): string {
  const match = hubLabel.match(/\(([A-Z0-9]+)\)/);
  return match?.[1] ?? getHubEntryByLabel(hubLabel)?.code ?? hubLabel.slice(0, 3).toUpperCase();
}

export function getHubCoords(hubLabel: string): AirHubCoords | null {
  const code = getHubCode(hubLabel);
  return AIR_HUB_COORDS[code] ?? null;
}

export function getHubCity(hubLabel: string): string {
  return getHubEntryByLabel(hubLabel)?.city ?? getHubCoords(hubLabel)?.city ?? hubLabel.split("(")[0]?.trim() ?? hubLabel;
}

export function getHubEntry(hubLabel: string): AirHubEntry | undefined {
  return getHubEntryByLabel(hubLabel);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function flightDistanceKm(originHub: string, destinationHub: string): number {
  const origin = getHubCoords(originHub);
  const destination = getHubCoords(destinationHub);
  if (!origin || !destination) return 0;
  return Math.round(haversineKm(origin.lat, origin.lng, destination.lat, destination.lng));
}

export function buildFlightArc(
  start: { lng: number; lat: number },
  end: { lng: number; lat: number },
  points = 72
): [number, number][] {
  const coords: [number, number][] = [];
  const lat1 = toRadians(start.lat);
  const lon1 = toRadians(start.lng);
  const lat2 = toRadians(end.lat);
  const lon2 = toRadians(end.lng);

  const delta =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );

  if (delta === 0) return [[start.lng, start.lat], [end.lng, end.lat]];

  for (let index = 0; index <= points; index += 1) {
    const fraction = index / points;
    const a = Math.sin((1 - fraction) * delta) / Math.sin(delta);
    const b = Math.sin(fraction * delta) / Math.sin(delta);
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    coords.push([(Math.atan2(y, x) * 180) / Math.PI, (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI]);
  }

  return coords;
}

export function estimateAirQuote(options: {
  weightKg: number;
  distanceKm: number;
  cargoType: string;
  urgency: string;
}): number {
  const { weightKg, distanceKm, cargoType, urgency } = options;
  const base = 120;
  const perKg =
    cargoType === "express"
      ? 8.5
      : cargoType === "charter"
        ? 12
        : cargoType === "dangerous"
          ? 9.2
          : cargoType === "live_animals" || cargoType === "valuables"
            ? 10.5
            : 6.8;
  const distanceFactor = distanceKm * 0.045;
  const urgencyMultiplier =
    urgency === "vip" ? 1.35 : urgency === "express" ? 1.22 : urgency === "same_day" ? 1.5 : 1;
  return Math.round((base + weightKg * perKg + distanceFactor) * urgencyMultiplier);
}

export function formatFlightDuration(distanceKm: number): string {
  const cruiseSpeedKmh = 850;
  const hours = distanceKm / cruiseSpeedKmh;
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (wholeHours <= 0) return `${minutes}m est.`;
  return `${wholeHours}h ${minutes}m est.`;
}
