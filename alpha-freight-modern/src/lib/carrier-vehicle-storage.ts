"use client";

export type StoredVehicleRow = {
  id: string;
  name: string | null;
  status: string | null;
  carrier_id: string;
  source?: "supabase" | "local";
};

export type StoredVehicleDocumentKey =
  | "registrationCertificate"
  | "insuranceCertificate"
  | "motCertificate"
  | "inspectionReport";

export type StoredVehicleProfile = {
  registrationNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  year: string;
  color: string;
  weightCapacityKg: string;
  lengthMeters: string;
  fuelType: string;
  transmission: string;
  currentMileage: string;
  lastServiceDate: string;
  nextServiceDue: string;
  vehicleStatus: string;
  gpsTrackerId: string;
  companyDescription: string;
  serviceAreas: string;
  specializations: string;
  insuranceExpiryDate: string;
  motExpiryDate: string;
  driverName: string;
  driverLicenseNo: string;
  driverPhone: string;
  driverEmail: string;
  assignedDate: string;
  savedAt: string;
  documentNames: Partial<Record<StoredVehicleDocumentKey, string>>;
  documentUrls: Partial<Record<StoredVehicleDocumentKey, string>>;
  verificationStatus?: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  requestedInfoAt?: string;
};

const LOCAL_VEHICLES_PREFIX = "alpha-local-vehicles:";
const VEHICLE_PROFILES_KEY = "alpha-vehicle-profiles";

const parseJson = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getLocalVehiclesKey = (userId: string) => `${LOCAL_VEHICLES_PREFIX}${userId}`;

export const readLocalVehicles = (userId: string): StoredVehicleRow[] => {
  if (typeof window === "undefined") return [];
  return parseJson<StoredVehicleRow[]>(
    window.localStorage.getItem(getLocalVehiclesKey(userId)),
    []
  );
};

export const writeLocalVehicles = (userId: string, vehicles: StoredVehicleRow[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getLocalVehiclesKey(userId), JSON.stringify(vehicles));
};

export const mergeStoredVehicleRows = (
  primaryVehicles: StoredVehicleRow[],
  secondaryVehicles: StoredVehicleRow[]
) => {
  const merged = new Map<string, StoredVehicleRow>();

  [...secondaryVehicles, ...primaryVehicles].forEach((vehicle) => {
    merged.set(vehicle.id, vehicle);
  });

  return Array.from(merged.values());
};

export const upsertLocalVehicle = (userId: string, vehicle: StoredVehicleRow) => {
  const currentVehicles = readLocalVehicles(userId);
  writeLocalVehicles(userId, mergeStoredVehicleRows([vehicle], currentVehicles));
};

export const readVehicleProfiles = (): Record<string, StoredVehicleProfile> => {
  if (typeof window === "undefined") return {};
  return parseJson<Record<string, StoredVehicleProfile>>(
    window.localStorage.getItem(VEHICLE_PROFILES_KEY),
    {}
  );
};

export const writeVehicleProfiles = (profiles: Record<string, StoredVehicleProfile>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VEHICLE_PROFILES_KEY, JSON.stringify(profiles));
};

export const mergeVehicleProfile = (
  vehicleId: string,
  patch: Partial<StoredVehicleProfile>
) => {
  const currentProfiles = readVehicleProfiles();
  const nextProfiles = {
    ...currentProfiles,
    [vehicleId]: {
      ...currentProfiles[vehicleId],
      ...patch,
    },
  };

  writeVehicleProfiles(nextProfiles);
  return nextProfiles[vehicleId];
};

export const readAllLocalVehicles = (): StoredVehicleRow[] => {
  if (typeof window === "undefined") return [];

  const vehicles: StoredVehicleRow[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(LOCAL_VEHICLES_PREFIX)) continue;

    vehicles.push(...parseJson<StoredVehicleRow[]>(window.localStorage.getItem(key), []));
  }

  return vehicles;
};
