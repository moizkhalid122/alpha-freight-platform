import { supabase } from "@/lib/supabase";

export type SupplierPaymentRoute = "pay-now" | "pay-later";
export type SupplierPaymentState = "pending" | "paid" | "failed" | "refunded";

export type SupplierPaymentRecord = {
  id?: string;
  loadId: string;
  supplierId: string;
  paymentRoute: SupplierPaymentRoute;
  paymentState: SupplierPaymentState;
  amount: number;
  currency?: string;
  title: string;
  origin: string;
  destination: string;
  equipment: string;
  createdAt: string;
  dueLabel: string;
  paymentMethod: string;
  cardBrand?: string;
  cardLast4?: string;
  paidAt?: string;
  stripeCheckoutSessionId?: string;
};

const isMissingTableError = (message: string) =>
  /supplier_payments|schema cache|relation.*does not exist|could not find the table/i.test(message);

export function resolveSupplierPaymentState(
  loadPaymentState?: string | null,
  recordPaymentState?: string | null
): SupplierPaymentState {
  if (loadPaymentState === "paid" || recordPaymentState === "paid") return "paid";
  const next = recordPaymentState || loadPaymentState || "pending";
  if (next === "failed" || next === "refunded") return next;
  return "pending";
}

function mapRowToRecord(row: Record<string, unknown>): SupplierPaymentRecord {
  return {
    id: String(row.id || ""),
    loadId: String(row.load_id || ""),
    supplierId: String(row.supplier_id || ""),
    paymentRoute: (row.payment_route as SupplierPaymentRoute) || "pay-later",
    paymentState: (row.payment_state as SupplierPaymentState) || "pending",
    amount: Number(row.amount || 0),
    currency: String(row.currency || "gbp"),
    title: String(row.title || ""),
    origin: String(row.origin || ""),
    destination: String(row.destination || ""),
    equipment: String(row.equipment || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
    dueLabel: String(row.due_label || ""),
    paymentMethod: String(row.payment_method || "card"),
    cardBrand: row.card_brand ? String(row.card_brand) : undefined,
    cardLast4: row.card_last4 ? String(row.card_last4) : undefined,
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
    stripeCheckoutSessionId: row.stripe_checkout_session_id
      ? String(row.stripe_checkout_session_id)
      : undefined,
  };
}

function mapRecordToRow(record: SupplierPaymentRecord) {
  return {
    load_id: record.loadId,
    supplier_id: record.supplierId,
    payment_route: record.paymentRoute,
    payment_state: record.paymentState,
    amount: record.amount,
    currency: record.currency || "gbp",
    title: record.title,
    origin: record.origin,
    destination: record.destination,
    equipment: record.equipment,
    due_label: record.dueLabel,
    payment_method: record.paymentMethod,
    card_brand: record.cardBrand || null,
    card_last4: record.cardLast4 || null,
    paid_at: record.paidAt || null,
    stripe_checkout_session_id: record.stripeCheckoutSessionId || null,
    updated_at: new Date().toISOString(),
  };
}

export async function getSupplierPaymentOrdersForUser(supplierId: string) {
  if (!supplierId) return [] as SupplierPaymentRecord[];

  try {
    const { data, error } = await supabase
      .from("supplier_payments")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error.message)) return [];
      throw error;
    }

    return (data || []).map((row) => mapRowToRecord(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function upsertSupplierPaymentOrder(record: SupplierPaymentRecord) {
  try {
    const { error } = await supabase.from("supplier_payments").upsert([mapRecordToRow(record)], {
      onConflict: "load_id,supplier_id",
    });

    if (error && !isMissingTableError(error.message)) {
      console.warn("[supplier-payments] Supabase upsert failed:", error.message);
    }

    await supabase
      .from("loads")
      .update({
        payment_route: record.paymentRoute,
        payment_state: record.paymentState,
        ...(record.paymentState === "paid" ? { status: "active" } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.loadId)
      .eq("supplier_id", record.supplierId);
  } catch (error) {
    console.warn("[supplier-payments] Unable to sync payment order:", error);
  }
}

export async function markSupplierPaymentPaid(params: {
  supplierId: string;
  loadId: string;
  cardBrand?: string;
  cardLast4?: string;
  paymentMethod?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
}) {
  const paidAt = new Date().toISOString();

  const { data: load, error: loadError } = await supabase
    .from("loads")
    .select("id, origin, destination, price, equipment, title, payment_route, payment_state")
    .eq("id", params.loadId)
    .eq("supplier_id", params.supplierId)
    .maybeSingle();

  if (loadError) {
    return { ok: false as const, error: loadError.message };
  }

  if (!load) {
    return { ok: false as const, error: "Load not found" };
  }

  if (load.payment_state === "paid") {
    return { ok: true as const, loadId: params.loadId, paidAt, alreadyPaid: true };
  }

  const existing = (await getSupplierPaymentOrdersForUser(params.supplierId)).find(
    (item) => item.loadId === params.loadId
  );

  const paymentRow = {
    load_id: params.loadId,
    supplier_id: params.supplierId,
    payment_route: "pay-now" as const,
    payment_state: "paid" as const,
    amount: Number(existing?.amount ?? load.price ?? 0),
    currency: "gbp",
    title:
      existing?.title ||
      load.title ||
      `${load.origin || "Origin"} → ${load.destination || "Destination"}`,
    origin: existing?.origin || load.origin || "",
    destination: existing?.destination || load.destination || "",
    equipment: existing?.equipment || load.equipment || "",
    due_label: "Paid",
    payment_method: params.paymentMethod || existing?.paymentMethod || "card",
    card_brand: params.cardBrand || null,
    card_last4: params.cardLast4 || null,
    stripe_checkout_session_id: params.stripeCheckoutSessionId || null,
    stripe_payment_intent_id: params.stripePaymentIntentId || null,
    paid_at: paidAt,
    updated_at: paidAt,
  };

  const { error: paymentError } = await supabase
    .from("supplier_payments")
    .upsert([paymentRow], { onConflict: "load_id,supplier_id" });

  if (paymentError && !isMissingTableError(paymentError.message)) {
    console.warn("[supplier-payments] payment upsert failed:", paymentError.message);
  }

  const { error: updateLoadError } = await supabase
    .from("loads")
    .update({
      payment_state: "paid",
      payment_route: "pay-now",
      status: "active",
      updated_at: paidAt,
    })
    .eq("id", params.loadId)
    .eq("supplier_id", params.supplierId);

  if (updateLoadError) {
    return { ok: false as const, error: updateLoadError.message };
  }

  return { ok: true as const, loadId: params.loadId, paidAt, alreadyPaid: false };
}

export function formatSupplierMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
