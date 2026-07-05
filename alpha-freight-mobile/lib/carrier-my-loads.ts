import { Ionicons } from "@expo/vector-icons";
import { formatMoney } from "@/lib/carrier-dashboard";
import { supabase } from "@/lib/supabase";
import { AvailableLoad } from "@/lib/available-loads";

const ACTIVE_STATUSES = ["active", "booked", "assigned", "pending", "loading"];
const TRANSIT_STATUSES = ["in-transit"];
const COMPLETED_STATUSES = ["completed", "delivered"];

export type MyLoadsFilter = "all" | "active" | "transit" | "completed";

export type CarrierMyLoad = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  price: number;
  priceLabel: string;
  equipment: string;
  commodity: string;
  status: string;
  statusLabel: string;
  pickupDate: string;
  pickupLabel: string;
  deliveryLabel: string;
  updatedLabel: string;
  title: string;
};

export type CarrierMyLoadsData = {
  fullName: string;
  stats: {
    total: number;
    active: number;
    inTransit: number;
    completed: number;
    earnings: number;
  };
  loads: CarrierMyLoad[];
};

export const MY_LOAD_FILTERS: {
  id: MyLoadsFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "all", label: "All", icon: "layers-outline" },
  { id: "active", label: "Active", icon: "time-outline" },
  { id: "transit", label: "In transit", icon: "navigate-outline" },
  { id: "completed", label: "Completed", icon: "checkmark-done-outline" },
];

function formatDateLabel(value?: string | null, fallback = "Date TBC") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatUpdatedLabel(value?: string | null) {
  if (!value) return "Updated recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated recently";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Updated today";
  return `Updated ${formatDateLabel(value)}`;
}

export function getAssignedStatusButtons(status: string): {
  label: string;
  nextStatus: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
}[] {
  const value = status.toLowerCase();
  const pickupEnabled = ["booked", "assigned", "pending", "active", "accepted"].includes(value);
  const deliveryEnabled = ["in-transit", "loading"].includes(value);

  return [
    {
      label: "Confirm pickup",
      nextStatus: "in-transit",
      icon: "navigate-outline",
      enabled: pickupEnabled,
    },
    {
      label: "Mark delivered",
      nextStatus: "delivered",
      icon: "checkmark-done-outline",
      enabled: deliveryEnabled,
    },
  ];
}

export function getNextStatusActions(status: string): {
  label: string;
  description: string;
  nextStatus: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] {
  const value = status.toLowerCase();
  if (["booked", "assigned", "pending", "active", "accepted"].includes(value)) {
    return [
      {
        label: "Confirm pickup",
        description: "Move this shipment to in transit",
        nextStatus: "in-transit",
        icon: "navigate-outline",
      },
    ];
  }
  if (["in-transit", "loading"].includes(value)) {
    return [
      {
        label: "Mark delivered",
        description: "Complete delivery and close the route",
        nextStatus: "delivered",
        icon: "checkmark-done-outline",
      },
    ];
  }
  return [];
}

export async function updateCarrierLoadStatus(
  loadId: string,
  newStatus: string
): Promise<CarrierMyLoadsData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { error } = await supabase
    .from("loads")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", loadId)
    .eq("carrier_id", user.id);

  if (error) throw error;

  return fetchCarrierMyLoads();
}

export function getLoadStatusMeta(status: string) {
  const value = status.toLowerCase();
  if (COMPLETED_STATUSES.includes(value)) {
    return { label: "Delivered", tone: "success" as const };
  }
  if (TRANSIT_STATUSES.includes(value)) {
    return { label: "In transit", tone: "transit" as const };
  }
  if (value === "loading") {
    return { label: "Loading", tone: "transit" as const };
  }
  if (value === "booked" || value === "assigned") {
    return { label: "Booked", tone: "active" as const };
  }
  if (ACTIVE_STATUSES.includes(value)) {
    return { label: "Active", tone: "active" as const };
  }
  return { label: status.replace(/-/g, " "), tone: "muted" as const };
}

export function myLoadToAvailableLoad(load: CarrierMyLoad): AvailableLoad {
  return {
    id: load.id,
    code: load.code,
    origin: load.origin,
    destination: load.destination,
    price: load.price,
    priceLabel: load.priceLabel,
    equipment: load.equipment,
    commodity: load.commodity,
    pickupDate: load.pickupDate,
    pickupLabel: load.pickupLabel,
    postedLabel: load.updatedLabel,
    isHighPay: load.price >= 500,
    isPickupSoon: false,
  };
}

export function filterMyLoads(
  loads: CarrierMyLoad[],
  filter: MyLoadsFilter,
  search: string
): CarrierMyLoad[] {
  const query = search.trim().toLowerCase();

  return loads.filter((load) => {
    const status = load.status.toLowerCase();
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && ACTIVE_STATUSES.includes(status)) ||
      (filter === "transit" && (TRANSIT_STATUSES.includes(status) || status === "loading")) ||
      (filter === "completed" && COMPLETED_STATUSES.includes(status));

    if (!matchesFilter) return false;
    if (!query) return true;

    return (
      load.origin.toLowerCase().includes(query) ||
      load.destination.toLowerCase().includes(query) ||
      load.code.toLowerCase().includes(query) ||
      load.commodity.toLowerCase().includes(query) ||
      load.equipment.toLowerCase().includes(query)
    );
  });
}

export async function fetchCarrierMyLoads(): Promise<CarrierMyLoadsData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name || profile?.company_name || "Carrier";

  const { data, error } = await supabase
    .from("loads")
    .select(
      "id, origin, destination, pickup_location, delivery_location, price, equipment, vehicle_type, pickup_date, delivery_date, created_at, commodity, title, status"
    )
    .eq("carrier_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchCarrierMyLoads", error);
    throw error;
  }

  const rows = data || [];
  const loads: CarrierMyLoad[] = rows.map((row) => {
    const origin = row.pickup_location || row.origin || "Origin";
    const destination = row.delivery_location || row.destination || "Destination";
    const price = Number(row.price) || 0;
    const status = row.status || "active";
    const statusMeta = getLoadStatusMeta(status);

    return {
      id: row.id,
      code: `LD-${row.id.slice(0, 6).toUpperCase()}`,
      origin,
      destination,
      price,
      priceLabel: formatMoney(price),
      equipment: row.equipment || row.vehicle_type || "Any vehicle",
      commodity: row.commodity || row.title || "General freight",
      status,
      statusLabel: statusMeta.label,
      pickupDate: row.pickup_date || "",
      pickupLabel: formatDateLabel(row.pickup_date, "Pickup TBC"),
      deliveryLabel: formatDateLabel(row.delivery_date, "Delivery TBC"),
      updatedLabel: formatUpdatedLabel(row.created_at),
      title: row.title || `Load ${row.id.slice(0, 6).toUpperCase()}`,
    };
  });

  const active = loads.filter((load) => ACTIVE_STATUSES.includes(load.status.toLowerCase())).length;
  const inTransit = loads.filter((load) =>
    TRANSIT_STATUSES.includes(load.status.toLowerCase()) || load.status.toLowerCase() === "loading"
  ).length;
  const completed = loads.filter((load) =>
    COMPLETED_STATUSES.includes(load.status.toLowerCase())
  ).length;
  const earnings = loads
    .filter((load) => COMPLETED_STATUSES.includes(load.status.toLowerCase()))
    .reduce((sum, load) => sum + load.price, 0);

  return {
    fullName: displayName,
    stats: {
      total: loads.length,
      active,
      inTransit,
      completed,
      earnings,
    },
    loads,
  };
}

export { formatMoney };
