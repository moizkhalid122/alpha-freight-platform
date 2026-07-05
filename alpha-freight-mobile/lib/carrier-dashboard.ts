import { supabase } from "@/lib/supabase";

const ACTIVE_STATUSES = ["active", "booked", "assigned", "pending", "in-transit", "loading"];
const COMPLETED_STATUSES = ["completed", "delivered"];

export type CarrierActivity = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  origin: string;
  destination: string;
  amount: string;
  positive: boolean;
};

export type CarrierDashboardData = {
  fullName: string;
  initials: string;
  verificationStatus: "verified" | "pending" | "review";
  earnings: number;
  activeLoads: number;
  completedLoads: number;
  availableLoads: number;
  recentActivity: CarrierActivity[];
};

function parseExtras(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeVerificationStatus(
  value: unknown
): CarrierDashboardData["verificationStatus"] | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "verified" || raw === "approved") return "verified";
  if (raw === "pending" || raw === "rejected") return "pending";
  if (raw === "review" || raw === "under review") return "review";
  return null;
}

function resolveVerificationStatus(
  role?: string | null,
  extras: Record<string, unknown> = {},
  profile?: { verification_status?: string | null; is_approved?: boolean | null }
): CarrierDashboardData["verificationStatus"] {
  if (profile?.is_approved === true) return "verified";

  const fromColumn = normalizeVerificationStatus(profile?.verification_status);
  if (fromColumn) return fromColumn;

  const fromExtras = normalizeVerificationStatus(
    extras.verificationStatus ?? extras.verification_status
  );
  if (fromExtras) return fromExtras;

  if (extras.is_approved === true || extras.isApproved === true) return "verified";
  if (extras.accountSetupComplete === true) return "review";
  return "pending";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatProfileStatMoney(value: number) {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    const digits = millions >= 100 ? 0 : millions >= 10 ? 1 : 1;
    return `£${millions.toFixed(digits).replace(/\.0$/, "")}m`;
  }

  if (abs >= 1_000) {
    const thousands = value / 1_000;
    const digits = thousands >= 100 ? 0 : 1;
    return `£${thousands.toFixed(digits).replace(/\.0$/, "")}k`;
  }

  if (Number.isInteger(value)) {
    return `£${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  }

  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDateLabel(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export async function fetchCarrierDashboard(): Promise<CarrierDashboardData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, role, profile_extras, verification_status, is_approved")
    .eq("id", user.id)
    .maybeSingle();

  const extras = parseExtras(profile?.profile_extras);
  const displayName = profile?.full_name || profile?.company_name || "Carrier";
  const verificationStatus = resolveVerificationStatus(profile?.role, extras, profile ?? undefined);

  const { data: assignedLoads } = await supabase
    .from("loads")
    .select("id, price, status, created_at, origin, destination")
    .eq("carrier_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const loads = assignedLoads || [];
  const completed = loads.filter((load) => COMPLETED_STATUSES.includes(load.status));
  const active = loads.filter((load) => ACTIVE_STATUSES.includes(load.status));
  const earnings = completed.reduce((sum, load) => sum + (Number(load.price) || 0), 0);

  const { count: availableCount } = await supabase
    .from("loads")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const recentActivity: CarrierActivity[] = loads.slice(0, 4).map((load) => {
    const completedLoad = COMPLETED_STATUSES.includes(load.status);
    const origin = load.origin || "Origin";
    const destination = load.destination || "Destination";
    return {
      id: load.id,
      title: completedLoad ? "Delivery complete" : `Load ${load.id.slice(0, 6).toUpperCase()}`,
      subtitle: formatDateLabel(load.created_at),
      status: load.status,
      origin,
      destination,
      amount: formatMoney(Number(load.price) || 0),
      positive: completedLoad,
    };
  });

  return {
    fullName: displayName,
    initials: getInitials(displayName),
    verificationStatus,
    earnings,
    activeLoads: active.length,
    completedLoads: completed.length,
    availableLoads: availableCount || 0,
    recentActivity,
  };
}

export { formatMoney, formatProfileStatMoney };
