import {
  SupplierPaymentRecord,
  formatSupplierMoney,
  getSupplierPaymentOrdersForUser,
} from "@/lib/supplier-payments";
import { supabase } from "@/lib/supabase";

export type SupplierPayLaterItem = SupplierPaymentRecord & {
  loadCode: string;
  loadStatus: string;
  pickupDate: string;
  weight?: string | number | null;
};

export type SupplierPayLaterData = {
  supplierName: string;
  items: SupplierPayLaterItem[];
  stats: {
    queued: number;
    pendingValue: number;
    total: number;
  };
};

function getLoadCode(loadId: string) {
  return `AF-${loadId.slice(0, 8).toUpperCase()}`;
}

function formatPickupDate(value?: string | null) {
  if (!value || value === "Schedule pending") return "To be scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function fetchSupplierPayLaterQueue(): Promise<SupplierPayLaterData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle();

  const supplierName = profile?.company_name || profile?.full_name || "Supplier";

  const remoteOrders = await getSupplierPaymentOrdersForUser(user.id);
  const queueOrders = remoteOrders.filter((item) => item.paymentState !== "paid");

  const { data: loads } = await supabase
    .from("loads")
    .select(
      "id, origin, destination, price, status, pickup_date, equipment, weight, created_at, title, payment_state, payment_route"
    )
    .eq("supplier_id", user.id)
    .eq("payment_state", "pending")
    .order("created_at", { ascending: false });

  const loadMap = new Map((loads || []).map((load) => [String(load.id), load]));
  const orderLoadIds = new Set(queueOrders.map((order) => order.loadId));

  const orphanQueueItems: SupplierPayLaterItem[] = (loads || [])
    .filter((load) => !orderLoadIds.has(String(load.id)))
    .map((load) => ({
      loadId: String(load.id),
      supplierId: user.id,
      paymentRoute: (load.payment_route as "pay-now" | "pay-later") || "pay-later",
      paymentState: "pending" as const,
      amount: load.price ? Number(load.price) : 0,
      title: load.title || `${load.origin || "Origin"} → ${load.destination || "Destination"}`,
      origin: load.origin || "",
      destination: load.destination || "",
      equipment: load.equipment || "General freight",
      createdAt: load.created_at || new Date().toISOString(),
      dueLabel: load.payment_route === "pay-now" ? "Checkout incomplete" : "Due within 7 days",
      paymentMethod: "card",
      loadCode: getLoadCode(String(load.id)),
      loadStatus: String(load.status || "pending-payment"),
      pickupDate: formatPickupDate(load.pickup_date),
      weight: load.weight ?? null,
    }));

  const mergedItems: SupplierPayLaterItem[] = [...queueOrders, ...orphanQueueItems]
    .filter((order) => order.paymentState !== "paid")
    .map((order) => {
      const load = loadMap.get(order.loadId);
      return {
        ...order,
        amount: load?.price ? Number(load.price) : order.amount,
        origin: load?.origin || order.origin,
        destination: load?.destination || order.destination,
        equipment: load?.equipment || order.equipment,
        createdAt: load?.created_at || order.createdAt,
        loadCode: getLoadCode(order.loadId),
        loadStatus: String(load?.status || (order.paymentRoute === "pay-now" ? "pending-payment" : "active")),
        pickupDate: formatPickupDate(load?.pickup_date),
        weight: load?.weight ?? null,
        dueLabel:
          order.dueLabel ||
          (order.paymentRoute === "pay-now" ? "Checkout incomplete" : "Due within 7 days"),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingValue = mergedItems.reduce((total, item) => total + Number(item.amount || 0), 0);

  return {
    supplierName,
    items: mergedItems,
    stats: {
      queued: mergedItems.length,
      pendingValue,
      total: mergedItems.length,
    },
  };
}

export function formatPayLaterAmount(value: number) {
  return formatSupplierMoney(value);
}
