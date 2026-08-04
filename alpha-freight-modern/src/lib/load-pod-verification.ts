export type PodVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "on_hold"
  | "info_required";

export type LoadPodFields = {
  pod_url?: string | null;
  pod_name?: string | null;
  pod_uploaded_at?: string | null;
  pod_verification_status?: string | null;
  pod_review_note?: string | null;
  pod_verified_at?: string | null;
  status?: string | null;
};

const POD_STATUSES = new Set<PodVerificationStatus>([
  "pending",
  "verified",
  "rejected",
  "on_hold",
  "info_required",
]);

export function normalizePodVerificationStatus(
  value?: string | null
): PodVerificationStatus | null {
  const next = String(value || "").trim().toLowerCase();
  if (POD_STATUSES.has(next as PodVerificationStatus)) {
    return next as PodVerificationStatus;
  }
  return null;
}

export function hasSubmittedPod(load: LoadPodFields) {
  return Boolean(load.pod_url && String(load.pod_url).trim());
}

export function needsSupplierPodReview(load: LoadPodFields) {
  if (!hasSubmittedPod(load)) return false;
  const status = normalizePodVerificationStatus(load.pod_verification_status);
  if (!status) {
    const loadStatus = String(load.status || "").toLowerCase();
    return loadStatus === "delivered" || loadStatus === "completed";
  }
  return status === "pending" || status === "info_required" || status === "on_hold";
}

export function isShipmentFullyClosed(load: LoadPodFields) {
  const loadStatus = String(load.status || "").toLowerCase();
  const podStatus = normalizePodVerificationStatus(load.pod_verification_status);
  if (loadStatus === "completed" && podStatus === "verified") return true;
  if (loadStatus === "completed" && !hasSubmittedPod(load)) return true;
  return false;
}

export function getPodVerificationMeta(status?: string | null) {
  const normalized = normalizePodVerificationStatus(status);
  switch (normalized) {
    case "verified":
      return {
        label: "POD verified",
        pill: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        summary: "Delivery proof approved. Shipment is fully closed.",
      };
    case "rejected":
      return {
        label: "POD rejected",
        pill: "bg-rose-50 text-rose-700 border border-rose-100",
        summary: "Delivery proof was rejected. Carrier may reupload a corrected document.",
      };
    case "info_required":
      return {
        label: "Info requested",
        pill: "bg-sky-50 text-sky-700 border border-sky-100",
        summary: "More delivery information is required from the carrier.",
      };
    case "on_hold":
      return {
        label: "Review on hold",
        pill: "bg-amber-50 text-amber-700 border border-amber-100",
        summary: "POD review is paused while additional checks are completed.",
      };
    case "pending":
    default:
      return {
        label: "POD pending review",
        pill: "bg-violet-50 text-violet-700 border border-violet-100",
        summary: "Carrier submitted proof of delivery. Review the document to close this shipment.",
      };
  }
}

export function isMissingPodColumnError(message: string) {
  return /pod_url|pod_name|pod_uploaded|pod_verification|pod_review|pod_verified|schema cache|column.*does not exist/i.test(
    message
  );
}

export function getSupplierDisplayStatus(load: LoadPodFields) {
  const loadStatus = String(load.status || "").toLowerCase();
  if (needsSupplierPodReview(load)) return "pod-review";
  if (loadStatus === "delivered") return "delivered";
  if (loadStatus === "completed" || loadStatus === "delivered") return "completed";
  return loadStatus;
}
