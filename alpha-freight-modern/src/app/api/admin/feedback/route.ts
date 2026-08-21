import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import { fetchAdminFeedbackRest } from "@/lib/admin-rest";
import type { FeedbackRecord, FeedbackStatus } from "@/lib/feedback-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<FeedbackStatus>(["new", "reviewed", "resolved"]);
const CACHE_HEADERS = { "Cache-Control": "private, max-age=60" };
const SERVER_CACHE_MS = 5 * 60_000;

let feedbackCache: {
  expiresAt: number;
  rows: FeedbackRecord[];
} | null = null;

function buildFeedbackPayload(rows: FeedbackRecord[], status: string | null) {
  const stats = {
    total: rows.length,
    new: rows.filter((row) => row.status === "new").length,
    reviewed: rows.filter((row) => row.status === "reviewed").length,
    resolved: rows.filter((row) => row.status === "resolved").length,
  };

  const feedback =
    status && VALID_STATUSES.has(status as FeedbackStatus)
      ? rows.filter((row) => row.status === status)
      : rows;

  return { feedback, stats };
}

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const now = Date.now();

  if (feedbackCache && feedbackCache.expiresAt > now) {
    return NextResponse.json(buildFeedbackPayload(feedbackCache.rows, status), {
      headers: CACHE_HEADERS,
    });
  }

  try {
    const rows = (await fetchAdminFeedbackRest()) as FeedbackRecord[];
    feedbackCache = { expiresAt: now + SERVER_CACHE_MS, rows };
    return NextResponse.json(buildFeedbackPayload(rows, status), { headers: CACHE_HEADERS });
  } catch (restError) {
    console.warn("[admin/feedback GET] REST failed, trying Supabase client:", restError);

    try {
      const db = getSupabaseForAdminApi(request);
      const { data, error } = await db
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as FeedbackRecord[];
      feedbackCache = { expiresAt: now + SERVER_CACHE_MS, rows };
      return NextResponse.json(buildFeedbackPayload(rows, status), { headers: CACHE_HEADERS });
    } catch (fallbackError) {
      console.error("[admin/feedback GET]", fallbackError);
      if (feedbackCache) {
        return NextResponse.json(buildFeedbackPayload(feedbackCache.rows, status), {
          headers: CACHE_HEADERS,
        });
      }
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : "Unable to fetch feedback." },
        { status: 503 }
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
      status?: FeedbackStatus;
      adminNotes?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Feedback id is required." }, { status: 400 });
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
      .from("user_feedback")
      .update(updates)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    feedbackCache = null;
    return NextResponse.json({ ok: true, feedback: data });
  } catch (error) {
    console.error("[admin/feedback PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update feedback." },
      { status: 500 }
    );
  }
}
