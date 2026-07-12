import * as Linking from "expo-linking";
import { getWebApiBaseUrl } from "@/lib/web-api-config";
import {
  SupplierPaymentRecord,
  getSupplierPaymentOrdersForUser,
  markSupplierPaymentPaid,
  resolveSupplierPaymentState,
} from "@/lib/supplier-payments";
import { supabase } from "@/lib/supabase";

export type SupplierCheckoutOrder = SupplierPaymentRecord & {
  loadStatus: string;
  pickupDate: string;
  loadCode: string;
};

function getShortCode(id: string) {
  return `AF-${id.slice(0, 8).toUpperCase()}`;
}

export async function fetchSupplierCheckoutOrder(
  loadId: string
): Promise<{ order: SupplierCheckoutOrder; supplierId: string; userEmail: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !loadId) return null;

  const { data: load } = await supabase
    .from("loads")
    .select(
      "id, origin, destination, price, status, pickup_date, equipment, created_at, payment_state, payment_route, title"
    )
    .eq("id", loadId)
    .eq("supplier_id", user.id)
    .maybeSingle();

  if (!load) return null;

  const remoteOrders = await getSupplierPaymentOrdersForUser(user.id);
  const paymentOrder = remoteOrders.find((item) => item.loadId === loadId);

  const order: SupplierCheckoutOrder = {
    loadId: String(load.id),
    supplierId: user.id,
    paymentRoute: (paymentOrder?.paymentRoute || load.payment_route || "pay-now") as "pay-now" | "pay-later",
    paymentState: resolveSupplierPaymentState(load.payment_state, paymentOrder?.paymentState),
    amount: load.price ? Number(load.price) : Number(paymentOrder?.amount || 0),
    currency: paymentOrder?.currency || "gbp",
    title:
      paymentOrder?.title ||
      load.title ||
      `${load.origin || "Origin"} → ${load.destination || "Destination"}`,
    origin: load.origin || paymentOrder?.origin || "",
    destination: load.destination || paymentOrder?.destination || "",
    equipment: load.equipment || paymentOrder?.equipment || "General freight",
    createdAt: load.created_at || paymentOrder?.createdAt || new Date().toISOString(),
    dueLabel: paymentOrder?.dueLabel || "Due today",
    paymentMethod: paymentOrder?.paymentMethod || "card",
    cardBrand: paymentOrder?.cardBrand,
    cardLast4: paymentOrder?.cardLast4,
    paidAt: paymentOrder?.paidAt,
    loadStatus: String(load.status || "pending-payment"),
    pickupDate: load.pickup_date || "Schedule pending",
    loadCode: getShortCode(String(load.id)),
  };

  return {
    order,
    supplierId: user.id,
    userEmail: user.email || "",
  };
}

export async function processSupplierCardPayment(params: {
  supplierId: string;
  loadId: string;
  cardBrand: string;
  cardLast4: string;
}) {
  return markSupplierPaymentPaid({
    supplierId: params.supplierId,
    loadId: params.loadId,
    cardBrand: params.cardBrand,
    cardLast4: params.cardLast4,
    paymentMethod: "card",
  });
}

export async function openStripeCheckoutForLoad(params: {
  loadId: string;
  amount: number;
  title: string;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { ok: false as const, error: "Please sign in again to continue." };
  }

  const response = await fetch(`${getWebApiBaseUrl()}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      loadId: params.loadId,
      amount: params.amount,
      title: params.title,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    return {
      ok: false as const,
      error: String(payload.error || "Unable to start secure checkout."),
    };
  }

  if (payload.mode === "dev") {
    return {
      ok: false as const,
      error: "Use card details below while Stripe is in dev mode.",
    };
  }

  if (payload.url) {
    await Linking.openURL(String(payload.url));
    return { ok: true as const, mode: "stripe" as const };
  }

  return { ok: false as const, error: "Stripe checkout URL was not returned." };
}

export function detectCardBrand(cardNumber: string) {
  const digits = cardNumber.replace(/\s/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

export function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatCardExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
