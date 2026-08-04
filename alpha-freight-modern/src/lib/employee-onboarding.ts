import type { SupabaseClient } from "@supabase/supabase-js";

import { withTimeout } from "@/lib/employee-auth-utils";
import { formatAuthError } from "@/lib/format-error";
import { ensureEmployeeAccount } from "@/lib/employee-signup";
import { supabase } from "@/lib/supabase";

export type EmployeeOnboardingRecord = {
  id: string;
  job_title: string | null;
  department: string | null;
  phone: string | null;
  address: string | null;
  profile_photo_url: string | null;
  cv_url: string | null;
  id_document_url: string | null;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  onboarding_completed: boolean;
  accepted_nda_at: string | null;
  accepted_employment_at: string | null;
  accepted_commission_at: string | null;
};

export const EMPLOYEE_DOCUMENTS_BUCKET = "employee-documents";

const LOCAL_ONBOARDING_KEY = "af_employee_onboarding_done";
export const EMPLOYEE_ONBOARDING_COOKIE = "af_employee_onboarded";

export function markLocalOnboardingComplete(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${LOCAL_ONBOARDING_KEY}_${userId}`, "1");
  document.cookie = `${EMPLOYEE_ONBOARDING_COOKIE}=${userId}; path=/; max-age=31536000; SameSite=Lax`;
}

export function isLocalOnboardingComplete(userId: string) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${LOCAL_ONBOARDING_KEY}_${userId}`) === "1";
}

export function clearLocalOnboardingComplete(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${LOCAL_ONBOARDING_KEY}_${userId}`);
  document.cookie = `${EMPLOYEE_ONBOARDING_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function isOnboardingCookieComplete(userId: string, cookieValue?: string | null) {
  return cookieValue === userId;
}

function normalizeOnboardingRecord(row: Record<string, unknown>): EmployeeOnboardingRecord {
  return {
    id: String(row.id),
    job_title: (row.job_title as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    profile_photo_url: (row.profile_photo_url as string | null) ?? null,
    cv_url: (row.cv_url as string | null) ?? null,
    id_document_url: (row.id_document_url as string | null) ?? null,
    bank_account_name: (row.bank_account_name as string | null) ?? null,
    bank_sort_code: (row.bank_sort_code as string | null) ?? null,
    bank_account_number: (row.bank_account_number as string | null) ?? null,
    onboarding_completed: Boolean(row.onboarding_completed),
    accepted_nda_at: (row.accepted_nda_at as string | null) ?? null,
    accepted_employment_at: (row.accepted_employment_at as string | null) ?? null,
    accepted_commission_at: (row.accepted_commission_at as string | null) ?? null,
  };
}

export async function fetchEmployeeOnboarding(
  client: SupabaseClient,
  userId: string
): Promise<EmployeeOnboardingRecord | null> {
  try {
    const { data, error } = await client.from("employee_profiles").select("*").eq("id", userId).maybeSingle();

    if (error) {
      console.warn("Employee onboarding fetch failed:", error.message);
      return null;
    }
    if (!data) return null;
    return normalizeOnboardingRecord(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export type EmployeeSettingsData = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  photoUrl: string | null;
  cvUrl: string | null;
  idDocumentUrl: string | null;
  hr: EmployeeOnboardingRecord | null;
  needsOnboardingResync: boolean;
};

export function employeeStoragePath(url: string): string | null {
  try {
    const marker = `/employee-documents/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length).split("?")[0] ?? "");
  } catch {
    return null;
  }
}

/** Resolves Supabase storage URLs to a signed URL for display (works with private buckets). */
export async function resolveEmployeeDocumentUrl(
  client: SupabaseClient,
  url: string | null
): Promise<string | null> {
  if (!url || url.startsWith("blob:")) return null;

  const path = employeeStoragePath(url);
  if (!path) return url;

  const { data, error } = await client.storage
    .from(EMPLOYEE_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);

  if (error || !data?.signedUrl) return url;
  return data.signedUrl;
}

export async function loadEmployeeSettings(client: SupabaseClient): Promise<EmployeeSettingsData | null> {
  const {
    data: { session },
  } = await client.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const [profileRes, hr] = await Promise.all([
    client.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    fetchEmployeeOnboarding(client, user.id),
  ]);

  const authName = typeof meta.full_name === "string" ? meta.full_name : "";
  const fullName = profileRes.data?.full_name || authName || "";
  const photoUrl = await resolveEmployeeDocumentUrl(client, hr?.profile_photo_url ?? null);
  const cvUrl = await resolveEmployeeDocumentUrl(client, hr?.cv_url ?? null);
  const idDocumentUrl = await resolveEmployeeDocumentUrl(client, hr?.id_document_url ?? null);

  const locallyComplete = isLocalOnboardingComplete(user.id);
  const needsOnboardingResync = locallyComplete && !hr?.onboarding_completed;

  return {
    userId: user.id,
    fullName,
    email: user.email ?? "",
    phone: hr?.phone ?? "",
    address: hr?.address ?? "",
    photoUrl,
    cvUrl,
    idDocumentUrl,
    hr,
    needsOnboardingResync,
  };
}

export type SaveEmployeeOnboardingInput = {
  job_title: string;
  phone: string;
  address: string;
  profile_photo_url: string | null;
  cv_url: string | null;
  id_document_url: string | null;
};

function onboardingSaveErrorMessage(error: { message: string }) {
  if (/profiles_role_check/i.test(error.message)) {
    return `${error.message} — Run employee-profiles-role-fix.sql in Supabase SQL Editor to allow role 'employee'.`;
  }
  if (/foreign key/i.test(error.message)) {
    return `${error.message} — Your login exists but the profiles row is missing. Sign out, sign in again, then retry onboarding.`;
  }
  if (/column|does not exist/i.test(error.message)) {
    return `${error.message} — Run employee-onboarding.sql in Supabase SQL Editor, then complete onboarding again.`;
  }
  return error.message;
}

export async function saveEmployeeOnboardingComplete(
  client: SupabaseClient,
  userId: string,
  input: SaveEmployeeOnboardingInput
): Promise<void> {
  const session = (await client.auth.getSession()).data.session;
  const meta = session?.user?.user_metadata ?? {};

  await ensureEmployeeAccount(client, {
    userId,
    position: input.job_title,
    fullName: typeof meta.full_name === "string" ? meta.full_name : undefined,
    session,
  });

  const fullName =
    (typeof meta.full_name === "string" ? meta.full_name : null) ||
    session?.user?.email?.split("@")[0] ||
    null;
  if (fullName) {
    await client.from("profiles").update({ full_name: fullName }).eq("id", userId);
  }

  const now = new Date().toISOString();
  const payload = {
    id: userId,
    job_title: input.job_title,
    phone: input.phone,
    address: input.address,
    profile_photo_url: input.profile_photo_url,
    cv_url: input.cv_url,
    id_document_url: input.id_document_url,
    onboarding_completed: true,
    accepted_nda_at: now,
    accepted_employment_at: now,
    accepted_commission_at: now,
    updated_at: now,
  };

  let { error } = await client.from("employee_profiles").upsert(payload);

  if (error && /foreign key/i.test(error.message)) {
    const session = (await client.auth.getSession()).data.session;
    await ensureEmployeeAccount(client, {
      userId,
      position: input.job_title,
      session,
    });
    ({ error } = await client.from("employee_profiles").upsert(payload));
  }

  if (error) {
    throw new Error(onboardingSaveErrorMessage({ message: formatAuthError(error) }));
  }
}

/** True when browser marked onboarding done but Supabase has no saved completion. */
export async function isOnboardingOutOfSync(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (typeof window === "undefined" || !isLocalOnboardingComplete(userId)) return false;
  const record = await fetchEmployeeOnboarding(client, userId);
  return !record?.onboarding_completed;
}

export async function employeeNeedsOnboarding(
  client: SupabaseClient,
  userId: string,
  opts?: { onboardingCookie?: string | null }
): Promise<boolean> {
  try {
    const record = await withTimeout(fetchEmployeeOnboarding(client, userId), 1500, "Onboarding check");
    if (record?.onboarding_completed) return false;

    if (typeof window !== "undefined" && isLocalOnboardingComplete(userId)) {
      clearLocalOnboardingComplete(userId);
    }

    if (opts?.onboardingCookie && isOnboardingCookieComplete(userId, opts.onboardingCookie)) {
      return true;
    }

    return true;
  } catch {
    if (opts?.onboardingCookie && isOnboardingCookieComplete(userId, opts.onboardingCookie)) {
      return false;
    }
    if (typeof window !== "undefined" && isLocalOnboardingComplete(userId)) {
      return false;
    }
    return true;
  }
}

export async function uploadEmployeeDocument(
  userId: string,
  file: File,
  kind: "photo" | "cv" | "id",
  opts?: { required?: boolean }
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(EMPLOYEE_DOCUMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (!error) {
    const { data } = supabase.storage.from(EMPLOYEE_DOCUMENTS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  const isPolicyError = /row-level security|policy|permission denied/i.test(error.message);
  if (isPolicyError) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", kind);
        const response = await fetch("/api/employee/upload-document", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });
        const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
        if (response.ok && payload?.url) {
          return payload.url;
        }
        if (payload?.error) {
          if (opts?.required) throw new Error(payload.error);
          console.warn(payload.error);
          return null;
        }
      }
    } catch (fallbackErr) {
      if (opts?.required) {
        throw fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr));
      }
    }
  }

  const msg = `Upload failed (${kind}): ${error.message}. Run employee-documents-storage.sql in Supabase SQL Editor.`;
  if (opts?.required) throw new Error(msg);
  console.warn(msg);
  return null;
}

export function buildEmployeeInviteUrl(params: {
  origin: string;
  email?: string;
  name?: string;
  position?: string;
}): string {
  const url = new URL("/team-af-4m2x9/signup", params.origin);
  if (params.email) url.searchParams.set("email", params.email);
  if (params.name) url.searchParams.set("name", params.name);
  if (params.position) url.searchParams.set("position", params.position);
  return url.toString();
}
