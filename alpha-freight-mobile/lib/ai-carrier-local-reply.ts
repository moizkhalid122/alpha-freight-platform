import type { AiAssistantReply, AiQuickAction } from "@/lib/ai-assistant-responses";
import type { AiCarrierContext } from "@/lib/ai-carrier-context";

function isWalletQuestion(text: string) {
  return /\b(wallet|balance|available funds?|pending payout|earnings?|payout|payment status)\b/i.test(text);
}

function isAvailableLoadsQuestion(text: string) {
  return /\b(available loads?|best loads?|marketplace|find loads?|high pay|show me loads?)\b/i.test(text);
}

function isMyLoadsQuestion(text: string) {
  return /\b(my loads?|active loads?|in[- ]transit|assigned loads?|current jobs?|deliveries?)\b/i.test(text);
}

function isBidsQuestion(text: string) {
  return /\b(bids?|pending bids?|my offers?|bid status)\b/i.test(text);
}

function withActions(reply: AiAssistantReply, actions: AiQuickAction[]): AiAssistantReply {
  return { ...reply, actions };
}

export function tryBuildCarrierLocalReply(
  message: string,
  context: AiCarrierContext | null
): AiAssistantReply | null {
  if (!context) return null;

  const text = message.trim();
  const name = context.carrierName.split(" ")[0] || "there";

  if (isWalletQuestion(text)) {
    return withActions(
      {
        title: `Hi ${name}, your wallet snapshot`,
        sectionLabel: "Current balances:",
        bullets: [
          `Available: ${context.wallet.availableBalance}`,
          `Pending / incoming: ${context.wallet.pendingBalance}`,
          `Lifetime earnings: ${context.wallet.lifetimeEarnings}`,
        ],
        footer: "Open Wallet for payout history and bank setup.",
      },
      [{ id: "wallet", label: "Open Wallet", route: "/(main)/wallet" }]
    );
  }

  if (isAvailableLoadsQuestion(text)) {
    const lines =
      context.availableLoads.length > 0
        ? context.availableLoads.slice(0, 5).map(
            (load) =>
              `${load.code} · ${load.route} · ${load.price}${load.highPay ? " · High pay" : ""}${load.pickup ? ` · ${load.pickup}` : ""}`
          )
        : ["No paid marketplace loads are live right now. Check again soon or widen your lanes."];

    return withActions(
      {
        title: `Hi ${name}, top available loads`,
        sectionLabel: `${context.stats.availableLoads} load(s) on the marketplace:`,
        bullets: lines,
        footer: "Open Loads to bid on routes that fit your fleet.",
      },
      [{ id: "loads", label: "Browse Loads", route: "/(main)/loads" }]
    );
  }

  if (isMyLoadsQuestion(text)) {
    const lines =
      context.myLoads.length > 0
        ? context.myLoads.slice(0, 5).map(
            (load) => `${load.code} · ${load.route} · ${load.status} · ${load.price}`
          )
        : ["You have no active assigned loads right now. Browse Loads to pick up freight."];

    return withActions(
      {
        title: `Hi ${name}, your active loads`,
        sectionLabel: `${context.stats.activeLoads} active · ${context.stats.inTransitLoads} in transit:`,
        bullets: lines,
        footer: "Open My Loads for POD upload, tracking, and delivery updates.",
      },
      [{ id: "my-loads", label: "My Loads", route: "/my-loads" }]
    );
  }

  if (isBidsQuestion(text)) {
    const pending = context.bids.filter((bid) => bid.status.toLowerCase() === "pending");
    const lines =
      pending.length > 0
        ? pending.slice(0, 5).map(
            (bid) => `${bid.code} · ${bid.route} · ${bid.bidAmount}${bid.loadPrice ? ` (load ${bid.loadPrice})` : ""}`
          )
        : [`You have ${context.stats.pendingBids} pending bid(s).`, "Browse Loads to place new offers on live freight."];

    return withActions(
      {
        title: `Hi ${name}, your bid status`,
        sectionLabel: "Latest bids:",
        bullets: lines,
        footer: "Suppliers review bids in real time — watch for accept notifications.",
      },
      [{ id: "loads-bid", label: "Browse Loads", route: "/(main)/loads" }]
    );
  }

  return null;
}
