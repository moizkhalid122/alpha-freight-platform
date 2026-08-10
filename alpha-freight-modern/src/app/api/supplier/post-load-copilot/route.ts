import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeSupplierLoadDraft, type SupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";
import { fetchMarketRateLoadsCached } from "@/lib/copilot/market-loads-cache";
import {
  getPostLoadCopilotReply,
  type PostLoadCopilotTrigger,
} from "@/lib/copilot/post-load-copilot";
import type { RateLoadRow } from "@/lib/freight-tools";

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
    const draft = (body.draft || {}) as SupplierLoadDraft;
    const currentStep = Number(body.currentStep || 1);
    const trigger = (body.trigger || "idle") as PostLoadCopilotTrigger;
    const returningAfterDismiss = Boolean(body.returningAfterDismiss);
    const agreementAccepted = Boolean(body.agreementAccepted);
    const idleMs = Number(body.idleMs || 0);
    const language = typeof body.language === "string" ? (body.language as import("@/lib/copilot/language").LanguagePreference) : undefined;
    const currency = String(body.currency || "GBP");

    const quickAdvisory = analyzeSupplierLoadDraft(draft, [], currency);

    let marketLoads: RateLoadRow[] = [];
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

    const result = await getPostLoadCopilotReply({
      draft,
      currentStep,
      trigger,
      advisory,
      returningAfterDismiss,
      agreementAccepted,
      idleMs,
      language,
    });

    const { observation, ...reply } = result;

    return NextResponse.json({ reply, observation, advisory });
  } catch (error) {
    console.error("[supplier/post-load-copilot]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate copilot reply" },
      { status: 500 }
    );
  }
}
