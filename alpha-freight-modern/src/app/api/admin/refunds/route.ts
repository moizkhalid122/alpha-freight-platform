import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminApiAccess } from "@/lib/admin-api-auth";
import {
  decideCancellationRequestServer,
  listCancellationRequestsForAdmin,
} from "@/lib/cancel-load-server";

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

export async function GET(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const result = await listCancellationRequestsForAdmin();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ requests: result.requests });
}

export async function PATCH(request: NextRequest) {
  const access = await verifyAdminApiAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    const requestId = String(body.requestId || "").trim();
    const action = String(body.action || "").trim() as "approve" | "reject" | "process_refund";

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    if (!["approve", "reject", "process_refund"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let adminUserId = "admin";
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createAuthedSupabase(request);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) adminUserId = user.id;
    }

    const result = await decideCancellationRequestServer({
      requestId,
      adminUserId,
      action,
      refundAmount: body.refundAmount != null ? Number(body.refundAmount) : undefined,
      deductionAmount: body.deductionAmount != null ? Number(body.deductionAmount) : undefined,
      deductionReason: body.deductionReason ? String(body.deductionReason) : undefined,
      adminNote: body.adminNote ? String(body.adminNote) : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, request: result.request });
  } catch (error) {
    console.error("[admin/refunds]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update refund request" },
      { status: 500 }
    );
  }
}
