import { supabase } from "@/lib/supabase";
import { formatBankReference } from "@/lib/bank-transfer-config";
import { upsertSupplierPaymentOrder } from "@/lib/supplier-payments";

export type BankTransferRequestStatus = "pending" | "verified" | "rejected";

export type BankTransferRequest = {
  id: string;
  loadId: string;
  supplierId: string;
  amount: number;
  currency: string;
  paymentFor: string;
  reference: string;
  status: BankTransferRequestStatus;
  supplierName?: string;
  supplierEmail?: string;
  companyName?: string;
  createdAt: string;
};

const isMissingTableError = (message: string) =>
  /bank_transfer_requests|schema cache|relation.*does not exist|could not find the table/i.test(message);

function mapRow(row: Record<string, unknown>): BankTransferRequest {
  return {
    id: String(row.id || ""),
    loadId: String(row.load_id || ""),
    supplierId: String(row.supplier_id || ""),
    amount: Number(row.amount || 0),
    currency: String(row.currency || "gbp"),
    paymentFor: String(row.payment_for || ""),
    reference: String(row.reference || ""),
    status: (row.status as BankTransferRequestStatus) || "pending",
    supplierName: row.supplier_name ? String(row.supplier_name) : undefined,
    supplierEmail: row.supplier_email ? String(row.supplier_email) : undefined,
    companyName: row.company_name ? String(row.company_name) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export async function getPendingBankTransferRequest(loadId: string, supplierId: string) {
  try {
    const { data, error } = await supabase
      .from("bank_transfer_requests")
      .select("*")
      .eq("load_id", loadId)
      .eq("supplier_id", supplierId)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.message)) return null;
      throw error;
    }

    return data ? mapRow(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function submitSupplierBankTransferRequest(params: {
  loadId: string;
  supplierId: string;
  amount: number;
  paymentFor: string;
  title: string;
  origin: string;
  destination: string;
  equipment: string;
  supplierName?: string;
  supplierEmail?: string;
  companyName?: string;
}) {
  const reference = formatBankReference(params.loadId);
  const now = new Date().toISOString();

  const existing = await getPendingBankTransferRequest(params.loadId, params.supplierId);
  if (existing) {
    return {
      ok: true as const,
      requestId: existing.id,
      alreadySubmitted: true,
    };
  }

  const row = {
    load_id: params.loadId,
    supplier_id: params.supplierId,
    amount: params.amount,
    currency: "gbp",
    payment_for: params.paymentFor,
    reference,
    status: "pending",
    supplier_name: params.supplierName || null,
    supplier_email: params.supplierEmail || null,
    company_name: params.companyName || null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("bank_transfer_requests")
    .insert([row])
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      return {
        ok: false as const,
        error: "Bank transfer is not configured yet. Please contact support.",
      };
    }
    return { ok: false as const, error: error.message };
  }

  await upsertSupplierPaymentOrder({
    loadId: params.loadId,
    supplierId: params.supplierId,
    paymentRoute: "pay-now",
    paymentState: "pending",
    amount: params.amount,
    currency: "gbp",
    title: params.title,
    origin: params.origin,
    destination: params.destination,
    equipment: params.equipment,
    createdAt: now,
    dueLabel: "Awaiting bank transfer verification",
    paymentMethod: "bank-transfer",
  });

  await supabase
    .from("loads")
    .update({
      payment_route: "pay-now",
      payment_state: "pending",
      status: "pending-payment",
      updated_at: now,
    })
    .eq("id", params.loadId)
    .eq("supplier_id", params.supplierId);

  return {
    ok: true as const,
    requestId: String(data.id),
    alreadySubmitted: false,
  };
}
