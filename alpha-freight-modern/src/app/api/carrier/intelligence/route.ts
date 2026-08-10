import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildCarrierIntelligenceReply,
  buildCarrierProfitReply,
  buildBidStrategyReply,
  buildBackhaulPlannerReply,
  buildLoadMatcherReply,
  fetchMarketRateLoads,
} from "@/lib/copilot/carrier-intelligence";
import { fetchCopilotUserContext } from "@/lib/copilot/user-context";
import { detectIntent } from "@/lib/copilot/intent-detector";

function createAuthedSupabase(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: authHeader },
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
    const action = String(body.action || "chat").trim();
    const message = String(body.message || "").trim();

    const [ctx, marketLoads] = await Promise.all([
      fetchCopilotUserContext(supabase, "carrier"),
      fetchMarketRateLoads(supabase),
    ]);

    if (!ctx) {
      return NextResponse.json({ error: "Unable to load carrier context." }, { status: 400 });
    }

    if (action === "profit") {
      const reply = buildCarrierProfitReply({
        rate: Number(body.rate || 0),
        loadedMiles: Number(body.loadedMiles || body.miles || 0),
        emptyMiles: body.emptyMiles != null ? Number(body.emptyMiles) : undefined,
      });
      return NextResponse.json({ reply });
    }

    if (action === "bid_strategy") {
      const reply = buildBidStrategyReply({
        origin: String(body.origin || ""),
        destination: String(body.destination || ""),
        proposedBid: Number(body.proposedBid || body.rate || 0),
        equipment: body.equipment ? String(body.equipment) : undefined,
        marketLoads,
      });
      return NextResponse.json({ reply });
    }

    if (action === "backhaul") {
      const reply = buildBackhaulPlannerReply({
        fromCity: String(body.fromCity || body.location || ""),
        equipment: body.equipment ? String(body.equipment) : undefined,
        marketLoads,
      });
      return NextResponse.json({ reply });
    }

    if (action === "match_loads") {
      const detected = detectIntent(message || "find loads", "carrier");
      const reply = buildLoadMatcherReply(ctx, detected.platformIntent);
      return NextResponse.json({ reply });
    }

    const detected = detectIntent(message, "carrier");
    const reply = buildCarrierIntelligenceReply(ctx, detected, message, marketLoads);
    if (!reply) {
      return NextResponse.json({ error: "Could not analyse request." }, { status: 400 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[carrier/intelligence]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Carrier intelligence failed" },
      { status: 500 }
    );
  }
}
