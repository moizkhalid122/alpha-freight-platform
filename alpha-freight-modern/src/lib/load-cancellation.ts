export type CancellationStage =
  | "before_acceptance"
  | "after_acceptance"
  | "in_transit"
  | "completed"
  | "dispute";

export type CancellationRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "failed";

export type CancellationRequestType = "cancellation" | "dispute";

export type LoadCancellationFields = {
  id?: string;
  status?: string | null;
  carrier_id?: string | null;
  payment_state?: string | null;
};

export const CANCELLATION_REASONS = [
  { value: "change_of_plans", label: "Change of plans" },
  { value: "wrong_load_details", label: "Wrong load details posted" },
  { value: "found_alternative", label: "Found alternative transport" },
  { value: "carrier_issue", label: "Issue with assigned carrier" },
  { value: "duplicate_posting", label: "Duplicate posting" },
  { value: "other", label: "Other" },
] as const;

export const DISPUTE_REASONS = [
  { value: "service_failure", label: "Service failure" },
  { value: "incorrect_charge", label: "Incorrect charge" },
  { value: "duplicate_payment", label: "Duplicate payment" },
  { value: "unauthorised_payment", label: "Unauthorised payment" },
  { value: "delivery_issue", label: "Delivery issue" },
  { value: "other", label: "Other" },
] as const;

const CLOSED_STATUSES = new Set(["completed", "delivered"]);
const IN_PROGRESS_STATUSES = new Set(["in-transit"]);
const BLOCKED_STATUSES = new Set(["cancelled", "cancellation_requested"]);

export function normalizeLoadStatus(status?: string | null) {
  return String(status || "active").toLowerCase();
}

export function getCancellationStage(load: LoadCancellationFields): CancellationStage {
  const status = normalizeLoadStatus(load.status);

  if (CLOSED_STATUSES.has(status)) return "completed";
  if (IN_PROGRESS_STATUSES.has(status)) return "in_transit";
  if (status === "booked" || load.carrier_id) return "after_acceptance";
  return "before_acceptance";
}

export function getCancellationPolicyMessage(stage: CancellationStage, paid: boolean) {
  if (stage === "before_acceptance") {
    return paid
      ? "If you cancel before a carrier accepts this load, Alpha Freight will normally refund the full amount paid."
      : "This load has not been paid yet. Cancelling will remove it from your account with no charge.";
  }
  if (stage === "after_acceptance") {
    return "A carrier has already accepted this load. Your cancellation request will be reviewed and any refund will depend on costs already incurred.";
  }
  if (stage === "in_transit") {
    return "Transport has started. Full cancellation is not available — you can raise a payment dispute for review.";
  }
  return "This shipment is completed. Change-of-mind cancellation is not available — you can raise a dispute if there was a service issue.";
}

export function canSupplierCancelLoad(load: LoadCancellationFields) {
  const status = normalizeLoadStatus(load.status);

  if (BLOCKED_STATUSES.has(status)) {
    return {
      allowed: false,
      stage: getCancellationStage(load),
      autoRefund: false,
      message: status === "cancellation_requested"
        ? "A cancellation request is already under review."
        : "This load has already been cancelled.",
    };
  }

  const stage = getCancellationStage(load);

  if (stage === "in_transit" || stage === "completed") {
    return {
      allowed: false,
      stage,
      autoRefund: false,
      message: getCancellationPolicyMessage(stage, load.payment_state === "paid"),
    };
  }

  const paid = load.payment_state === "paid";

  return {
    allowed: true,
    stage,
    autoRefund: stage === "before_acceptance" && paid,
    message: getCancellationPolicyMessage(stage, paid),
  };
}

export function canSupplierDisputeLoad(load: LoadCancellationFields) {
  const status = normalizeLoadStatus(load.status);
  if (BLOCKED_STATUSES.has(status)) return false;
  const stage = getCancellationStage(load);
  return stage === "in_transit" || stage === "completed";
}

export function isMissingCancellationTableError(message: string) {
  return /load_cancellation_requests|schema cache|relation.*does not exist|could not find the table/i.test(
    message
  );
}

export type LoadCancellationRequest = {
  id: string;
  load_id: string;
  supplier_id: string;
  request_type: CancellationRequestType;
  cancellation_stage: CancellationStage;
  reason: string;
  reason_detail: string | null;
  status: CancellationRequestStatus;
  refund_type: string | null;
  original_amount: number | null;
  refund_amount: number | null;
  deduction_amount: number | null;
  deduction_reason: string | null;
  admin_note: string | null;
  stripe_refund_id: string | null;
  decided_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
};
