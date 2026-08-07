import {
  generateEmployeeCode,
  isOfficialEmployeeEmail,
  maskEmployeeName,
  normalizeEmployeeCodeInput,
  OFFICIAL_EMPLOYEE_EMAIL_DOMAIN,
  parseVerificationQuery,
} from "@/lib/employee-code";

export type EmployeeVerifyRow = {
  id: string;
  employee_code: string | null;
  job_title: string | null;
  department: string | null;
  status: string | null;
  onboarding_completed: boolean | null;
};

export type ProfileVerifyRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string | null;
};

export type VerifyEmployeeSuccess = {
  verified: true;
  message: string;
  employee: {
    employee_code: string;
    name: string | null;
    job_title: string;
    department: string;
    status: string;
    official_email: boolean;
    onboarding_complete: boolean;
    email_domain: string;
  };
};

export type VerifyEmployeeFailure = {
  verified: false;
  message: string;
  reason?: "not_found" | "inactive" | "invalid_input" | "invalid_email";
};

export type VerifyEmployeeResult = VerifyEmployeeSuccess | VerifyEmployeeFailure;

/** AF-EMP-9A504828 → UUID prefix `9a504828-` */
export function employeeCodeToUuidPrefix(code: string): string | null {
  const suffix = code.replace(/^AF-EMP-/i, "").replace(/[^0-9A-Fa-f]/g, "");
  if (suffix.length < 8) return null;
  return `${suffix.slice(0, 8).toLowerCase()}-`;
}

export function codesMatch(stored: string | null | undefined, input: string, userId: string): boolean {
  const normalizedInput = normalizeEmployeeCodeInput(input);
  const normalizedStored = stored?.trim().toUpperCase() ?? "";
  if (normalizedStored && normalizedStored === normalizedInput) return true;
  return generateEmployeeCode(userId) === normalizedInput;
}

export function isActiveEmployeeStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "on_leave";
}

export function buildVerifyEmployeeResult(
  profile: ProfileVerifyRow | null,
  hr: EmployeeVerifyRow | null,
  email: string | null,
  employeeCode: string
): VerifyEmployeeResult {
  if (!profile || profile.role !== "employee" || !hr) {
    return { verified: false, message: "Employee Not Found", reason: "not_found" };
  }

  if (hr.status === "inactive") {
    return { verified: false, message: "Employee Not Found", reason: "inactive" };
  }

  if (!isActiveEmployeeStatus(hr.status)) {
    return { verified: false, message: "Employee Not Found", reason: "not_found" };
  }

  const officialEmail = Boolean(email && isOfficialEmployeeEmail(email));

  return {
    verified: true,
    message: "Verified Employee",
    employee: {
      employee_code: employeeCode,
      name: maskEmployeeName(profile.full_name),
      job_title: hr.job_title ?? "Team Member",
      department: hr.department ?? "Alpha Freight",
      status: hr.status ?? "active",
      official_email: officialEmail,
      onboarding_complete: Boolean(hr.onboarding_completed),
      email_domain: OFFICIAL_EMPLOYEE_EMAIL_DOMAIN.slice(1),
    },
  };
}

export { parseVerificationQuery, generateEmployeeCode, normalizeEmployeeCodeInput, isOfficialEmployeeEmail };
