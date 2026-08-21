import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  COMMERCIAL_DIRECTOR_ROLE,
  isCommercialDirectorEmail,
} from "@/lib/commercial-director-access";
import { fetchProfileRoleRest } from "@/lib/admin-rest";
import { withTimeout } from "@/lib/employee-auth-utils";

export type CommercialDirectorAccessResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

type JwtPayload = {
  email?: string;
  sub?: string;
  user_metadata?: { email?: string };
};

function readJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function readJwtEmail(jwt: JwtPayload | null) {
  if (!jwt) return null;
  if (jwt.email) return jwt.email;
  return jwt.user_metadata?.email ?? null;
}

function createSupabaseApiClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Route handlers only read the session cookie here.
      },
    },
  });
}

async function userHasCommercialDirectorAccess(userId: string, email?: string | null) {
  if (isCommercialDirectorEmail(email)) {
    return true;
  }

  try {
    const role = await fetchProfileRoleRest(userId);
    return String(role ?? "").toLowerCase() === COMMERCIAL_DIRECTOR_ROLE;
  } catch {
    return false;
  }
}

export async function verifyCommercialDirectorApiAccess(
  request: NextRequest
): Promise<CommercialDirectorAccessResult> {
  const allowDevBypass =
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_DEV_COMMERCIAL_DIRECTOR_BYPASS === "true";

  if (allowDevBypass) {
    return { ok: true };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      ok: false,
      status: 503,
      error: "Commercial Director API is not configured.",
    };
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  const jwt = bearerToken ? readJwtPayload(bearerToken) : null;
  const jwtEmail = readJwtEmail(jwt);

  if (jwtEmail && isCommercialDirectorEmail(jwtEmail)) {
    return { ok: true };
  }

  if (jwt?.sub && (await userHasCommercialDirectorAccess(jwt.sub, jwtEmail))) {
    return { ok: true };
  }

  try {
    const cookieClient = createSupabaseApiClient(request);
    const {
      data: { session },
    } = await withTimeout(cookieClient.auth.getSession(), 1500, "Commercial Director cookie session");

    if (
      session?.user &&
      (await userHasCommercialDirectorAccess(session.user.id, session.user.email))
    ) {
      return { ok: true };
    }
  } catch {
    // Fall through.
  }

  if (!bearerToken) {
    return { ok: false, status: 401, error: "Missing authorization token." };
  }

  return { ok: false, status: 401, error: "Invalid or expired session." };
}
