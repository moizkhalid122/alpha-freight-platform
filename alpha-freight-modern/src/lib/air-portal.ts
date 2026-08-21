import { AIR_EXTENDED_SHIPMENT_TYPES, AIR_HUBS } from "@/lib/air-hubs-data";

export type AirRole = "carrier" | "supplier";

export const AIR_PORTAL = {
  onboarding: "/air/onboarding",
  forwarderDashboard: "/air/forwarder/dashboard",
  shipperDashboard: "/air/shipper/dashboard",
  login: "/auth/air/login",
  signup: "/auth/air/signup",
} as const;

export function airDashboardPath(role: string | null | undefined): string {
  return role === "carrier" ? AIR_PORTAL.forwarderDashboard : AIR_PORTAL.shipperDashboard;
}

export function airRoleLabel(role: AirRole): string {
  return role === "carrier" ? "Forwarder" : "Shipper";
}

export function airOnboardingStorageKey(userId: string) {
  return `af_air_onboarding_${userId}`;
}

export type AirOnboardingData = {
  companyName: string;
  iataCode: string;
  primaryAirport: string;
  shipmentTypes: string[];
  phone: string;
  completedAt?: string;
};

export const AIR_SHIPMENT_TYPES = AIR_EXTENDED_SHIPMENT_TYPES;

export { AIR_HUBS };

export const FORWARDER_NAV = [
  { href: "/air/forwarder/dashboard", label: "Overview", icon: "layout" },
  { href: "/air/forwarder/dashboard#shipments", label: "Available AWBs", icon: "plane" },
  { href: "/air/forwarder/dashboard#lanes", label: "Lanes & rates", icon: "globe" },
  { href: "/air/forwarder/dashboard#wallet", label: "Settlement", icon: "wallet" },
] as const;

export const SHIPPER_NAV = [
  { href: "/air/shipper/dashboard", label: "Overview", icon: "layout" },
  { href: "/air/shipper/dashboard#post", label: "Post shipment", icon: "plus" },
  { href: "/air/shipper/dashboard#track", label: "Track AWB", icon: "search" },
  { href: "/air/shipper/dashboard#billing", label: "Billing", icon: "wallet" },
] as const;
