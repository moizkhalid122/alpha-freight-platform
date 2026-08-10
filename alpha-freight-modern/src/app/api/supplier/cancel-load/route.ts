import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requestCancelLoadServer } from "@/lib/cancel-load-server";
import type { CancellationRequestType } from "@/lib/load-cancellation";

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
    const reason = String(body.reason || "").trim();
    const reasonDetail = body.reasonDetail ? String(body.reasonDetail).trim() : undefined;
    const requestType = (body.requestType || "cancellation") as CancellationRequestType;

    if (!loadId) {
      return NextResponse.json({ error: "Missing loadId" }, { status: 400 });
    }

    const result = await requestCancelLoadServer(supabase, {
      loadId,
      supplierId: user.id,
      reason,
      reasonDetail,
      requestType,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      request: result.request,
      load: result.load,
      autoRefunded: result.autoRefunded,
      refundAmount: result.refundAmount,
      message: result.message,
    });
  } catch (error) {
    console.error("[supplier/cancel-load]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to cancel load" },
      { status: 500 }
    );
  }
}
