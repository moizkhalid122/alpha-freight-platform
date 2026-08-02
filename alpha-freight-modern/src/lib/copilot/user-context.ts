import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssistantKind } from "@/lib/chat-types";

export type CopilotUserContext = {
  userId: string;
  displayName: string;
  role: AssistantKind;
  wallet?: {
    available: number;
    pending: number;
    lifetime: number;
  };
  stats?: {
    activeLoads: number;
    pendingBids: number;
    availableLoads: number;
  };
  myLoads: Array<{ id: string; route: string; status: string; price: number; equipment: string }>;
  availableLoads: Array<{ id: string; route: string; price: number; equipment: string }>;
  bids: Array<{ id: string; route: string; amount: number; status: string }>;
};

function formatRoute(origin?: string | null, dest?: string | null): string {
  return `${origin?.trim() || "TBC"} → ${dest?.trim() || "TBC"}`;
}

export async function fetchCopilotUserContext(
  supabase: SupabaseClient,
  assistantType: AssistantKind
): Promise<CopilotUserContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const displayName =
    String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User");

  const ctx: CopilotUserContext = {
    userId: user.id,
    displayName,
    role: assistantType,
    myLoads: [],
    availableLoads: [],
    bids: [],
  };

  if (assistantType === "carrier" || assistantType === "general") {
    const [myLoadsRes, availRes, bidsRes, walletRes] = await Promise.all([
      supabase
        .from("loads")
        .select("id,origin,destination,pickup_location,delivery_location,status,price,max_budget,equipment,vehicle_type")
        .eq("carrier_id", user.id)
        .in("status", ["active", "booked", "loading", "in-transit"])
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("loads")
        .select("id,origin,destination,pickup_location,delivery_location,price,max_budget,equipment,vehicle_type,status")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("bids")
        .select("id,amount,status,loads(origin,destination,pickup_location,delivery_location,price)")
        .eq("carrier_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("carrier_wallets").select("available_balance,pending_balance,lifetime_earnings").eq("user_id", user.id).maybeSingle(),
    ]);

    ctx.myLoads = (myLoadsRes.data || []).map((l) => ({
      id: String(l.id),
      route: formatRoute(l.pickup_location || l.origin, l.delivery_location || l.destination),
      status: String(l.status || "active"),
      price: Number(l.price || l.max_budget || 0),
      equipment: String(l.equipment || l.vehicle_type || "General"),
    }));

    ctx.availableLoads = (availRes.data || []).map((l) => ({
      id: String(l.id),
      route: formatRoute(l.pickup_location || l.origin, l.delivery_location || l.destination),
      price: Number(l.price || l.max_budget || 0),
      equipment: String(l.equipment || l.vehicle_type || "General"),
    }));

    ctx.bids = (bidsRes.data || []).map((b) => {
      const load = b.loads as { origin?: string; destination?: string; pickup_location?: string; delivery_location?: string; price?: number } | null;
      return {
        id: String(b.id),
        route: formatRoute(load?.pickup_location || load?.origin, load?.delivery_location || load?.destination),
        amount: Number(b.amount || 0),
        status: String(b.status || "pending"),
      };
    });

    if (walletRes.data) {
      ctx.wallet = {
        available: Number(walletRes.data.available_balance || 0),
        pending: Number(walletRes.data.pending_balance || 0),
        lifetime: Number(walletRes.data.lifetime_earnings || 0),
      };
    }

    ctx.stats = {
      activeLoads: ctx.myLoads.length,
      pendingBids: ctx.bids.filter((b) => b.status === "pending").length,
      availableLoads: ctx.availableLoads.length,
    };
  }

  if (assistantType === "supplier" || assistantType === "general") {
    const [postsRes, bidsRes] = await Promise.all([
      supabase
        .from("loads")
        .select("id,origin,destination,status,price,equipment")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("bids")
        .select("id,amount,status,loads(origin,destination,price)")
        .in(
          "load_id",
          (
            await supabase.from("loads").select("id").eq("supplier_id", user.id).limit(20)
          ).data?.map((l) => l.id) || []
        )
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    ctx.myLoads = (postsRes.data || []).map((l) => ({
      id: String(l.id),
      route: formatRoute(l.origin, l.destination),
      status: String(l.status || "active"),
      price: Number(l.price || 0),
      equipment: String(l.equipment || "General"),
    }));

    ctx.bids = (bidsRes.data || []).map((b) => {
      const load = b.loads as { origin?: string; destination?: string; price?: number } | null;
      return {
        id: String(b.id),
        route: formatRoute(load?.origin, load?.destination),
        amount: Number(b.amount || 0),
        status: String(b.status || "pending"),
      };
    });

    ctx.stats = {
      activeLoads: ctx.myLoads.filter((l) => l.status === "active").length,
      pendingBids: ctx.bids.filter((b) => b.status === "pending").length,
      availableLoads: 0,
    };
  }

  return ctx;
}

export function formatUserContextForPrompt(ctx: CopilotUserContext): string {
  const lines = [`User: ${ctx.displayName} (${ctx.role})`];
  if (ctx.wallet) {
    lines.push(
      `Wallet: £${ctx.wallet.available.toFixed(2)} available, £${ctx.wallet.pending.toFixed(2)} pending, £${ctx.wallet.lifetime.toFixed(2)} lifetime`
    );
  }
  if (ctx.stats) {
    lines.push(
      `Stats: ${ctx.stats.activeLoads} active loads, ${ctx.stats.pendingBids} pending bids, ${ctx.stats.availableLoads} available loads on platform`
    );
  }
  if (ctx.myLoads.length) {
    lines.push("User's loads: " + ctx.myLoads.map((l) => `${l.route} (${l.status}, £${l.price})`).join("; "));
  }
  if (ctx.availableLoads.length) {
    lines.push(
      "Available platform loads: " +
        ctx.availableLoads.slice(0, 5).map((l) => `${l.route} £${l.price} ${l.equipment}`).join("; ")
    );
  }
  if (ctx.bids.length) {
    lines.push("User's bids: " + ctx.bids.map((b) => `${b.route} £${b.amount} (${b.status})`).join("; "));
  }
  return lines.join("\n");
}
