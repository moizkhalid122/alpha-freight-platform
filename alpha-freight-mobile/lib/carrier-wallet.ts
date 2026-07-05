import { supabase } from "@/lib/supabase";

const COMPLETED_STATUSES = ["completed", "delivered"];
const ACTIVE_STATUSES = ["active", "booked", "assigned", "pending", "in-transit", "loading"];

export type WalletActivity = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountSecondary?: string;
  positive: boolean;
  pending?: boolean;
  icon: "withdraw" | "payout" | "convert";
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

export type PayoutMethod = "bank_transfer" | "bank_card";

export async function requestWalletWithdrawal(
  amount: number,
  method: PayoutMethod
): Promise<{ success: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || amount <= 0) return { success: false };

  await new Promise((resolve) => setTimeout(resolve, 900));

  console.info("Wallet withdrawal requested", { userId: user.id, amount, method });
  return { success: true };
}

export function buildWithdrawalActivity(
  amount: number,
  method: PayoutMethod
): WalletActivity {
  const methodLabel = method === "bank_card" ? "Bank card" : "Bank transfer";
  return {
    id: `withdraw-${Date.now()}`,
    title: "Withdrawal to bank",
    subtitle: `${methodLabel} · Processing`,
    amount: `-${formatWalletMoney(amount)}`,
    positive: false,
    pending: true,
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

  const { data: loads } = await supabase
    .from("loads")
    .select("id, price, status, created_at, origin, destination, updated_at")
    .eq("carrier_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const safeLoads = loads || [];
  const completed = safeLoads.filter((load) => COMPLETED_STATUSES.includes(load.status));
  const active = safeLoads.filter((load) => ACTIVE_STATUSES.includes(load.status));

  const lifetimeEarnings = completed.reduce((sum, load) => sum + (Number(load.price) || 0), 0);
  const pendingBalance = active.reduce((sum, load) => sum + (Number(load.price) || 0), 0);
  const availableBalance = lifetimeEarnings;

  const cards: WalletBalanceCard[] = [
    {
      id: "gbp",
      label: "GBP",
      amount: formatWalletMoney(availableBalance),
      meta: "Available balance",
      flag: "gb",
    },
    {
      id: "pending",
      label: "Pending",
      amount: formatWalletMoney(pendingBalance),
      meta: "In transit loads",
      flag: "pending",
    },
    {
      id: "earned",
      label: "Earned",
      amount: formatWalletMoney(lifetimeEarnings),
      meta: `${completed.length} completed loads`,
      flag: "earned",
    },
  ];

  const activities: WalletActivity[] = [];

  active.slice(0, 2).forEach((load) => {
    activities.push({
      id: `pending-${load.id}`,
      title: `${load.origin || "Pickup"} → ${load.destination || "Delivery"}`,
      subtitle: `Arrives ${formatActivityDate(load.updated_at || load.created_at)}`,
      amount: `+${formatWalletMoney(Number(load.price) || 0)}`,
      positive: true,
      pending: true,
      icon: "payout",
    });
  });

  completed.slice(0, 4).forEach((load) => {
    activities.push({
      id: load.id,
      title: "Load payout received",
      subtitle: formatActivityDate(load.created_at),
      amount: `+${formatWalletMoney(Number(load.price) || 0)}`,
      amountSecondary: `${load.origin || "UK"} → ${load.destination || "UK"}`,
      positive: true,
      icon: "payout",
    });
  });

  if (!activities.length) {
    activities.push({
      id: "empty",
      title: "No activity yet",
      subtitle: "Complete loads to start earning",
      amount: formatWalletMoney(0),
      positive: true,
      icon: "payout",
    });
  }

  return {
    fullName: displayName,
    initials: getInitials(displayName),
    availableBalance,
    pendingBalance,
    lifetimeEarnings,
    cards,
    activities,
  };
}
