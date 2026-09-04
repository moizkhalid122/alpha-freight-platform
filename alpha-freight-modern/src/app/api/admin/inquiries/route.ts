import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import { fetchAdminInquiriesRest } from "@/lib/admin-rest";
import type { InquiryRecord, InquiryStatus } from "@/lib/inquiry-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<InquiryStatus>(["new", "read", "replied", "resolved"]);
const CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
const SERVER_CACHE_MS = 5 * 60_000;

let inquiriesCache: {
  expiresAt: number;
  rows: InquiryRecord[];
} | null = null;

function buildInquiriesPayload(rows: InquiryRecord[], status: string | null) {
  const stats = {
    total: rows.length,
    new: rows.filter((row) => row.status === "new").length,
    read: rows.filter((row) => row.status === "read").length,
    replied: rows.filter((row) => row.status === "replied").length,
    resolved: rows.filter((row) => row.status === "resolved").length,
  };

  const inquiries =
    status && VALID_STATUSES.has(status as InquiryStatus)
      ? rows.filter((row) => row.status === status)
      : rows;

  return { inquiries, stats };
}

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const now = Date.now();

  if (inquiriesCache && inquiriesCache.expiresAt > now) {
    return NextResponse.json(buildInquiriesPayload(inquiriesCache.rows, status), {
      headers: CACHE_HEADERS,
    });
  }

  try {
    const rows = (await fetchAdminInquiriesRest()) as InquiryRecord[];
    inquiriesCache = { expiresAt: now + SERVER_CACHE_MS, rows };
    return NextResponse.json(buildInquiriesPayload(rows, status), { headers: CACHE_HEADERS });
  } catch (restError) {
    console.warn("[admin/inquiries GET] REST failed, trying Supabase client:", restError);

    try {
      const db = getSupabaseForAdminApi(request);
      const { data, error } = await db
        .from("website_inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as InquiryRecord[];
      inquiriesCache = { expiresAt: now + SERVER_CACHE_MS, rows };
      return NextResponse.json(buildInquiriesPayload(rows, status), { headers: CACHE_HEADERS });
    } catch (fallbackError) {
      console.error("[admin/inquiries GET]", fallbackError);
      if (inquiriesCache) {
        return NextResponse.json(buildInquiriesPayload(inquiriesCache.rows, status), {
          headers: CACHE_HEADERS,
        });
      }
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : "Unable to fetch inquiries." },
        { status: 503 },
      );
    }
  }
}

export async function PATCH(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      status?: InquiryStatus;
      adminNotes?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Inquiry id is required." }, { status: 400 });
    }

    const updates: Record<string, string> = {};

    if (body.status) {
      if (!VALID_STATUSES.has(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (typeof body.adminNotes === "string") {
      updates.admin_notes = body.adminNotes.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    const db = getSupabaseForAdminApi(request);
    const { data, error } = await db
      .from("website_inquiries")
      .update(updates)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    inquiriesCache = null;
    return NextResponse.json({ ok: true, inquiry: data });
  } catch (error) {
    console.error("[admin/inquiries PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update inquiry." },
      { status: 500 },
    );
  }
}
