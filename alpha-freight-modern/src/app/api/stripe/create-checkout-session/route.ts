import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAppBaseUrl, getStripeClient, getStripeMode } from "@/lib/stripe-server";

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
    const amount = Number(body.amount || 0);
    const title = String(body.title || "Alpha Freight Load Payment").trim();

    if (!loadId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid load or amount" }, { status: 400 });
    }

    const { data: load, error: loadError } = await supabase
      .from("loads")
      .select("id, supplier_id, price, origin, destination, payment_state")
      .eq("id", loadId)
      .eq("supplier_id", user.id)
      .maybeSingle();

    if (loadError || !load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    if (load.payment_state === "paid") {
      return NextResponse.json({ error: "Load already paid" }, { status: 409 });
    }

    const payableAmount = Number(load.price || amount);
    const baseUrl = getAppBaseUrl();

    if (getStripeMode() === "dev") {
      return NextResponse.json({
        mode: "dev" as const,
        loadId,
        amount: payableAmount,
        message: "Stripe keys not configured. Use dev checkout to simulate payment.",
      });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(payableAmount * 100),
            product_data: {
              name: title,
              description: [load.origin, load.destination].filter(Boolean).join(" → ") || undefined,
            },
          },
        },
      ],
      metadata: {
        loadId,
        supplierId: user.id,
      },
      success_url: `${baseUrl}/supplier/pay-instant/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/supplier/pay-instant?load=${loadId}`,
    });

    await supabase
      .from("supplier_payments")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("load_id", loadId)
      .eq("supplier_id", user.id);

    return NextResponse.json({
      mode: "stripe" as const,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[stripe/create-checkout-session]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout session" },
      { status: 500 }
    );
  }
}
