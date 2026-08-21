import { NextRequest, NextResponse } from "next/server";
import { verifyCommercialDirectorApiAccess } from "@/lib/commercial-director-api-auth";
import {
  fetchCommercialEmployeesRest,
  fetchCommercialProfilesByRoleRest,
} from "@/lib/commercial-director-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "private, max-age=30" };
const SERVER_CACHE_MS = 5 * 60_000;

type Role = "supplier" | "carrier" | "employee";
type CacheEntry = {
  expiresAt: number;
  profiles: Awaited<ReturnType<typeof fetchCommercialProfilesByRoleRest>>;
};

const profileCache = new Map<Role, CacheEntry>();

async function loadProfiles(role: Role) {
  if (role === "employee") {
    return fetchCommercialEmployeesRest();
  }
  return fetchCommercialProfilesByRoleRest(role);
}

export async function GET(request: NextRequest) {
  const access = await verifyCommercialDirectorApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (role !== "supplier" && role !== "carrier" && role !== "employee") {
    return NextResponse.json({ error: "Invalid role filter." }, { status: 400 });
  }

  const now = Date.now();
  const cached = profileCache.get(role);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json({ profiles: cached.profiles }, { headers: CACHE_HEADERS });
  }

  try {
    const profiles = await loadProfiles(role);
    profileCache.set(role, { expiresAt: now + SERVER_CACHE_MS, profiles });
    return NextResponse.json({ profiles }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[commercial-director/profiles]", error);
    if (cached) {
      return NextResponse.json({ profiles: cached.profiles }, { headers: CACHE_HEADERS });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch profiles.",
      },
      { status: 503 }
    );
  }
}
