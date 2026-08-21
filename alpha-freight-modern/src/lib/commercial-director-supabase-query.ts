import type { SupabaseClient } from "@supabase/supabase-js";

const LOAD_LIST_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state";

export async function fetchCommercialLoads(db: SupabaseClient) {
  const { data, error } = await db
    .from("loads")
    .select(LOAD_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    return { loads: [], error };
  }

  return {
    loads: data ?? [],
    error: null,
  };
}
