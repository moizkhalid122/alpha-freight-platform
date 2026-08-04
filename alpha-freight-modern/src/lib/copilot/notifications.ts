import type { CopilotUserContext } from "@/lib/copilot/user-context";

export type ProactiveAlert = {
  id: string;
  type: "bid" | "wallet" | "load" | "pod" | "general";
  title: string;
  message: string;
  action?: string;
  href?: string;
  priority: "high" | "medium" | "low";
};

export function buildProactiveAlerts(ctx: CopilotUserContext | null): ProactiveAlert[] {
  if (!ctx) return [];
  const alerts: ProactiveAlert[] = [];

  const pendingBids = ctx.bids.filter((b) => b.status === "pending");
  if (pendingBids.length > 0) {
    alerts.push({
      id: "pending-bids",
      type: "bid",
      title: `${pendingBids.length} pending bid${pendingBids.length > 1 ? "s" : ""}`,
      message: `You have bids awaiting response — review to avoid missing good carriers.`,
      action: "Show my pending bids",
      href: ctx.role === "supplier" ? "/supplier/my-bids" : "/carrier/my-bids",
      priority: "high",
    });
  }

  if (ctx.wallet && ctx.wallet.available >= 100) {
    alerts.push({
      id: "wallet-ready",
      type: "wallet",
      title: "Payout available",
      message: `£${ctx.wallet.available.toFixed(2)} ready to withdraw from your wallet.`,
      action: "How do I withdraw?",
      href: "/carrier/wallet",
      priority: "medium",
    });
  }

  if (ctx.role === "carrier" && ctx.availableLoads.length > 0) {
    const top = ctx.availableLoads[0];
    alerts.push({
      id: "new-loads",
      type: "load",
      title: `${ctx.availableLoads.length} loads available`,
      message: `Top load: ${top.route} at £${top.price.toFixed(0)} — ask me to rank the best options.`,
      action: "Show highest paying loads",
      href: "/carrier/find-loads",
      priority: "medium",
    });
  }

  const inTransit = ctx.myLoads.filter((l) => l.status === "in-transit");
  if (inTransit.length > 0) {
    alerts.push({
      id: "in-transit",
      type: "pod",
      title: `${inTransit.length} load${inTransit.length > 1 ? "s" : ""} in transit`,
      message: "Remember to upload POD after delivery for faster payout.",
      action: "How do I upload POD?",
      priority: "low",
    });
  }

  return alerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}
