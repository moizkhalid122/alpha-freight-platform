export const COMMERCIAL_DIRECTOR_EMAILS = ["alastair@alphafreightuk.com"] as const;

export const COMMERCIAL_DIRECTOR_ROLE = "commercial_director";

export function isCommercialDirectorEmail(email: string | null | undefined) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return COMMERCIAL_DIRECTOR_EMAILS.some((allowed) => allowed.toLowerCase() === normalized);
}
