type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const guestStore = new Map<string, RateLimitEntry>();
const memberStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 60 * 1000;

/** Free trial for visitors — same smart model, limited questions before signup */
export const PUBLIC_AI_GUEST_LIMIT = 5;

/** Logged-in members — generous but prevents abuse */
export const PUBLIC_AI_MEMBER_LIMIT = 60;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxMessages: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: maxMessages - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= maxMessages) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: maxMessages - entry.count, resetAt: entry.resetAt };
}

export function checkPublicAiGuestRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return checkRateLimit(guestStore, ip, PUBLIC_AI_GUEST_LIMIT);
}

export function checkPublicAiMemberRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return checkRateLimit(memberStore, `member:${userId}`, PUBLIC_AI_MEMBER_LIMIT);
}

/** @deprecated Use PUBLIC_AI_GUEST_LIMIT */
export const PUBLIC_AI_MESSAGE_LIMIT = PUBLIC_AI_GUEST_LIMIT;

/** Back-compat wrapper */
export function checkPublicAiRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return checkPublicAiGuestRateLimit(ip);
}

export function getMemberDashboardPath(role: string | null | undefined): string {
  if (role === "supplier") return "/supplier/dashboard";
  if (role === "carrier") return "/carrier/dashboard";
  if (role === "employee") return "/employee";
  return "/carrier/dashboard";
}

/** Lane picker — road / air / sea before sign-in or account access */
export const PUBLIC_AI_ACCOUNT_HUB_PATH = "/auth/modes";

export function buildSignInRedirectHref(_dashboardPath = "/carrier/dashboard"): string {
  return PUBLIC_AI_ACCOUNT_HUB_PATH;
}
