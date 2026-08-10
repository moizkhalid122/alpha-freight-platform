import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeSupplierLoadDraft, type SupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";
import { fetchMarketRateLoadsCached } from "@/lib/copilot/market-loads-cache";

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
    const body = await request.json();
    const draft = (body.draft || body) as SupplierLoadDraft;
    const currency = String(body.currency || "GBP");

    const quickAdvisory = analyzeSupplierLoadDraft(draft, [], currency);

    let marketLoads: Awaited<ReturnType<typeof fetchMarketRateLoadsCached>> = [];
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const supabase = createAuthedSupabase(request);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        marketLoads = await fetchMarketRateLoadsCached(supabase, 2000);
      }
    }

    const advisory =
      marketLoads.length > 0
        ? analyzeSupplierLoadDraft(draft, marketLoads, currency)
        : quickAdvisory;

    return NextResponse.json({ advisory, quick: marketLoads.length === 0 });
  } catch (error) {
    console.error("[supplier/advise-load]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyse load" },
      { status: 500 }
    );
  }
}
