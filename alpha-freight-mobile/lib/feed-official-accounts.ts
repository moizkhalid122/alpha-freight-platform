export const OFFICIAL_FEED_EMAILS = [
  "network@alphafreightuk.com",
  "loads@alphafreightuk.com",
  "market@alphafreightuk.com",
  "support@alphafreightuk.com",
] as const;

const OFFICIAL_EMAIL_SET = new Set(
  OFFICIAL_FEED_EMAILS.map((email) => email.toLowerCase())
);

export function isOfficialFeedEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return OFFICIAL_EMAIL_SET.has(normalized);
}
