import { supabase } from "@/lib/supabase";

export type LoadLiveTracking = {
  load_id: string;
  carrier_id: string;
  supplier_id: string;
  latitude: number;
  longitude: number;
  speed_mps: number | null;
  heading: number | null;
  accuracy_m: number | null;
  traveled_meters: number | null;
  motion_seconds: number | null;
  avg_speed_mps: number | null;
  is_moving: boolean | null;
  tracking_active: boolean | null;
  started_at: string | null;
  updated_at: string;
  last_recorded_at: string;
};

export type GpsPublishInput = {
  loadId: string;
  supplierId: string;
  latitude: number;
  longitude: number;
  speedMps?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  altitudeM?: number | null;
  recordedAt?: string;
  previous?: LoadLiveTracking | null;
};

const MOTION_THRESHOLD_MPS = 0.45;
const MIN_MOVEMENT_METERS = 3;
export const MAX_ROUTE_SNAP_DISTANCE_M = 2000;
export const GPS_STALE_MS = 15 * 60 * 1000;
export const GPS_DISPLAY_STALE_MS = 72 * 60 * 60 * 1000;

export function hasLiveCarrierPosition(snapshot?: LoadLiveTracking | null) {
  if (!snapshot?.last_recorded_at) return false;
  if (!Number.isFinite(snapshot.latitude) || !Number.isFinite(snapshot.longitude)) return false;
  const age = Date.now() - new Date(snapshot.last_recorded_at).getTime();
  return age >= 0 && age <= GPS_STALE_MS;
}

export function hasDisplayableCarrierTracking(
  snapshot?: LoadLiveTracking | null,
  loadStatus?: string | null
) {
  if (!snapshot?.last_recorded_at) return false;
  if (!Number.isFinite(snapshot.latitude) || !Number.isFinite(snapshot.longitude)) return false;
  const age = Date.now() - new Date(snapshot.last_recorded_at).getTime();
  if (age < 0) return false;

  const status = String(loadStatus || "").toLowerCase();
  if (["in-transit", "loading", "completed", "delivered", "booked"].includes(status)) {
    return age <= GPS_DISPLAY_STALE_MS;
  }

  return age <= GPS_STALE_MS;
}

export function isFreshLiveGps(snapshot?: LoadLiveTracking | null) {
  if (!hasLiveCarrierPosition(snapshot)) return false;
  return Boolean(snapshot?.tracking_active);
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatSpeedMps(speedMps?: number | null, unit: "mph" | "kmh" = "mph") {
  if (speedMps == null || Number.isNaN(speedMps)) return "—";
  if (unit === "mph") return `${(Math.max(0, speedMps) * 2.23694).toFixed(1)} mph`;
  return `${(Math.max(0, speedMps) * 3.6).toFixed(1)} km/h`;
}

export function formatMotionDuration(seconds?: number | null) {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainder}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatTraveledDistance(meters?: number | null) {
  if (meters == null || meters <= 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function getClosestRouteProgress(
  coordinates: Array<{ latitude: number; longitude: number }>,
  latitude: number,
  longitude: number
): number | null {
  if (!coordinates.length) return null;
  if (coordinates.length === 1) return 0;

  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  coordinates.forEach((point, index) => {
    const distance = haversineMeters(latitude, longitude, point.latitude, point.longitude);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  if (bestDistance > MAX_ROUTE_SNAP_DISTANCE_M) return null;
  return (bestIndex / (coordinates.length - 1)) * 100;
}

function buildLiveSnapshot(input: GpsPublishInput) {
  const now = input.recordedAt ?? new Date().toISOString();
  const previous = input.previous;
  const deviceSpeed =
    input.speedMps != null && Number.isFinite(input.speedMps) && input.speedMps > 0
      ? input.speedMps
      : null;

  let traveledMeters = previous?.traveled_meters ?? 0;
  let motionSeconds = previous?.motion_seconds ?? 0;
  const startedAt = previous?.started_at ?? now;
  let speed = 0;
  let isMoving = false;

  if (previous) {
    const deltaSeconds = Math.max(
      1,
      Math.round((new Date(now).getTime() - new Date(previous.last_recorded_at).getTime()) / 1000)
    );
    const deltaMeters = haversineMeters(
      previous.latitude,
      previous.longitude,
      input.latitude,
      input.longitude
    );
    const derivedSpeed = deltaMeters / deltaSeconds;

    if (deltaMeters >= MIN_MOVEMENT_METERS) {
      traveledMeters += deltaMeters;
    }

    speed = deviceSpeed ?? derivedSpeed;
    isMoving =
      speed >= MOTION_THRESHOLD_MPS ||
      (deltaMeters >= MIN_MOVEMENT_METERS && derivedSpeed >= MOTION_THRESHOLD_MPS);

    if (isMoving && deltaSeconds > 0 && deltaSeconds <= 180) {
      motionSeconds += deltaSeconds;
    }
  } else if (deviceSpeed != null) {
    speed = deviceSpeed;
    isMoving = speed >= MOTION_THRESHOLD_MPS;
  }

  const elapsedSeconds = Math.max(
    1,
    Math.round((new Date(now).getTime() - new Date(startedAt).getTime()) / 1000)
  );
  const avgSpeedMps = traveledMeters > 0 ? traveledMeters / elapsedSeconds : speed;

  return { traveledMeters, motionSeconds, avgSpeedMps, isMoving, startedAt, now, speed };
}

export async function fetchLoadLiveTracking(loadId: string): Promise<LoadLiveTracking | null> {
  const { data, error } = await supabase
    .from("load_live_tracking")
    .select("*")
    .eq("load_id", loadId)
    .maybeSingle();

  if (error) {
    if (/load_live_tracking|schema cache|does not exist/i.test(error.message)) {
      return null;
    }
    throw error;
  }

  return (data as LoadLiveTracking | null) ?? null;
}

export function subscribeLoadLiveTracking(
  loadId: string,
  onUpdate: (snapshot: LoadLiveTracking) => void
) {
  const channel = supabase
    .channel(`load-live-tracking-${loadId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "load_live_tracking",
        filter: `load_id=eq.${loadId}`,
      },
      (payload) => {
        const next = (payload.new ?? payload.old) as LoadLiveTracking | null;
        if (next?.load_id) onUpdate(next);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function fetchLoadLocationHistory(loadId: string, limit = 120) {
  const { data, error } = await supabase
    .from("load_location_updates")
    .select("latitude, longitude, recorded_at, speed_mps")
    .eq("load_id", loadId)
    .order("recorded_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (/load_location_updates|schema cache|does not exist/i.test(error.message)) {
      return [];
    }
    throw error;
  }

  return data ?? [];
}
