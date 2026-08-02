import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CopilotPlatformIntent,
  CopilotPlatformLoad,
  CopilotPlatformResult,
  CopilotQuickAction,
  StructuredAssistantReply,
} from "@/lib/chat-types";
import type { CopilotUserContext } from "@/lib/copilot/user-context";

function formatMoney(value: number): string {
  return `£${value.toFixed(2)}`;
}

function formatStatus(status: string): string {
  return status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreLoad(
  load: { route: string; price: number; equipment: string },
  intent?: CopilotPlatformIntent
): number {
  let score = 70;
  const loc = String(intent?.location || "").toLowerCase();
  const equip = String(intent?.equipmentType || "").toLowerCase();
  if (loc && load.route.toLowerCase().includes(loc)) score += 15;
  if (equip && load.equipment.toLowerCase().includes(equip)) score += 12;
  score += Math.min(10, Math.round(load.price / 300));
  return Math.min(score, 99);
}

function toLoadCard(
  load: { id: string; route: string; price: number; equipment: string; status?: string },
  role: "carrier" | "supplier"
): CopilotPlatformLoad {
  const [origin, dest] = load.route.split("→").map((s) => s.trim());
  return {
    id: load.id,
    title: `${origin || "Pickup"} → ${dest || "Delivery"}`,
    subtitle: `${load.equipment} · ${formatMoney(load.price)}`,
    score: 85,
    metrics: [
      { label: "Rate", value: formatMoney(load.price) },
      { label: "Equipment", value: load.equipment },
      ...(load.status ? [{ label: "Status", value: formatStatus(load.status) }] : []),
    ],
    primaryAction: {
      label: role === "carrier" ? "View & Bid" : "Track Load",
      href: role === "carrier" ? "/carrier/find-loads" : "/supplier/my-posts",
      action: role === "carrier" ? `Show load ${load.id} details` : `Open load ${load.id}`,
      variant: "primary" as const,
    },
    secondaryActions: [
      {
        label: "Calculate Profit",
        action: `Calculate profit for ${origin} to ${dest} at ${formatMoney(load.price)}`,
        variant: "ghost" as const,
        context: { origin: origin || "", destination: dest || "", rate: load.price, equipment: load.equipment },
      },
    ],
  };
}

export function enrichPlatformReply(
  reply: StructuredAssistantReply,
  ctx: CopilotUserContext | null,
  prompt: string
): StructuredAssistantReply {
  if (!ctx || !reply.platformIntent) return reply;

  const intent = reply.platformIntent;

  if (intent.type === "loads_search" && ctx.availableLoads.length) {
    const ranked = [...ctx.availableLoads]
      .map((l) => ({ load: l, score: scoreLoad(l, intent) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const best = ranked[0]?.load;
    const platformResult: CopilotPlatformResult = {
      title: best ? `Best match: ${best.route}` : "Available loads on platform",
      subtitle: `${ctx.availableLoads.length} active loads found — ranked by fit and pay`,
      totalCount: ctx.availableLoads.length,
      loads: ranked.map(({ load, score }) => ({ ...toLoadCard(load, "carrier"), score })),
    };

    return {
      ...reply,
      title: best ? `🚛 Top Load: ${best.route}` : reply.title,
      shortExplanation: best
        ? `I found ${ctx.availableLoads.length} active loads. Best match is ${best.route} at ${formatMoney(best.price)} (${best.equipment}).`
        : reply.shortExplanation,
      platformResult,
      quickActions: [
        { label: "Find More Loads", href: "/carrier/find-loads", action: "Show all available loads", variant: "primary" },
        ...(best
          ? [{ label: "Calculate Profit", action: `Profit for ${best.route} at ${formatMoney(best.price)}`, variant: "secondary" as const }]
          : []),
      ],
    };
  }

  if (intent.type === "active_loads_lookup" && ctx.myLoads.length) {
    return {
      ...reply,
      platformResult: {
        title: "Your active loads",
        subtitle: `${ctx.myLoads.length} loads on your account`,
        totalCount: ctx.myLoads.length,
        loads: ctx.myLoads.slice(0, 4).map((l) => toLoadCard(l, ctx.role === "supplier" ? "supplier" : "carrier")),
      },
    };
  }

  if (intent.type === "bids_lookup" && ctx.bids.length) {
    const pending = ctx.bids.filter((b) => b.status === "pending");
    return {
      ...reply,
      metrics: [
        ...(reply.metrics || []),
        { label: "Total bids", value: String(ctx.bids.length) },
        { label: "Pending", value: String(pending.length), tone: pending.length ? "warning" : "neutral" },
      ],
      keyPoints: [
        ...reply.keyPoints,
        ...ctx.bids.slice(0, 4).map((b) => `📋 ${b.route}: ${formatMoney(b.amount)} (${formatStatus(b.status)})`),
      ].slice(0, 6),
    };
  }

  if (intent.type === "earnings_lookup" && ctx.wallet) {
    return {
      ...reply,
      metrics: [
        { label: "Available", value: formatMoney(ctx.wallet.available), tone: "positive", icon: "💰" },
        { label: "Pending", value: formatMoney(ctx.wallet.pending), icon: "⏳" },
        { label: "Lifetime", value: formatMoney(ctx.wallet.lifetime), icon: "📈" },
      ],
      quickActions: [
        { label: "View Wallet", href: "/carrier/wallet", action: "Open my wallet", variant: "primary" },
        { label: "Withdraw", href: "/carrier/wallet", action: "How do I withdraw?", variant: "secondary" },
      ],
    };
  }

  return reply;
}

export async function executeCreateLoad(
  supabase: SupabaseClient,
  reply: StructuredAssistantReply
): Promise<StructuredAssistantReply> {
  if (reply.actionRequest?.type !== "create_load" || reply.actionRequest.status !== "ready") {
    return reply;
  }

  const payload = reply.actionRequest.payload || {};
  const origin = String(payload.origin || "").trim();
  const destination = String(payload.destination || "").trim();
  const equipment = String(payload.equipment || "").trim();
  if (!origin || !destination || !equipment) return reply;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return reply;

  const price = Number(payload.price || 0);
  const { data, error } = await supabase
    .from("loads")
    .insert({
      supplier_id: user.id,
      status: "active",
      title: `${equipment} load`,
      origin,
      destination,
      equipment,
      price: Number.isFinite(price) ? price : 0,
      weight: payload.weight ? String(payload.weight) : null,
    })
    .select("id,origin,destination,equipment,price,status")
    .single();

  if (error || !data) return reply;

  const quickActions: CopilotQuickAction[] = [
    { label: "View My Posts", href: "/supplier/my-posts", action: `Open load ${data.id}`, variant: "primary" },
    { label: "View Bids", href: "/supplier/my-bids", action: "Review incoming bids", variant: "secondary" },
  ];

  return {
    ...reply,
    title: "✅ Load posted successfully",
    shortExplanation: `Your ${equipment} load from ${origin} to ${destination} is now live at ${formatMoney(Number(data.price || 0))}.`,
    keyPoints: [
      `Load ID: ${data.id}`,
      `Route: ${origin} → ${destination}`,
      `Equipment: ${equipment}`,
      `Status: ${formatStatus(String(data.status))}`,
    ],
    actionRequest: { ...reply.actionRequest, status: "completed", successMessage: "Load created" },
    platformResult: {
      title: "New load is live",
      subtitle: "Carriers can now view and bid",
      totalCount: 1,
      loads: [toLoadCard({ id: String(data.id), route: `${origin} → ${destination}`, price: Number(data.price || 0), equipment, status: String(data.status) }, "supplier")],
    },
    quickActions,
  };
}
