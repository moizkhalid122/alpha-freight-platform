import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listCancellationRequestsForSupplier } from "@/lib/cancel-load-server";

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
  try {
    const supabase = createAuthedSupabase(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await listCancellationRequestsForSupplier(supabase, user.id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ requests: result.requests });
  } catch (error) {
    console.error("[supplier/cancellations]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch cancellations" },
      { status: 500 }
    );
  }
}
