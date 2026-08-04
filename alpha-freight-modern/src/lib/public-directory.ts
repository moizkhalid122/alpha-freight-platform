import { parseProfileExtras } from "@/lib/platform-data";
import type { CarrierProfileExtras, SupplierProfileExtras } from "@/lib/profile-extras-types";

export type PublicCarrierListing = {
  id: string;
  company_name: string;
  city: string;
  service_areas: string[];
  vehicle_types: string[];
  rating: number;
  reviews: number;
  is_verified: boolean;
  tag: string;
  image: string | null;
  description: string;
};

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  created_at?: string | null;
  status?: string | null;
  verification_status?: string | null;
  is_approved?: boolean | null;
  profile_extras?: unknown;
};

type LoadRecord = {
  carrier_id: string | null;
  status: string | null;
};

const DELIVERED = new Set(["completed", "delivered"]);

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function toList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length ? items : fallback;
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function isVerifiedCarrier(profile: ProfileRecord, extras: CarrierProfileExtras) {
  return (
    normalizeStatus(extras.verificationStatus) === "verified" ||
    normalizeStatus(profile.verification_status) === "verified" ||
    normalizeStatus(profile.status) === "verified" ||
    profile.is_approved === true
  );
}

function buildRating(totalLoads: number, completedLoads: number) {
  if (totalLoads === 0) {
    return { rating: 4.8, reviews: 0 };
  }
  const ratio = completedLoads / Math.max(totalLoads, 1);
  return {
    rating: Number(Math.min(5, 3.8 + ratio * 1.2).toFixed(1)),
    reviews: completedLoads,
  };
}

export function buildPublicCarrierListings(
  profiles: ProfileRecord[],
  loads: LoadRecord[],
): PublicCarrierListing[] {
  const loadGroups = new Map<string, LoadRecord[]>();

  loads.forEach((load) => {
    if (!load.carrier_id) return;
    const current = loadGroups.get(load.carrier_id) ?? [];
    current.push(load);
    loadGroups.set(load.carrier_id, current);
  });

  return profiles
    .map((profile) => {
      const extras = parseProfileExtras<CarrierProfileExtras>(profile.profile_extras);
      if (!isVerifiedCarrier(profile, extras)) return null;

      const carrierLoads = loadGroups.get(profile.id) ?? [];
      const completedLoads = carrierLoads.filter((load) =>
        DELIVERED.has(normalizeStatus(load.status)),
      ).length;
      const { rating, reviews } = buildRating(carrierLoads.length, completedLoads);
      const city = extras.city?.trim() || "United Kingdom";
      const vehicleTypes = toList(extras.vehicleTypes, ["General haulage"]);
      const serviceAreas = toList(extras.operatingRegion, ["UK"]);
      const companyName =
        extras.companyName?.trim() ||
        profile.company_name?.trim() ||
        profile.full_name?.trim() ||
        "Verified carrier";

      return {
        id: profile.id,
        company_name: companyName,
        city,
        service_areas: serviceAreas,
        vehicle_types: vehicleTypes,
        rating,
        reviews,
        is_verified: true,
        tag: "Verified on Alpha",
        image: extras.logoUrl ?? extras.avatarUrl ?? null,
        description:
          extras.description?.trim() ||
          `${companyName} is a verified Alpha Freight carrier operating across ${serviceAreas.slice(0, 3).join(", ")}.`,
      } satisfies PublicCarrierListing;
    })
    .filter(Boolean) as PublicCarrierListing[];
}

export type PublicSupplierListing = {
  id: string;
  name: string;
  city: string;
  category: string;
  services: string[];
  rating: number;
  reviews: number;
  is_verified: boolean;
  tag: string;
  image: string | null;
  description: string;
};

type SupplierLoadRecord = {
  supplier_id: string | null;
  status: string | null;
};

function isVerifiedSupplier(profile: ProfileRecord) {
  return (
    normalizeStatus(profile.verification_status) === "verified" ||
    normalizeStatus(profile.status) === "verified" ||
    profile.is_approved === true
  );
}

export function buildPublicSupplierListings(
  profiles: ProfileRecord[],
  loads: SupplierLoadRecord[],
): PublicSupplierListing[] {
  const loadGroups = new Map<string, SupplierLoadRecord[]>();

  loads.forEach((load) => {
    if (!load.supplier_id) return;
    const current = loadGroups.get(load.supplier_id) ?? [];
    current.push(load);
    loadGroups.set(load.supplier_id, current);
  });

  return profiles
    .map((profile) => {
      if (!isVerifiedSupplier(profile)) return null;

      const extras = parseProfileExtras<SupplierProfileExtras>(profile.profile_extras);
      const supplierLoads = loadGroups.get(profile.id) ?? [];
      const completedLoads = supplierLoads.filter((load) =>
        DELIVERED.has(normalizeStatus(load.status)),
      ).length;
      const { rating, reviews } = buildRating(supplierLoads.length, completedLoads);
      const city = extras.city?.trim() || extras.address?.trim() || "United Kingdom";
      const category = extras.industry?.trim() || "General";
      const services = toList(extras.commodity, ["Freight posting", "Load management"]);
      const companyName =
        extras.companyName?.trim() ||
        profile.company_name?.trim() ||
        profile.full_name?.trim() ||
        "Verified supplier";

      return {
        id: profile.id,
        name: companyName,
        city,
        category,
        services,
        rating,
        reviews,
        is_verified: true,
        tag: "Verified on Alpha",
        image: extras.avatarUrl ?? extras.bannerUrl ?? null,
        description:
          `${companyName} is a verified Alpha Freight supplier` +
          (extras.commodity?.trim() ? ` shipping ${extras.commodity.trim()}.` : " posting freight on the platform."),
      } satisfies PublicSupplierListing;
    })
    .filter(Boolean) as PublicSupplierListing[];
}
