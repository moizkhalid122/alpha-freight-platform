import type { AirRole } from "@/lib/air-portal";

export type AirShipment = {
  id: string;
  awb: string;
  origin: string;
  destination: string;
  weightKg: number;
  cargoType: string;
  status: "pending" | "booked" | "in_transit" | "delivered";
  rate?: string;
  createdAt: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pieces?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  cargoValue?: number;
  packaging?: string;
  urgency?: string;
  pickupDate?: string;
  pickupTime?: string;
  deliveryDate?: string;
  specialHandling?: string[];
  shipperContact?: string;
  consigneeName?: string;
  consigneePhone?: string;
  customsRequired?: boolean;
  insurance?: boolean;
  notes?: string;
  estimatedQuote?: string;
  flightDistanceKm?: number;
  commodityCategory?: string;
  commodityDescription?: string;
  hsCode?: string;
  currency?: string;
  incoterm?: string;
  consigneeCountry?: string;
};

export type AirLane = {
  id: string;
  route: string;
  ratePerKg: string;
  frequency: string;
};

export type AirBooking = {
  id: string;
  awb: string;
  route: string;
  weight: string;
  rate: string;
  status: "confirmed" | "in_transit" | "completed";
  bookedAt: string;
};

function storageKey(userId: string, suffix: string) {
  return `af_air_${suffix}_${userId}`;
}

export function getAirShipments(userId: string): AirShipment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId, "shipments")) || "[]") as AirShipment[];
  } catch {
    return [];
  }
}

export function saveAirShipment(userId: string, shipment: AirShipment) {
  const existing = getAirShipments(userId);
  localStorage.setItem(storageKey(userId, "shipments"), JSON.stringify([shipment, ...existing]));
}

export function getAirLanes(userId: string): AirLane[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId, "lanes")) || "[]") as AirLane[];
  } catch {
    return [];
  }
}

export function saveAirLane(userId: string, lane: AirLane) {
  const existing = getAirLanes(userId);
  localStorage.setItem(storageKey(userId, "lanes"), JSON.stringify([lane, ...existing]));
}

export function getAirBookings(userId: string): AirBooking[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId, "bookings")) || "[]") as AirBooking[];
  } catch {
    return [];
  }
}

export function saveAirBooking(userId: string, booking: AirBooking) {
  const existing = getAirBookings(userId);
  localStorage.setItem(storageKey(userId, "bookings"), JSON.stringify([booking, ...existing]));
}

export function generateAwb() {
  return `AWB-${Math.floor(1000000 + Math.random() * 9000000)}`;
}

export const DEMO_AWBS = [
  { awb: "AWB-7849201", route: "LHR → DXB", weight: "420 kg", rate: "£2,840", weightKg: 420 },
  { awb: "AWB-7849202", route: "MAN → AMS", weight: "180 kg", rate: "£960", weightKg: 180 },
  { awb: "AWB-7849203", route: "STN → FRA", weight: "650 kg", rate: "£3,120", weightKg: 650 },
  { awb: "AWB-7849204", route: "LHR → JFK", weight: "320 kg", rate: "£4,200", weightKg: 320 },
  { awb: "AWB-7849205", route: "BHX → DXB", weight: "90 kg", rate: "£680", weightKg: 90 },
];

export const DEMO_TRACK = [
  { awb: "AWB-9012847", status: "In flight", route: "LHR → JFK", eta: "14 Aug, 18:30" },
  { awb: "AWB-9012848", status: "Customs cleared", route: "MAN → DXB", eta: "15 Aug, 09:00" },
  { awb: "AWB-7849201", status: "At origin", route: "LHR → DXB", eta: "16 Aug, 06:00" },
];

export type AirNavIcon =
  | "layout"
  | "plane"
  | "globe"
  | "wallet"
  | "plus"
  | "search"
  | "box"
  | "file"
  | "user"
  | "help"
  | "clock"
  | "receipt";

export type AirNavItem = {
  name: string;
  path: string;
  icon: AirNavIcon;
  badge?: string;
};

export type AirNavCategory = {
  name: string;
  items: AirNavItem[];
};

export function getForwarderSidebar(): AirNavCategory[] {
  return [
    {
      name: "OVERVIEW",
      items: [{ name: "Dashboard", path: "/air/forwarder/dashboard", icon: "layout" }],
    },
    {
      name: "OPERATIONS",
      items: [
        { name: "Available AWBs", path: "/air/forwarder/awbs", icon: "plane", badge: "LIVE" },
        { name: "My bookings", path: "/air/forwarder/bookings", icon: "box" },
        { name: "Lanes & rates", path: "/air/forwarder/lanes", icon: "globe" },
        { name: "Documents", path: "/air/forwarder/documents", icon: "file" },
      ],
    },
    {
      name: "FINANCE",
      items: [{ name: "Settlement", path: "/air/forwarder/settlement", icon: "wallet" }],
    },
    {
      name: "ACCOUNT",
      items: [
        { name: "Profile", path: "/air/forwarder/profile", icon: "user" },
        { name: "Support", path: "/air/forwarder/support", icon: "help" },
      ],
    },
  ];
}

export function getShipperSidebar(): AirNavCategory[] {
  return [
    {
      name: "OVERVIEW",
      items: [{ name: "Dashboard", path: "/air/shipper/dashboard", icon: "layout" }],
    },
    {
      name: "SHIPMENTS",
      items: [
        { name: "Post shipment", path: "/air/shipper/post", icon: "plus" },
        { name: "My shipments", path: "/air/shipper/shipments", icon: "box" },
        { name: "Track AWB", path: "/air/shipper/track", icon: "search" },
      ],
    },
    {
      name: "FINANCE",
      items: [{ name: "Billing", path: "/air/shipper/billing", icon: "receipt" }],
    },
    {
      name: "ACCOUNT",
      items: [
        { name: "Profile", path: "/air/shipper/profile", icon: "user" },
        { name: "Support", path: "/air/shipper/support", icon: "help" },
      ],
    },
  ];
}

export function airProfilePath(role: AirRole) {
  return role === "carrier" ? "/air/forwarder/profile" : "/air/shipper/profile";
}
