import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateSupplierTotal } from "@/lib/load-commission";
import {
  canSupplierCancelLoad,
  canSupplierDisputeLoad,
  getCancellationStage,
  isMissingCancellationTableError,
  type CancellationRequestType,
  type LoadCancellationRequest,
} from "@/lib/load-cancellation";
import { processStripeRefund } from "@/lib/stripe-refund-server";
import { getAdminSupabase, isAdminServiceConfigured } from "@/lib/supabase-admin";

type DbClient = SupabaseClient;

export type CancelLoadParams = {
  loadId: string;
  supplierId: string;
  reason: string;
  reasonDetail?: string;
  requestType?: CancellationRequestType;
};

function getWriteDb(fallback: SupabaseClient): DbClient {
  if (isAdminServiceConfigured()) {
    return getAdminSupabase();
  }
  return fallback;
}

function mapCancellationRow(row: Record<string, unknown>): LoadCancellationRequest {
  return {
    id: String(row.id),
    load_id: String(row.load_id),
    supplier_id: String(row.supplier_id),
    request_type: (row.request_type as LoadCancellationRequest["request_type"]) || "cancellation",
    cancellation_stage: row.cancellation_stage as LoadCancellationRequest["cancellation_stage"],
    reason: String(row.reason),
    reason_detail: row.reason_detail ? String(row.reason_detail) : null,
    status: row.status as LoadCancellationRequest["status"],
    refund_type: row.refund_type ? String(row.refund_type) : null,
    original_amount: row.original_amount != null ? Number(row.original_amount) : null,
    refund_amount: row.refund_amount != null ? Number(row.refund_amount) : null,
    deduction_amount: row.deduction_amount != null ? Number(row.deduction_amount) : null,
    deduction_reason: row.deduction_reason ? String(row.deduction_reason) : null,
    admin_note: row.admin_note ? String(row.admin_note) : null,
    stripe_refund_id: row.stripe_refund_id ? String(row.stripe_refund_id) : null,
    decided_at: row.decided_at ? String(row.decided_at) : null,
    refunded_at: row.refunded_at ? String(row.refunded_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function fetchSupplierLoad(db: DbClient, loadId: string, supplierId: string) {
  const { data, error } = await db
    .from("loads")
    .select("id, supplier_id, carrier_id, status, price, payment_state, payment_route, origin, destination, title")
    .eq("id", loadId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  if (error) return { load: null, error: error.message };
  return { load: data, error: null };
}

async function fetchPayment(db: DbClient, loadId: string, supplierId: string) {
  const { data } = await db
    .from("supplier_payments")
    .select("*")
    .eq("load_id", loadId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  return data;
}

async function rejectPendingBids(db: DbClient, loadId: string) {
  await db
    .from("bids")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("load_id", loadId)
    .in("status", ["pending", "accepted"]);
}

async function applyRefundToRecords(
  db: DbClient,
  params: {
    loadId: string;
    supplierId: string;
    refundAmount: number;
    stripeRefundId?: string | null;
    now: string;
  }
) {
  await db
    .from("supplier_payments")
    .update({
      payment_state: "refunded",
      refund_amount: params.refundAmount,
      stripe_refund_id: params.stripeRefundId || null,
      refunded_at: params.now,
      updated_at: params.now,
    })
    .eq("load_id", params.loadId)
    .eq("supplier_id", params.supplierId);

  await db
    .from("loads")
    .update({
      payment_state: "refunded",
      updated_at: params.now,
    })
    .eq("id", params.loadId)
    .eq("supplier_id", params.supplierId);
}

async function finalizeCancelledLoad(
  db: DbClient,
  params: {
    loadId: string;
    supplierId: string;
    reason: string;
    now: string;
    immediate: boolean;
  }
) {
  if (params.immediate) {
    await rejectPendingBids(db, params.loadId);
    await db
      .from("loads")
      .update({
        status: "cancelled",
        carrier_id: null,
        cancelled_at: params.now,
        cancelled_by: params.supplierId,
        cancellation_reason: params.reason,
        updated_at: params.now,
      })
      .eq("id", params.loadId)
      .eq("supplier_id", params.supplierId);
    return;
  }

  await db
    .from("loads")
    .update({
      status: "cancellation_requested",
      cancellation_reason: params.reason,
      updated_at: params.now,
    })
    .eq("id", params.loadId)
    .eq("supplier_id", params.supplierId);
}

async function processAutomaticRefund(
  db: DbClient,
  params: {
    loadId: string;
    supplierId: string;
    payment: Record<string, unknown> | null;
    loadPrice: number;
    currency?: string;
  }
) {
  const now = new Date().toISOString();
  const paid = params.payment?.payment_state === "paid" || params.payment?.paid_at;

  if (!paid) {
    return {
      ok: true as const,
      refundAmount: 0,
      stripeRefundId: null as string | null,
      mode: "none" as const,
    };
  }

  const storedAmount = Number(params.payment?.amount || 0);
  const refundAmount =
    storedAmount > 0
      ? storedAmount
      : calculateSupplierTotal(params.loadPrice).totalPayable;

  const stripeResult = await processStripeRefund({
    paymentIntentId: params.payment?.stripe_payment_intent_id
      ? String(params.payment.stripe_payment_intent_id)
      : null,
    amount: refundAmount,
    currency: params.payment?.currency ? String(params.payment.currency) : "gbp",
  });

  if (!stripeResult.ok) {
    return {
      ok: false as const,
      error: stripeResult.error,
    };
  }

  if (stripeResult.refundId || stripeResult.mode === "manual") {
    await applyRefundToRecords(db, {
      loadId: params.loadId,
      supplierId: params.supplierId,
      refundAmount,
      stripeRefundId: stripeResult.refundId,
      now,
    });
  }

  return {
    ok: true as const,
    refundAmount,
    stripeRefundId: stripeResult.refundId,
    mode: stripeResult.mode,
  };
}

export async function requestCancelLoadServer(
  userSupabase: SupabaseClient,
  params: CancelLoadParams
) {
  const db = getWriteDb(userSupabase);
  const now = new Date().toISOString();
  const requestType = params.requestType || "cancellation";
  const reason = params.reason.trim();
  const reasonDetail = params.reasonDetail?.trim() || null;

  if (!reason) {
    return { ok: false as const, error: "Please select a cancellation reason." };
  }

  const { load, error: loadError } = await fetchSupplierLoad(
    userSupabase,
    params.loadId,
    params.supplierId
  );

  if (loadError) {
    return { ok: false as const, error: loadError };
  }

  if (!load) {
    return { ok: false as const, error: "Load not found or access denied." };
  }

  if (requestType === "dispute") {
    if (!canSupplierDisputeLoad(load)) {
      return {
        ok: false as const,
        error: "Disputes are only available for in-transit or completed loads.",
      };
    }
  } else {
    const eligibility = canSupplierCancelLoad(load);
    if (!eligibility.allowed) {
      return { ok: false as const, error: eligibility.message };
    }
  }

  const stage =
    requestType === "dispute" ? ("dispute" as const) : getCancellationStage(load);
  const payment = await fetchPayment(db, params.loadId, params.supplierId);
  const originalAmount =
    Number(payment?.amount || 0) > 0
      ? Number(payment?.amount)
      : calculateSupplierTotal(Number(load.price || 0)).totalPayable;

  const { data: existingPending } = await db
    .from("load_cancellation_requests")
    .select("id, status")
    .eq("load_id", params.loadId)
    .eq("supplier_id", params.supplierId)
    .in("status", ["pending", "processing", "approved"])
    .maybeSingle();

  if (existingPending) {
    return {
      ok: false as const,
      error: "A cancellation or refund request is already open for this load.",
    };
  }

  const autoRefund =
    requestType === "cancellation" &&
    stage === "before_acceptance" &&
    (load.payment_state === "paid" || payment?.payment_state === "paid");

  const requestRow = {
    load_id: params.loadId,
    supplier_id: params.supplierId,
    request_type: requestType,
    cancellation_stage: stage,
    reason,
    reason_detail: reasonDetail,
    status: autoRefund ? "processing" : "pending",
    refund_type: autoRefund ? "full" : stage === "after_acceptance" ? "manual_review" : requestType === "dispute" ? "manual_review" : load.payment_state === "paid" ? "manual_review" : "none",
    original_amount: originalAmount,
    refund_amount: autoRefund ? originalAmount : null,
    deduction_amount: 0,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: createError } = await db
    .from("load_cancellation_requests")
    .insert([requestRow])
    .select("*")
    .single();

  if (createError) {
    if (isMissingCancellationTableError(createError.message)) {
      return {
        ok: false as const,
        error:
          "Cancellation tables are not set up yet. Run supplier-cancellation-refund.sql in Supabase SQL Editor, then try again.",
      };
    }
    return { ok: false as const, error: createError.message };
  }

  if (autoRefund) {
    const refundResult = await processAutomaticRefund(db, {
      loadId: params.loadId,
      supplierId: params.supplierId,
      payment,
      loadPrice: Number(load.price || 0),
    });

    if (!refundResult.ok) {
      await db
        .from("load_cancellation_requests")
        .update({
          status: "failed",
          admin_note: refundResult.error,
          updated_at: now,
        })
        .eq("id", created.id);

      return {
        ok: false as const,
        error: refundResult.error,
      };
    }

    await finalizeCancelledLoad(db, {
      loadId: params.loadId,
      supplierId: params.supplierId,
      reason,
      now,
      immediate: true,
    });

    await db
      .from("load_cancellation_requests")
      .update({
        status: "completed",
        refund_amount: refundResult.refundAmount,
        stripe_refund_id: refundResult.stripeRefundId,
        refunded_at: refundResult.refundAmount > 0 ? now : null,
        decided_at: now,
        updated_at: now,
      })
      .eq("id", created.id);

    const refreshed = await fetchSupplierLoad(userSupabase, params.loadId, params.supplierId);

    return {
      ok: true as const,
      request: mapCancellationRow(created as Record<string, unknown>),
      load: refreshed.load,
      autoRefunded: refundResult.refundAmount > 0,
      refundAmount: refundResult.refundAmount,
      message:
        refundResult.refundAmount > 0
          ? "Load cancelled. Your refund has been initiated and will return via your original payment method."
          : "Load cancelled successfully.",
    };
  }

  if (requestType === "cancellation") {
    const immediate = stage === "before_acceptance" && load.payment_state !== "paid";

    if (immediate) {
      await finalizeCancelledLoad(db, {
        loadId: params.loadId,
        supplierId: params.supplierId,
        reason,
        now,
        immediate: true,
      });
    } else {
      await finalizeCancelledLoad(db, {
        loadId: params.loadId,
        supplierId: params.supplierId,
        reason,
        now,
        immediate: false,
      });
    }

    if (immediate) {
      await db
        .from("load_cancellation_requests")
        .update({
          status: "completed",
          refund_type: "none",
          refund_amount: 0,
          decided_at: now,
          updated_at: now,
        })
        .eq("id", created.id);
    }
  }

  const refreshed = await fetchSupplierLoad(userSupabase, params.loadId, params.supplierId);

  return {
    ok: true as const,
    request: mapCancellationRow(created as Record<string, unknown>),
    load: refreshed.load,
    autoRefunded: false,
    refundAmount: 0,
    message:
      requestType === "dispute"
        ? "Your dispute has been submitted. Our team will review and contact you."
        : stage === "after_acceptance"
          ? "Cancellation request submitted. Our team will review any applicable refund."
          : "Load cancelled successfully.",
  };
}

export type AdminRefundDecisionParams = {
  requestId: string;
  adminUserId: string;
  action: "approve" | "reject" | "process_refund";
  refundAmount?: number;
  deductionAmount?: number;
  deductionReason?: string;
  adminNote?: string;
};

export async function decideCancellationRequestServer(params: AdminRefundDecisionParams) {
  if (!isAdminServiceConfigured()) {
    return {
      ok: false as const,
      error: "Admin service role is not configured.",
    };
  }

  const db = getAdminSupabase();
  const now = new Date().toISOString();

  const { data: request, error: requestError } = await db
    .from("load_cancellation_requests")
    .select("*")
    .eq("id", params.requestId)
    .maybeSingle();

  if (requestError) {
    return { ok: false as const, error: requestError.message };
  }

  if (!request) {
    return { ok: false as const, error: "Cancellation request not found." };
  }

  if (params.action === "reject") {
    await db
      .from("load_cancellation_requests")
      .update({
        status: "rejected",
        admin_note: params.adminNote || null,
        decided_by: params.adminUserId,
        decided_at: now,
        updated_at: now,
      })
      .eq("id", params.requestId);

    if (String(request.cancellation_stage) === "after_acceptance") {
      await db
        .from("loads")
        .update({
          status: "booked",
          updated_at: now,
        })
        .eq("id", request.load_id)
        .eq("status", "cancellation_requested");
    }

    return { ok: true as const, request: mapCancellationRow(request as Record<string, unknown>) };
  }

  const payment = await fetchPayment(db, request.load_id, request.supplier_id);
  const originalAmount = Number(request.original_amount || payment?.amount || 0);
  const deductionAmount = Math.max(0, Number(params.deductionAmount || 0));
  const requestedRefund = params.refundAmount ?? originalAmount - deductionAmount;
  const refundAmount = Math.max(0, Math.min(requestedRefund, originalAmount));

  if (params.action === "approve" || params.action === "process_refund") {
    if (refundAmount > 0 && payment?.payment_state === "paid") {
      const refundResult = await processStripeRefund({
        paymentIntentId: payment.stripe_payment_intent_id,
        amount: refundAmount,
        currency: payment.currency || "gbp",
      });

      if (!refundResult.ok) {
        return { ok: false as const, error: refundResult.error };
      }

      await applyRefundToRecords(db, {
        loadId: request.load_id,
        supplierId: request.supplier_id,
        refundAmount,
        stripeRefundId: refundResult.refundId,
        now,
      });

      await db
        .from("load_cancellation_requests")
        .update({
          status: "completed",
          refund_amount: refundAmount,
          deduction_amount: deductionAmount,
          deduction_reason: params.deductionReason || null,
          admin_note: params.adminNote || null,
          stripe_refund_id: refundResult.refundId,
          refunded_at: now,
          decided_by: params.adminUserId,
          decided_at: now,
          updated_at: now,
        })
        .eq("id", params.requestId);
    } else {
      await db
        .from("load_cancellation_requests")
        .update({
          status: "completed",
          refund_amount: 0,
          refund_type: "none",
          deduction_amount: deductionAmount,
          deduction_reason: params.deductionReason || null,
          admin_note: params.adminNote || null,
          decided_by: params.adminUserId,
          decided_at: now,
          updated_at: now,
        })
        .eq("id", params.requestId);
    }

    await rejectPendingBids(db, request.load_id);
    await db
      .from("loads")
      .update({
        status: "cancelled",
        carrier_id: null,
        cancelled_at: now,
        cancelled_by: params.adminUserId,
        cancellation_reason: request.reason,
        updated_at: now,
      })
      .eq("id", request.load_id);

    const { data: refreshed } = await db
      .from("load_cancellation_requests")
      .select("*")
      .eq("id", params.requestId)
      .single();

    return {
      ok: true as const,
      request: mapCancellationRow((refreshed || request) as Record<string, unknown>),
    };
  }

  return { ok: false as const, error: "Unsupported action." };
}

export async function listCancellationRequestsForSupplier(
  supabase: SupabaseClient,
  supplierId: string
) {
  const { data, error } = await supabase
    .from("load_cancellation_requests")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingCancellationTableError(error.message)) {
      return { ok: true as const, requests: [] as LoadCancellationRequest[] };
    }
    return { ok: false as const, error: error.message, requests: [] as LoadCancellationRequest[] };
  }

  return {
    ok: true as const,
    requests: (data || []).map((row) => mapCancellationRow(row as Record<string, unknown>)),
  };
}

export async function listCancellationRequestsForAdmin() {
  if (!isAdminServiceConfigured()) {
    return { ok: false as const, error: "Admin service role is not configured.", requests: [] };
  }

  const db = getAdminSupabase();
  const { data, error } = await db
    .from("load_cancellation_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (isMissingCancellationTableError(error.message)) {
      return { ok: true as const, requests: [] as LoadCancellationRequest[] };
    }
    return { ok: false as const, error: error.message, requests: [] };
  }

  return {
    ok: true as const,
    requests: (data || []).map((row) => mapCancellationRow(row as Record<string, unknown>)),
  };
}

export { mapCancellationRow };
