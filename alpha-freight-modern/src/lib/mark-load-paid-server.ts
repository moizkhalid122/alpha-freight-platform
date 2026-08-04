import type { SupabaseClient } from "@supabase/supabase-js";

type MarkLoadPaidParams = {
  loadId: string;
  supplierId: string;
  cardBrand?: string;
  cardLast4?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
};

export async function markLoadPaymentPaidServer(
  supabase: SupabaseClient,
  params: MarkLoadPaidParams
) {
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

  const { data: existingPayment } = await supabase
    .from("supplier_payments")
    .select("id, title, origin, destination, equipment, amount, payment_method, due_label")
    .eq("load_id", params.loadId)
    .eq("supplier_id", params.supplierId)
    .maybeSingle();

  const paymentRow = {
    load_id: params.loadId,
    supplier_id: params.supplierId,
    payment_route: "pay-now" as const,
    payment_state: "paid" as const,
    amount: Number(existingPayment?.amount ?? load.price ?? 0),
    currency: "gbp",
    title:
      existingPayment?.title ||
      load.title ||
      `${load.origin || "Origin"} → ${load.destination || "Destination"}`,
    origin: existingPayment?.origin || load.origin || "",
    destination: existingPayment?.destination || load.destination || "",
    equipment: existingPayment?.equipment || load.equipment || "",
    due_label: "Paid",
    payment_method: existingPayment?.payment_method || "card",
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

  if (paymentError) {
    console.warn("[mark-load-paid] supplier_payments upsert failed:", paymentError.message);
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
