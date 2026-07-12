import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import {
  fetchCarrierInTransitLoads,
  fetchLoadLiveTracking,
  publishLoadGpsUpdate,
  stopLoadLiveTracking,
} from "@/lib/load-gps-tracking";

export const CARRIER_GPS_TASK = "carrier-load-gps";
const SESSION_KEY = "alpha-freight:carrier-gps-session";
const MIN_PUBLISH_INTERVAL_MS = 5000;

export type CarrierGpsSession = {
  loadId: string;
  supplierId: string;
  startedAt: string;
};

type WatchSubscription = Location.LocationSubscription | null;

let foregroundSubscription: WatchSubscription = null;
let lastPublishAt = 0;

async function readSession(): Promise<CarrierGpsSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CarrierGpsSession;
  } catch {
    return null;
  }
}

async function writeSession(session: CarrierGpsSession | null) {
  if (!session) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

async function publishLocation(
  location: Location.LocationObject,
  session: CarrierGpsSession,
  force = false
) {
  const now = Date.now();
  if (!force && now - lastPublishAt < MIN_PUBLISH_INTERVAL_MS) return;

  const previous = await fetchLoadLiveTracking(session.loadId);
  const published = await publishLoadGpsUpdate({
    loadId: session.loadId,
    supplierId: session.supplierId,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    speedMps: location.coords.speed,
    heading: location.coords.heading ?? null,
    accuracyM: location.coords.accuracy ?? null,
    altitudeM: location.coords.altitude ?? null,
    recordedAt: location.timestamp ? new Date(location.timestamp).toISOString() : undefined,
    previous,
  });

  if (published) {
    lastPublishAt = now;
  }
}

async function handleLocations(locations: Location.LocationObject[]) {
  const session = await readSession();
  if (!session) return;

  const latest = locations[locations.length - 1];
  if (!latest) return;

  await publishLocation(latest, session);
}

TaskManager.defineTask(CARRIER_GPS_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locations?.length) return;
  await handleLocations(locations);
});

export async function requestCarrierGpsPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    throw new Error("Location permission is required for live shipment tracking.");
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  return {
    foregroundGranted: foreground.granted,
    backgroundGranted: background.granted,
  };
}

async function startBackgroundUpdates() {
  const hasTask = await TaskManager.isTaskRegisteredAsync(CARRIER_GPS_TASK);
  if (!hasTask) return;

  const started = await Location.hasStartedLocationUpdatesAsync(CARRIER_GPS_TASK);
  if (started) return;

  await Location.startLocationUpdatesAsync(CARRIER_GPS_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    distanceInterval: 25,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Alpha Freight tracking",
      notificationBody: "Sharing live location for your active delivery.",
      notificationColor: "#BFFF07",
    },
  });
}

async function stopBackgroundUpdates() {
  const started = await Location.hasStartedLocationUpdatesAsync(CARRIER_GPS_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(CARRIER_GPS_TASK);
  }
}

async function startForegroundWatch(session: CarrierGpsSession) {
  if (foregroundSubscription) return;

  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 8,
    },
    (location) => {
      void publishLocation(location, session);
    }
  );
}

async function stopForegroundWatch() {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }
}

export async function startCarrierGpsTracking(loadId: string, supplierId: string) {
  await requestCarrierGpsPermissions();

  const session: CarrierGpsSession = {
    loadId,
    supplierId,
    startedAt: new Date().toISOString(),
  };

  await writeSession(session);
  lastPublishAt = 0;

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  await publishLocation(current, session, true);

  await startForegroundWatch(session);

  try {
    await startBackgroundUpdates();
  } catch {
    // Background updates may require a rebuilt dev client — foreground tracking still works.
  }
}

export async function stopCarrierGpsTracking(loadId?: string) {
  const session = await readSession();
  const activeLoadId = loadId ?? session?.loadId;

  await stopForegroundWatch();
  await stopBackgroundUpdates();
  await writeSession(null);

  if (activeLoadId) {
    await stopLoadLiveTracking(activeLoadId);
  }
}

export async function syncCarrierGpsTrackingSession() {
  const inTransitLoads = await fetchCarrierInTransitLoads();
  const session = await readSession();

  if (!inTransitLoads.length) {
    if (session) {
      await stopCarrierGpsTracking(session.loadId);
    }
    return;
  }

  const primaryLoad = inTransitLoads[0];
  const nextSession: CarrierGpsSession = {
    loadId: primaryLoad.id,
    supplierId: primaryLoad.supplier_id,
    startedAt: session?.startedAt ?? new Date().toISOString(),
  };

  if (!session || session.loadId !== nextSession.loadId) {
    await startCarrierGpsTracking(nextSession.loadId, nextSession.supplierId);
    return;
  }

  await writeSession(nextSession);
  await startForegroundWatch(nextSession);

  try {
    await startBackgroundUpdates();
  } catch {
    // Foreground-only fallback.
  }
}

export async function getActiveCarrierGpsSession() {
  return readSession();
}
