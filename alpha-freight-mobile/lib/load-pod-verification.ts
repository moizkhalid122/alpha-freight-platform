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
        summary: "Delivery proof approved. Funds can be released.",
        tone: "success" as const,
      };
    case "rejected":
      return {
        label: "POD rejected",
        summary: "Delivery proof was rejected. Upload a corrected document.",
        tone: "danger" as const,
      };
    case "info_required":
      return {
        label: "Info requested",
        summary: "Supplier requested more delivery information.",
        tone: "info" as const,
      };
    case "on_hold":
      return {
        label: "Review on hold",
        summary: "POD review is paused while checks are completed.",
        tone: "warning" as const,
      };
    case "pending":
    default:
      return {
        label: "POD pending review",
        summary: "Proof of delivery submitted. Awaiting supplier approval.",
        tone: "pending" as const,
      };
  }
}

export function isMissingPodColumnError(message: string) {
  return /pod_url|pod_name|pod_uploaded|pod_verification|pod_review|pod_verified|schema cache|column.*does not exist/i.test(
    message
  );
}

export function isPodVerified(status?: string | null) {
  return normalizePodVerificationStatus(status) === "verified";
}

export function isPodBlocked(status?: string | null) {
  return normalizePodVerificationStatus(status) === "rejected";
}
