"use client";

import { supabase } from "@/lib/supabase";

export type SupplierPaymentRoute = "pay-now" | "pay-later";
export type SupplierPaymentState = "pending" | "paid" | "failed" | "refunded";

/** Prefer paid when either the load row or payment record says paid. */
export function resolveSupplierPaymentState(
  loadPaymentState?: string | null,
  recordPaymentState?: string | null
): SupplierPaymentState {
  if (loadPaymentState === "paid" || recordPaymentState === "paid") return "paid";
  const next = recordPaymentState || loadPaymentState || "pending";
  if (next === "failed" || next === "refunded") return next;
  return "pending";
}

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

const STORAGE_KEY = "alpha-supplier-payment-orders";

const isMissingTableError = (message: string) =>
  /supplier_payments|schema cache|relation.*does not exist|could not find the table/i.test(message);

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocalPaymentOrders(): SupplierPaymentRecord[] {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalPaymentOrders(records: SupplierPaymentRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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
    paymentMethod: String(row.payment_method || ""),
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

export async function migrateLocalPaymentsToSupabase(supplierId: string) {
  const localRecords = readLocalPaymentOrders().filter((item) => item.supplierId === supplierId);
  if (!localRecords.length) return;

  for (const record of localRecords) {
    await upsertSupplierPaymentOrder(record);
  }
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
      if (isMissingTableError(error.message)) {
        return readLocalPaymentOrders().filter((item) => item.supplierId === supplierId);
      }
      throw error;
    }

    const remoteRecords = (data || []).map((row) => mapRowToRecord(row as Record<string, unknown>));

    if (!remoteRecords.length) {
      const localRecords = readLocalPaymentOrders().filter((item) => item.supplierId === supplierId);
      if (localRecords.length) {
        await migrateLocalPaymentsToSupabase(supplierId);
        return localRecords;
      }
    }

    return remoteRecords;
  } catch {
    return readLocalPaymentOrders().filter((item) => item.supplierId === supplierId);
  }
}

export async function upsertSupplierPaymentOrder(record: SupplierPaymentRecord) {
  const localRecords = readLocalPaymentOrders().filter(
    (item) => !(item.loadId === record.loadId && item.supplierId === record.supplierId)
  );
  writeLocalPaymentOrders([record, ...localRecords]);

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
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
}) {
  const paidAt = new Date().toISOString();
  const existing = (await getSupplierPaymentOrdersForUser(params.supplierId)).find(
    (item) => item.loadId === params.loadId
  );

  const nextRecord: SupplierPaymentRecord = {
    ...(existing || {
      loadId: params.loadId,
      supplierId: params.supplierId,
      paymentRoute: "pay-now",
      amount: 0,
      title: "",
      origin: "",
      destination: "",
      equipment: "",
      createdAt: paidAt,
      dueLabel: "Paid",
      paymentMethod: "card",
    }),
    paymentState: "paid",
    paymentRoute: "pay-now",
    cardBrand: params.cardBrand,
    cardLast4: params.cardLast4,
    paidAt,
    stripeCheckoutSessionId: params.stripeCheckoutSessionId || existing?.stripeCheckoutSessionId,
  };

  await upsertSupplierPaymentOrder(nextRecord);

  try {
    await supabase
      .from("supplier_payments")
      .update({
        payment_state: "paid",
        payment_route: "pay-now",
        card_brand: params.cardBrand || null,
        card_last4: params.cardLast4 || null,
        stripe_checkout_session_id: params.stripeCheckoutSessionId || null,
        stripe_payment_intent_id: params.stripePaymentIntentId || null,
        paid_at: paidAt,
        updated_at: paidAt,
      })
      .eq("load_id", params.loadId)
      .eq("supplier_id", params.supplierId);

    await supabase
      .from("loads")
      .update({
        payment_state: "paid",
        payment_route: "pay-now",
        status: "active",
        updated_at: paidAt,
      })
      .eq("id", params.loadId)
      .eq("supplier_id", params.supplierId);
  } catch (error) {
    console.warn("[supplier-payments] Unable to mark payment paid:", error);
  }
}

export async function moveSupplierPaymentToInstant(params: { supplierId: string; loadId: string }) {
  const existing = (await getSupplierPaymentOrdersForUser(params.supplierId)).find(
    (item) => item.loadId === params.loadId
  );
  if (!existing) return;

  await upsertSupplierPaymentOrder({
    ...existing,
    paymentRoute: "pay-now",
    dueLabel: "Awaiting card payment",
  });
}

export async function moveSupplierPaymentToPayLater(params: { supplierId: string; loadId: string }) {
  const existing = (await getSupplierPaymentOrdersForUser(params.supplierId)).find(
    (item) => item.loadId === params.loadId
  );

  const paidAt = existing?.paymentState === "paid";
  if (paidAt) return;

  if (existing) {
    await upsertSupplierPaymentOrder({
      ...existing,
      paymentRoute: "pay-later",
      paymentState: "pending",
      dueLabel: "Due within 7 days",
    });
    return;
  }

  const { data: load } = await supabase
    .from("loads")
    .select("id, origin, destination, price, equipment, created_at, title, payment_state")
    .eq("id", params.loadId)
    .eq("supplier_id", params.supplierId)
    .maybeSingle();

  if (!load || load.payment_state === "paid") return;

  await upsertSupplierPaymentOrder({
    loadId: params.loadId,
    supplierId: params.supplierId,
    paymentRoute: "pay-later",
    paymentState: "pending",
    amount: load.price ? Number(load.price) : 0,
    title: load.title || `${load.origin || "Origin"} → ${load.destination || "Destination"}`,
    origin: load.origin || "",
    destination: load.destination || "",
    equipment: load.equipment || "General freight",
    createdAt: load.created_at || new Date().toISOString(),
    dueLabel: "Due within 7 days",
    paymentMethod: "card",
  });
}

/** @deprecated Use getSupplierPaymentOrdersForUser */
export function readSupplierPaymentOrders() {
  return readLocalPaymentOrders();
}
