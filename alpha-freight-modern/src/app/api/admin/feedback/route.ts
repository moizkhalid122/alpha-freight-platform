import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import { getSupabaseForAdminApi } from "@/lib/admin-api-db";
import type { FeedbackRecord, FeedbackStatus } from "@/lib/feedback-content";

const VALID_STATUSES = new Set<FeedbackStatus>(["new", "reviewed", "resolved"]);

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const db = getSupabaseForAdminApi(request);
    const { data, error } = await db
      .from("user_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as FeedbackRecord[];
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

    return NextResponse.json({ feedback, stats });
  } catch (error) {
    console.error("[admin/feedback GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch feedback." },
      { status: 500 },
    );
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

    return NextResponse.json({ ok: true, feedback: data });
  } catch (error) {
    console.error("[admin/feedback PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update feedback." },
      { status: 500 },
    );
  }
}
