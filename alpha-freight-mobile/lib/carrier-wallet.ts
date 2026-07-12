import { supabase } from "@/lib/supabase";
import { isPodVerified, isPodBlocked, isMissingPodColumnError } from "@/lib/load-pod-verification";

const COMPLETED_STATUSES = ["completed", "delivered"];
const ACTIVE_STATUSES = ["active", "booked", "assigned", "pending", "in-transit", "loading"];

export type WalletPayoutRecord = {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
};

export type WalletActivity = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountSecondary?: string;
  positive: boolean;
  pending?: boolean;
  icon: "withdraw" | "payout" | "convert";
  section?: "pending" | "recent";
};

export type WalletBalanceCard = {
  id: string;
  label: string;
  amount: string;
  meta: string;
  flag: "gb" | "pending" | "earned";
};

export type CarrierWalletData = {
  fullName: string;
  initials: string;
  availableBalance: number;
  pendingBalance: number;
  incomingBalance: number;
  lifetimeEarnings: number;
  cards: WalletBalanceCard[];
  activities: WalletActivity[];
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function formatWalletMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatActivityDate(value?: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function payoutStatusLabel(status: string) {
  const value = status.toLowerCase();
  if (value === "paid") return "Paid";
  if (value === "processing") return "Processing";
  if (value === "failed") return "Failed";
  return "Pending";
}

export type PayoutMethod = "bank_transfer" | "bank_card";

export async function requestWalletWithdrawal(
  amount: number,
  method: PayoutMethod
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || amount <= 0) return { success: false, error: "Invalid amount" };

  const wallet = await fetchCarrierWallet();
  if (!wallet) return { success: false, error: "Not signed in" };
  if (amount > wallet.availableBalance) {
    return { success: false, error: "Amount exceeds available balance" };
  }

  const { data, error } = await supabase
    .from("carrier_wallet_payouts")
    .insert({
      user_id: user.id,
      amount,
      method,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return { success: false, error: "Payout table not set up. Run carrier-wallet-payouts.sql in Supabase." };
    }
    return { success: false, error: error.message };
  }

  return { success: true, payoutId: data?.id };
}

export function buildWithdrawalActivity(
  amount: number,
  method: PayoutMethod,
  payoutId?: string
): WalletActivity {
  const methodLabel = method === "bank_card" ? "Bank card" : "Bank transfer";
  return {
    id: payoutId ?? `withdraw-${Date.now()}`,
    title: "Withdrawal to bank",
    subtitle: `${methodLabel} · Pending review`,
    amount: `-${formatWalletMoney(amount)}`,
    positive: false,
    pending: true,
    section: "pending",
    icon: "withdraw",
  };
}

export async function fetchCarrierWallet(): Promise<CarrierWalletData | null> {
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

  const loadSelectWithPod =
    "id, price, status, created_at, origin, destination, updated_at, pod_verification_status";
  const loadSelectFallback =
    "id, price, status, created_at, origin, destination, updated_at";

  const primaryLoads = await supabase
    .from("loads")
    .select(loadSelectWithPod)
    .eq("carrier_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  let safeLoads: Record<string, unknown>[] = [];
  if (primaryLoads.error && isMissingPodColumnError(primaryLoads.error.message)) {
    const fallbackLoads = await supabase
      .from("loads")
      .select(loadSelectFallback)
      .eq("carrier_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    safeLoads = (fallbackLoads.data ?? []) as Record<string, unknown>[];
  } else {
    safeLoads = (primaryLoads.data ?? []) as Record<string, unknown>[];
  }

  const { data: payoutRows, error: payoutError } = await supabase
    .from("carrier_wallet_payouts")
    .select("id, amount, method, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const payouts: WalletPayoutRecord[] =
    payoutError && /relation .* does not exist|schema cache/i.test(payoutError.message)
      ? []
      : payoutRows || [];

  let verifiedRevenue = 0;
  let pendingPodRevenue = 0;
  let inTransitRevenue = 0;
  let lifetimeEarnings = 0;

  safeLoads.forEach((load) => {
    const amount = toNumber(load.price);
    const status = String(load.status || "").toLowerCase();

    if (ACTIVE_STATUSES.includes(status)) {
      inTransitRevenue += amount;
      return;
    }

    if (!COMPLETED_STATUSES.includes(status)) return;

    lifetimeEarnings += amount;

    if (isPodVerified(load.pod_verification_status as string | null)) {
      verifiedRevenue += amount;
      return;
    }

    if (isPodBlocked(load.pod_verification_status as string | null)) {
      return;
    }

    pendingPodRevenue += amount;
  });

  const reservedPayouts = payouts
    .filter((p) => !["failed"].includes(String(p.status).toLowerCase()))
    .reduce((sum, p) => sum + toNumber(p.amount), 0);

  const availableBalance = Math.max(verifiedRevenue - reservedPayouts, 0);
  const pendingBalance = inTransitRevenue;
  const incomingBalance = pendingPodRevenue;

  const cards: WalletBalanceCard[] = [
    {
      id: "gbp",
      label: "GBP",
      amount: formatWalletMoney(availableBalance),
      meta: "POD verified · withdrawable",
      flag: "gb",
    },
    {
      id: "pending",
      label: "Pending",
      amount: formatWalletMoney(pendingBalance),
      meta: "Active loads in transit",
      flag: "pending",
    },
    {
      id: "earned",
      label: "Earned",
      amount: formatWalletMoney(lifetimeEarnings),
      meta: `${safeLoads.filter((l) => COMPLETED_STATUSES.includes(String(l.status).toLowerCase())).length} delivered loads`,
      flag: "earned",
    },
  ];

  const activities: WalletActivity[] = [];

  payouts.slice(0, 4).forEach((payout) => {
    const status = String(payout.status).toLowerCase();
    activities.push({
      id: payout.id,
      title: "Withdrawal request",
      subtitle: `${payoutStatusLabel(status)} · ${formatActivityDate(payout.created_at)}`,
      amount: `-${formatWalletMoney(toNumber(payout.amount))}`,
      positive: false,
      pending: status === "pending" || status === "processing",
      section: status === "pending" || status === "processing" ? "pending" : "recent",
      icon: "withdraw",
    });
  });

  safeLoads
    .filter((load) => {
      const status = String(load.status).toLowerCase();
      return ACTIVE_STATUSES.includes(status) || COMPLETED_STATUSES.includes(status);
    })
    .slice(0, 8)
    .forEach((load) => {
      const amount = toNumber(load.price);
      const status = String(load.status).toLowerCase();
      const isCompleted = COMPLETED_STATUSES.includes(status);
      const verified = isPodVerified(load.pod_verification_status as string | null);
      const podBlocked = isPodBlocked(load.pod_verification_status as string | null);
      const route = `${load.origin || "Pickup"} → ${load.destination || "Delivery"}`;

      if (isCompleted) {
        activities.push({
          id: `load-${load.id}`,
          title: verified ? "Load payout received" : "Load payout pending",
          subtitle: verified
            ? `${route} · POD verified`
            : podBlocked
              ? `${route} · POD rejected`
              : `${route} · POD submitted · awaiting verification`,
          amount: `+${formatWalletMoney(amount)}`,
          positive: true,
          pending: false,
          section: "recent",
          icon: "payout",
        });
        return;
      }

      activities.push({
        id: `load-${load.id}`,
        title: route,
        subtitle: `In transit · ${formatActivityDate((load.updated_at || load.created_at) as string | null)}`,
        amount: `+${formatWalletMoney(amount)}`,
        positive: true,
        pending: true,
        section: "pending",
        icon: "payout",
      });
    });

  if (!activities.length) {
    activities.push({
      id: "empty",
      title: "No activity yet",
      subtitle: "Complete loads with POD to start earning",
      amount: formatWalletMoney(0),
      positive: true,
      section: "recent",
      icon: "payout",
    });
  }

  return {
    fullName: displayName,
    initials: getInitials(displayName),
    availableBalance,
    pendingBalance,
    incomingBalance,
    lifetimeEarnings,
    cards,
    activities,
  };
}
