import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCommercialMetricsFromRows } from "@/lib/commercial-director-metrics";
import {
  fetchCommercialEmployees,
  type CommercialProfileRow,
} from "@/lib/commercial-director-profiles-query";

const LOAD_LIST_SELECT =
  "id, supplier_id, carrier_id, origin, destination, pickup_location, delivery_location, price, status, created_at, title, commodity, equipment, weight, pickup_date, delivery_date, payment_route, payment_state";

export async function fetchCommercialBootstrapData(db: SupabaseClient) {
  const [directoryRes, employees, loadsRes, leadsRes, tasksRes, bidsRes, commissionsRes] =
    await Promise.all([
      db
        .from("profiles")
        .select("*")
        .in("role", ["supplier", "carrier"])
        .order("created_at", { ascending: false }),
      fetchCommercialEmployees(db),
      db.from("loads").select(LOAD_LIST_SELECT).order("created_at", { ascending: false }),
      db
        .from("employee_leads")
        .select("id, company_name, contact_name, status, value_gbp, created_at")
        .order("created_at", { ascending: false })
        .limit(120),
      db
        .from("employee_tasks")
        .select("id, title, status, priority, due_date, created_at")
        .order("created_at", { ascending: false })
        .limit(120),
      db
        .from("bids")
        .select("id, load_id, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(120),
      db
        .from("employee_commissions")
        .select("id, amount_gbp, status, period_month, created_at")
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

  const queryError =
    directoryRes.error?.message || loadsRes.error?.message || null;

  if (queryError) {
    throw new Error(queryError);
  }

  const rows = (directoryRes.data ?? []) as CommercialProfileRow[];
  const suppliers = rows.filter((row) => row.role === "supplier");
  const carriers = rows.filter((row) => row.role === "carrier");
  const loads = loadsRes.data ?? [];

  const metrics = buildCommercialMetricsFromRows({
    overview: {
      shippers: suppliers.length,
      forwarders: carriers.length,
      loads: loads.length,
      employees: employees.length,
    },
    loads: loads.slice(0, 120),
    leads: leadsRes.error ? [] : (leadsRes.data ?? []),
    tasks: tasksRes.error ? [] : (tasksRes.data ?? []),
    bids: bidsRes.error ? [] : (bidsRes.data ?? []),
    commissions: commissionsRes.error ? [] : (commissionsRes.data ?? []),
  });

  return {
    metrics,
    network: { suppliers, carriers, employees },
    loads,
  };
}
