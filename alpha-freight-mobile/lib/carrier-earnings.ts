import { supabase } from "@/lib/supabase";
import { formatWalletMoney } from "@/lib/carrier-wallet";
import { isMissingPodColumnError, isPodVerified } from "@/lib/load-pod-verification";

export type EarningsRange = "week" | "month";

export type EarningsLoadItem = {
  id: string;
  code: string;
  route: string;
  amount: number;
  amountLabel: string;
  status: "completed" | "pending" | "in_transit";
  dateLabel: string;
};

export type EarningsChartPoint = {
  label: string;
  value: number;
};

export type CarrierEarningsData = {
  range: EarningsRange;
  totalEarnings: number;
  completedEarnings: number;
  pendingEarnings: number;
  inTransitEarnings: number;
  completedCount: number;
  pendingCount: number;
  chart: EarningsChartPoint[];
  loads: EarningsLoadItem[];
};

const COMPLETED = new Set(["completed", "delivered"]);
const ACTIVE = new Set(["active", "booked", "assigned", "pending", "in-transit", "loading"]);

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

function formatDayMonth(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getEffectiveDate(row: {
  pod_uploaded_at?: string | null;
  delivery_date?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}) {
  const raw = row.pod_uploaded_at || row.delivery_date || row.updated_at || row.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildChart(
  loads: {
    price: number;
    status: string;
    pod_verification_status?: string | null;
    pod_uploaded_at?: string | null;
    delivery_date?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
  }[],
  range: EarningsRange
): EarningsChartPoint[] {
  const now = new Date();
  const points: EarningsChartPoint[] = [];

  if (range === "week") {
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDay(addDays(now, -i));
      const nextDay = addDays(day, 1);
      const value = loads.reduce((sum, load) => {
        if (!COMPLETED.has(String(load.status).toLowerCase())) return sum;
        const date = getEffectiveDate(load);
        if (!date || date < day || date >= nextDay) return sum;
        return sum + (Number(load.price) || 0);
      }, 0);
      points.push({ label: formatShortDate(day), value });
    }
    return points;
  }

  for (let i = 29; i >= 0; i -= 1) {
    const day = startOfDay(addDays(now, -i));
    const nextDay = addDays(day, 1);
    const value = loads.reduce((sum, load) => {
      if (!COMPLETED.has(String(load.status).toLowerCase())) return sum;
      const date = getEffectiveDate(load);
      if (!date || date < day || date >= nextDay) return sum;
      return sum + (Number(load.price) || 0);
    }, 0);
    if (i % 5 === 0 || i === 0) {
      points.push({ label: formatDayMonth(day), value });
    }
  }

  return points;
}

export async function fetchCarrierEarnings(
  range: EarningsRange = "week"
): Promise<CarrierEarningsData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const selectWithPod =
    "id, price, status, origin, destination, pickup_location, delivery_location, created_at, updated_at, delivery_date, pod_uploaded_at, pod_verification_status";
  const selectFallback =
    "id, price, status, origin, destination, pickup_location, delivery_location, created_at, updated_at, delivery_date";

  const primary = await supabase
    .from("loads")
    .select(selectWithPod)
    .eq("carrier_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  let rows: Record<string, unknown>[] = [];
  if (primary.error && isMissingPodColumnError(primary.error.message)) {
    const fallback = await supabase
      .from("loads")
      .select(selectFallback)
      .eq("carrier_id", user.id)
      .order("created_at", { ascending: false })
      .limit(80);
    if (fallback.error) throw fallback.error;
    rows = (fallback.data ?? []) as Record<string, unknown>[];
  } else if (primary.error) {
    throw primary.error;
  } else {
    rows = (primary.data ?? []) as Record<string, unknown>[];
  }
  const rangeStart =
    range === "week" ? startOfDay(addDays(new Date(), -6)) : startOfDay(addDays(new Date(), -29));

  let completedEarnings = 0;
  let pendingEarnings = 0;
  let inTransitEarnings = 0;
  let completedCount = 0;
  let pendingCount = 0;

  const loads: EarningsLoadItem[] = rows
    .map((row) => {
      const amount = Number(row.price) || 0;
      const status = String(row.status || "").toLowerCase();
      const origin = String(row.pickup_location || row.origin || "Pickup");
      const destination = String(row.delivery_location || row.destination || "Delivery");
      const effectiveDate = getEffectiveDate({
        pod_uploaded_at: row.pod_uploaded_at as string | null,
        delivery_date: row.delivery_date as string | null,
        updated_at: row.updated_at as string | null,
        created_at: row.created_at as string | null,
      });

      let itemStatus: EarningsLoadItem["status"] = "in_transit";
      if (COMPLETED.has(status)) {
        itemStatus = isPodVerified(row.pod_verification_status as string | null)
          ? "completed"
          : "pending";
      } else if (!ACTIVE.has(status)) {
        return null;
      }

      if (effectiveDate && effectiveDate >= rangeStart) {
        if (itemStatus === "completed") {
          completedEarnings += amount;
          completedCount += 1;
        } else if (itemStatus === "pending") {
          pendingEarnings += amount;
          pendingCount += 1;
        } else {
          inTransitEarnings += amount;
        }
      }

      return {
        id: String(row.id),
        code: `LD-${String(row.id).slice(0, 6).toUpperCase()}`,
        route: `${origin} → ${destination}`,
        amount,
        amountLabel: formatWalletMoney(amount),
        status: itemStatus,
        dateLabel: effectiveDate
          ? effectiveDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : "TBC",
      };
    })
    .filter(Boolean) as EarningsLoadItem[];

  const chartLoads = rows.filter((row) => {
    const date = getEffectiveDate({
      pod_uploaded_at: row.pod_uploaded_at as string | null,
      delivery_date: row.delivery_date as string | null,
      updated_at: row.updated_at as string | null,
      created_at: row.created_at as string | null,
    });
    return date ? date >= rangeStart : false;
  });

  return {
    range,
    totalEarnings: completedEarnings + pendingEarnings + inTransitEarnings,
    completedEarnings,
    pendingEarnings,
    inTransitEarnings,
    completedCount,
    pendingCount,
    chart: buildChart(
      chartLoads.map((row) => ({
        price: Number(row.price) || 0,
        status: String(row.status || ""),
        pod_verification_status: row.pod_verification_status as string | null,
        pod_uploaded_at: row.pod_uploaded_at as string | null,
        delivery_date: row.delivery_date as string | null,
        updated_at: row.updated_at as string | null,
        created_at: row.created_at as string | null,
      })),
      range
    ),
    loads,
  };
}
