import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/stripe-server";
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
    const sessionId = String(body.sessionId || "").trim();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const loadId = String(session.metadata?.loadId || "").trim();
    const supplierId = String(session.metadata?.supplierId || "").trim();

    if (!loadId || supplierId !== user.id) {
      return NextResponse.json({ error: "Invalid checkout session" }, { status: 403 });
    }

    const result = await markLoadPaymentPaidServer(supabase, {
      loadId,
      supplierId: user.id,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      loadId: result.loadId,
      amount: session.amount_total ? session.amount_total / 100 : null,
    });
  } catch (error) {
    console.error("[stripe/verify-session]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify payment" },
      { status: 500 }
    );
  }
}
