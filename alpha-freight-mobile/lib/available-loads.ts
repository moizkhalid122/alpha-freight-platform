import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/carrier-dashboard";

export type AvailableLoad = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  price: number;
  priceLabel: string;
  equipment: string;
  commodity: string;
  pickupDate: string;
  pickupLabel: string;
  postedLabel: string;
  isHighPay: boolean;
  isPickupSoon: boolean;
};

export type AvailableLoadsData = {
  fullName: string;
  loads: AvailableLoad[];
};

function formatPickupDate(value?: string | null) {
  if (!value) return "Pickup TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPostedDate(value?: string | null) {
  if (!value) return "Recently posted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently posted";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Posted today";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function isPickupSoon(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const diff = date.getTime() - Date.now();
  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 3;
}

export async function fetchAvailableLoads(): Promise<AvailableLoadsData | null> {
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
      "id, origin, destination, pickup_location, delivery_location, price, equipment, vehicle_type, pickup_date, created_at, commodity, title, status, carrier_id"
    )
    .eq("status", "active")
    .is("carrier_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetchAvailableLoads", error);
    return { fullName: displayName, loads: [] };
  }

  const loads: AvailableLoad[] = (data || []).map((load) => {
    const price = Number(load.price) || 0;
    const origin = load.origin || load.pickup_location || "UK origin";
    const destination = load.destination || load.delivery_location || "UK destination";
    const equipment = load.equipment || load.vehicle_type || "General freight";
    const commodity = load.commodity || load.title || "Freight shipment";

    return {
      id: load.id,
      code: `AF-${String(load.id).slice(0, 6).toUpperCase()}`,
      origin,
      destination,
      price,
      priceLabel: formatMoney(price),
      equipment,
      commodity,
      pickupDate: load.pickup_date || "",
      pickupLabel: formatPickupDate(load.pickup_date),
      postedLabel: formatPostedDate(load.created_at),
      isHighPay: price >= 500,
      isPickupSoon: isPickupSoon(load.pickup_date),
    };
  });

  return { fullName: displayName, loads };
}

export type LoadFilter = "all" | "high-pay" | "pickup-soon" | "general";

export const LOAD_FILTERS: {
  id: LoadFilter;
  label: string;
  icon: "grid-outline" | "trending-up-outline" | "time-outline" | "cube-outline";
}[] = [
  { id: "all", label: "All loads", icon: "grid-outline" },
  { id: "high-pay", label: "High pay", icon: "trending-up-outline" },
  { id: "pickup-soon", label: "Pickup soon", icon: "time-outline" },
  { id: "general", label: "General", icon: "cube-outline" },
];

export function filterLoads(
  loads: AvailableLoad[],
  filter: LoadFilter,
  search: string
): AvailableLoad[] {
  const query = search.trim().toLowerCase();

  return loads.filter((load) => {
    if (filter === "high-pay" && !load.isHighPay) return false;
    if (filter === "pickup-soon" && !load.isPickupSoon) return false;
    if (filter === "general" && !load.equipment.toLowerCase().includes("general")) return false;

    if (!query) return true;

    const haystack = [
      load.origin,
      load.destination,
      load.equipment,
      load.commodity,
      load.code,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
