import { createClient } from "@supabase/supabase-js";

import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";
import { isValidUkLane, type RateLoadRow } from "@/lib/freight-tools";

const RATE_LOAD_SELECT =
  "id, origin, destination, pickup_location, delivery_location, price, equipment, created_at, status, carrier_id, pickup_date";

const PUBLIC_LOAD_SELECT =
  "id, origin, destination, pickup_location, delivery_location, price, equipment, pickup_date, delivery_date, status, commodity, title, created_at";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return isAdminServiceConfigured() ? getAdminSupabase() : createClient(url, anonKey);
}

export async function fetchPublicRateLoads(limit = 120): Promise<RateLoadRow[]> {
  const db = getDb();
  if (!db) return [];

  const { data, error } = await db
    .from("loads")
    .select(RATE_LOAD_SELECT)
    .gt("price", 0)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchPublicRateLoads]", error);
    return [];
  }

  return (data ?? []) as RateLoadRow[];
}

export type PublicLoadPreview = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  price: number;
  equipment: string;
  pickupDate: string | null;
  commodity: string;
  status: string;
  createdAt: string | null;
};

export async function fetchPublicAvailableLoads(limit = 48): Promise<PublicLoadPreview[]> {
  const db = getDb();
  if (!db) return [];

  const { data, error } = await db
    .from("loads")
    .select(PUBLIC_LOAD_SELECT)
    .in("status", ["active", "available", "pending"])
    .is("carrier_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fetchPublicAvailableLoads]", error);
    return [];
  }

  return (data ?? [])
    .map((load) => {
      const origin = load.origin || load.pickup_location || "";
      const destination = load.destination || load.delivery_location || "";
      return {
        rawOrigin: origin,
        rawDestination: destination,
        id: load.id,
        code: `AF-${String(load.id).slice(0, 8).toUpperCase()}`,
        origin: origin || "UK",
        destination: destination || "UK",
        price: Number(load.price) || 0,
        equipment: load.equipment || "General",
        pickupDate: load.pickup_date,
        commodity: load.commodity || load.title || "Freight",
        status: load.status,
        createdAt: load.created_at,
      };
    })
    .filter((load) => isValidUkLane(load.rawOrigin, load.rawDestination))
    .map(({ rawOrigin: _rawOrigin, rawDestination: _rawDestination, ...load }) => load);
}
