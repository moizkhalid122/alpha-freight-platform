export const ADMIN_PANEL_EMAILS = ["moizkhalid598@gmail.com"] as const;

export function isAdminPanelEmail(email: string | null | undefined) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_PANEL_EMAILS.some((allowed) => allowed.toLowerCase() === normalized);
}
