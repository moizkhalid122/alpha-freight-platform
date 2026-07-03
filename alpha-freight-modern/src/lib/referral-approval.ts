export type ReferralProfileApproval = {
  verification_status?: string | null;
  is_approved?: boolean | null;
  status?: string | null;
};

export function isReferralUserApproved(profile?: ReferralProfileApproval | null) {
  if (!profile) return false;

  if (profile.is_approved === true) return true;
  if (profile.is_approved === false) return false;

  const verification = String(profile.verification_status || "").trim().toLowerCase();
  if (verification === "verified" || verification === "approved") return true;
  if (verification === "rejected" || verification === "declined") return false;

  return false;
}
