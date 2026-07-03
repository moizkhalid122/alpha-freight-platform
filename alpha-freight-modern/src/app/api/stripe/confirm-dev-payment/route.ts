import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient, getStripeMode } from "@/lib/stripe-server";
import { markLoadPaymentPaidServer } from "@/lib/mark-load-paid-server";

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
  if (getStripeMode() !== "dev") {
    return NextResponse.json(
      { error: "Dev payment simulation is disabled when Stripe is configured." },
      { status: 403 }
    );
  }

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
    const cardBrand = body.cardBrand ? String(body.cardBrand) : "Dev Card";
    const cardLast4 = body.cardLast4 ? String(body.cardLast4) : "4242";

    if (!loadId) {
      return NextResponse.json({ error: "Missing loadId" }, { status: 400 });
    }

    const result = await markLoadPaymentPaidServer(supabase, {
      loadId,
      supplierId: user.id,
      cardBrand,
      cardLast4,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, loadId: result.loadId, paidAt: result.paidAt });
  } catch (error) {
    console.error("[stripe/confirm-dev-payment]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to confirm dev payment" },
      { status: 500 }
    );
  }
}
