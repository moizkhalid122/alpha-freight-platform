import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reviewLoadPodServer, type PodReviewDecision } from "@/lib/review-load-pod-server";

function createAuthedSupabase(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
}

const VALID_DECISIONS = new Set<PodReviewDecision>(["verified", "rejected", "info_required"]);

export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthedSupabase(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const loadId = String(body.loadId || "").trim();
    const decision = String(body.decision || "").trim() as PodReviewDecision;
    const note = body.note ? String(body.note).trim() : undefined;

    if (!loadId) {
      return NextResponse.json({ error: "Missing loadId" }, { status: 400 });
    }

    if (!VALID_DECISIONS.has(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const result = await reviewLoadPodServer(supabase, {
      loadId,
      supplierId: user.id,
      decision,
      note,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, load: result.load });
  } catch (error) {
    console.error("[supplier/review-pod]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update POD review" },
      { status: 500 }
    );
  }
}
