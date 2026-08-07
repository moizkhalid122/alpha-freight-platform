const EMPLOYEE_CODE_PREFIX = "AF-EMP-";
export const OFFICIAL_EMPLOYEE_EMAIL_DOMAIN = "@alphafreightuk.com";

/** Deterministic public employee ID from Supabase user UUID. */
export function generateEmployeeCode(userId: string): string {
  const compact = userId.replace(/-/g, "").toUpperCase();
  return `${EMPLOYEE_CODE_PREFIX}${compact.slice(0, 8)}`;
}

export function normalizeEmployeeCodeInput(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!trimmed) return "";
  if (trimmed.startsWith(EMPLOYEE_CODE_PREFIX)) return trimmed;
  return `${EMPLOYEE_CODE_PREFIX}${trimmed.replace(/^AF-EMP/, "").replace(/^AF/, "")}`;
}

export function isOfficialEmployeeEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(OFFICIAL_EMPLOYEE_EMAIL_DOMAIN);
}

export function parseVerificationQuery(raw: string): { type: "email" | "code"; value: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    return { type: "email", value: trimmed.toLowerCase() };
  }

  const code = normalizeEmployeeCodeInput(trimmed);
  if (code.length < EMPLOYEE_CODE_PREFIX.length + 4) return null;
  return { type: "code", value: code };
}

export function maskEmployeeName(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}
