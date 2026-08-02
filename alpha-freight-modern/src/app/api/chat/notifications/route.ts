import { NextRequest, NextResponse } from "next/server";
import { createAuthedSupabaseFromRequest } from "@/lib/admin-api-db";
import { fetchCopilotUserContext } from "@/lib/copilot/user-context";
import { buildProactiveAlerts } from "@/lib/copilot/notifications";
import { withTimeout } from "@/lib/copilot/timeout";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = createAuthedSupabaseFromRequest(request);
  const assistantType =
    request.nextUrl.searchParams.get("assistantType") === "supplier" ? "supplier" : "carrier";

  const ctx = await withTimeout(
    fetchCopilotUserContext(supabase, assistantType),
    3500,
    null
  );
  const alerts = buildProactiveAlerts(ctx);

  return NextResponse.json({ alerts });
}
