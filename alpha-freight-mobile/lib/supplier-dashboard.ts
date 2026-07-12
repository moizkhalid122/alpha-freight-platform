import { supabase } from "@/lib/supabase";
import { needsSupplierPodReview } from "@/lib/load-pod-verification";

export type SupplierRecentLoad = {
  id: string;
  origin: string;
  destination: string;
  status: string;
  price: string;
  paymentState: string;
  createdLabel: string;
};

export type SupplierDashboardData = {
  fullName: string;
  initials: string;
  totalLoads: number;
  activeLoads: number;
  pendingBids: number;
  pendingPayments: number;
  podReviewCount: number;
  totalSpend: number;
  recentLoads: SupplierRecentLoad[];
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatLoadMoney(value: unknown) {
  const amount = Number(value) || 0;
  return formatMoney(amount);
}

function formatDateLabel(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

const ACTIVE_STATUSES = new Set(["active", "booked", "in-transit", "loading", "assigned", "pending"]);

export async function fetchSupplierDashboard(): Promise<SupplierDashboardData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name || profile?.company_name || "Supplier";

  const { data: loads } = await supabase
    .from("loads")
    .select(
      "id, origin, destination, price, status, payment_state, pod_url, pod_verification_status, created_at"
    )
    .eq("supplier_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const safeLoads = loads ?? [];
  const loadIds = safeLoads.map((load) => String(load.id));

  let pendingBids = 0;
  if (loadIds.length) {
    const { count } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .in("load_id", loadIds)
      .eq("status", "pending");
    pendingBids = count ?? 0;
  }

  let pendingPayments = 0;
  const { data: payments, error: paymentError } = await supabase
    .from("supplier_payments")
    .select("payment_state")
    .eq("supplier_id", user.id);

  if (!paymentError) {
    pendingPayments = (payments ?? []).filter(
      (row) => String(row.payment_state ?? "").toLowerCase() !== "paid"
    ).length;
  } else {
    pendingPayments = safeLoads.filter((load) => {
      const paymentState = String(load.payment_state ?? "").toLowerCase();
      return paymentState !== "paid";
    }).length;
  }

  const activeLoads = safeLoads.filter((load) =>
    ACTIVE_STATUSES.has(String(load.status ?? "").toLowerCase())
  ).length;

  const podReviewCount = safeLoads.filter((load) =>
    needsSupplierPodReview({
      pod_url: load.pod_url as string | null,
      pod_verification_status: load.pod_verification_status as string | null,
      status: load.status as string | null,
    })
  ).length;

  const totalSpend = safeLoads.reduce((sum, load) => sum + (Number(load.price) || 0), 0);

  const recentLoads: SupplierRecentLoad[] = safeLoads.slice(0, 5).map((load) => ({
    id: String(load.id),
    origin: String(load.origin || "Origin"),
    destination: String(load.destination || "Destination"),
    status: String(load.status || "active"),
    price: formatLoadMoney(load.price),
    paymentState: String(load.payment_state || "pending"),
    createdLabel: formatDateLabel(String(load.created_at || "")),
  }));

  return {
    fullName: displayName,
    initials: getInitials(displayName),
    totalLoads: safeLoads.length,
    activeLoads,
    pendingBids,
    pendingPayments,
    podReviewCount,
    totalSpend,
    recentLoads,
  };
}

export { formatMoney as formatSupplierMoney };
