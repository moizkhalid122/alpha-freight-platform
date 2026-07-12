import type { AiAssistantReply, AiQuickAction } from "@/lib/ai-assistant-responses";
import type { AiSupplierContext } from "@/lib/ai-supplier-context";
import { isPostLoadDescription, parsePostLoadLocally } from "@/lib/supplier-post-load-ai";
import { setSupplierPostLoadDraft } from "@/lib/supplier-post-load-draft";

function isMyPostsQuestion(text: string) {
  return /\b(my posts?|my loads?|posted loads?|active loads?|shipments?|track load)\b/i.test(text);
}

function isBidsQuestion(text: string) {
  return /\b(bids?|carrier offers?|offers received|accept bid|view bids?)\b/i.test(text);
}

function isBidCompareQuestion(text: string) {
  return /\b(compare|best bid|lowest|cheapest|which bid|kaun sa bid)\b/i.test(text);
}

function isPaymentQuestion(text: string) {
  return /\b(pay(ment)?|pay later|pay now|pending payment|invoice|checkout)\b/i.test(text);
}

function isPostLoadQuestion(text: string) {
  return /\b(post load|create load|new load|publish load|ship freight|book carrier)\b/i.test(text);
}

function isPodQuestion(text: string) {
  return /\b(pod|proof of delivery|delivery proof|approve pod)\b/i.test(text);
}

function isDashboardQuestion(text: string) {
  return /\b(dashboard|overview|summary|stats?|spend|how am i doing)\b/i.test(text);
}

function withActions(reply: AiAssistantReply, actions: AiQuickAction[]): AiAssistantReply {
  return { ...reply, actions };
}

export function enrichSupplierReplyWithActions(
  reply: AiAssistantReply,
  message: string,
  context: AiSupplierContext | null
): AiAssistantReply {
  const actions: AiQuickAction[] = [];

  if (isPostLoadQuestion(message) || isPostLoadDescription(message)) {
    const parsed = parsePostLoadLocally(message);
    if (parsed.draft.origin || parsed.draft.destination) {
      setSupplierPostLoadDraft(parsed.draft);
    }
    actions.push({ id: "post-load", label: "Open Post Load", route: "/post-load" });
  }

  if (isMyPostsQuestion(message) || isPaymentQuestion(message) || isPodQuestion(message)) {
    actions.push({ id: "posts", label: "My Posts", route: "/(supplier-main)/posts" });
  }

  if (isBidsQuestion(message) || isBidCompareQuestion(message)) {
    actions.push({ id: "bids", label: "View Bids", route: "/(supplier-main)/bids" });
  }

  if (isPostLoadQuestion(message) && !actions.some((action) => action.id === "post-load")) {
    actions.push({ id: "post-load", label: "Post Load", route: "/post-load" });
  }

  if (context?.stats.pendingPayments && context.stats.pendingPayments > 0 && isPaymentQuestion(message)) {
    actions.unshift({ id: "posts-pay", label: "Complete payment", route: "/(supplier-main)/posts" });
  }

  if (!actions.length) return reply;
  return withActions(reply, actions.slice(0, 3));
}

export function tryBuildSupplierLocalReply(
  message: string,
  context: AiSupplierContext | null
): AiAssistantReply | null {
  if (!context) return null;

  const text = message.trim();
  const name = context.supplierName.split(" ")[0] || "there";

  if (isBidCompareQuestion(text) && context.bids.pending.length > 0) {
    const sorted = [...context.bids.pending].sort((a, b) => a.amount - b.amount);
    const best = sorted[0];
    const lines = sorted.slice(0, 4).map((bid, index) => {
      const marker = index === 0 ? "Best value · " : "";
      return `${marker}${bid.carrierName} · ${bid.amountLabel} on ${bid.loadRoute} (budget ${bid.loadBudget})`;
    });

    return enrichSupplierReplyWithActions(
      {
        title: `Hi ${name}, bid comparison ready`,
        sectionLabel: `${context.bids.totalPending} pending bid(s) ranked by price:`,
        bullets: lines,
        footer: best
          ? `Lowest offer: ${best.carrierName} at ${best.amountLabel}. Review equipment fit before accepting.`
          : "Open Bids to accept or reject offers.",
      },
      text,
      context
    );
  }

  if (isMyPostsQuestion(text)) {
    const lines =
      context.posts.length > 0
        ? context.posts.slice(0, 5).map(
            (post) =>
              `${post.code} · ${post.route} · ${post.status} · ${post.price}${post.paymentLabel !== "—" ? ` · ${post.paymentLabel}` : ""}`
          )
        : ["You have no posted loads yet. Use Post Load to publish your first shipment."];

    return enrichSupplierReplyWithActions(
      {
        title: `Hi ${name}, here are your latest posted loads`,
        sectionLabel: `${context.stats.activeLoads} active · ${context.stats.totalLoads} total:`,
        bullets: lines,
        footer: "Open My Posts for full tracking, in-transit updates, and payment actions.",
      },
      text,
      context
    );
  }

  if (isBidsQuestion(text)) {
    const bidLines =
      context.bids.pending.length > 0
        ? context.bids.pending.slice(0, 4).map(
            (bid) => `${bid.carrierName} · ${bid.amountLabel} · ${bid.loadRoute} · ${bid.statusLabel}`
          )
        : [
            `${context.stats.pendingBids} pending bid(s) waiting for your review.`,
            "Compare carrier price, equipment fit, and response time before accepting.",
          ];

    return enrichSupplierReplyWithActions(
      {
        title: `Hi ${name}, carrier bids on your loads`,
        sectionLabel: "Bid overview:",
        bullets: bidLines,
        footer:
          context.stats.pendingBids > 0
            ? "Go to Bids to accept or reject carrier offers."
            : "Post a live load first — bids appear when carriers respond on the marketplace.",
      },
      text,
      context
    );
  }

  if (isPaymentQuestion(text)) {
    return enrichSupplierReplyWithActions(
      {
        title: "Supplier payment workflow",
        sectionLabel: "How payments work:",
        bullets: [
          `${context.stats.pendingPayments} load(s) currently awaiting payment on your account.`,
          "Pay now publishes instantly after secure card checkout.",
          "Pay later saves the load — complete payment from My Posts within 7 days.",
        ],
        footer: "Open My Posts → Complete payment on any pending load.",
      },
      text,
      context
    );
  }

  if (isPodQuestion(text)) {
    return enrichSupplierReplyWithActions(
      {
        title: "Proof of delivery review",
        sectionLabel: "POD status:",
        bullets: [
          `${context.stats.podReviewCount} load(s) need POD review before the job is fully closed.`,
          "Check the document, confirm delivery details, then approve or reject.",
          "Carriers cannot receive final payout until POD is approved where required.",
        ],
        footer: "Open My Posts and filter by POD review.",
      },
      text,
      context
    );
  }

  if (isPostLoadQuestion(text) || isPostLoadDescription(text)) {
    const parsed = parsePostLoadLocally(text);
    const bullets =
      parsed.confidence !== "low"
        ? [
            `Detected: ${parsed.summary}`,
            "I can pre-fill the Post Load wizard — review everything before publishing.",
            "Payment still requires your confirmation (Pay now or Pay later).",
          ]
        : [
            "Open Post Load → enter route, cargo, vehicle, and budget.",
            "Use the market estimate on the review step to price competitively.",
            "Choose Pay now to go live immediately, or Pay later to save and pay from My Posts.",
          ];

    if (parsed.draft.origin || parsed.draft.destination) {
      setSupplierPostLoadDraft(parsed.draft);
    }

    return enrichSupplierReplyWithActions(
      {
        title: parsed.confidence !== "low" ? "Load draft ready for review" : "Post a new load quickly",
        sectionLabel: "Fastest workflow:",
        bullets,
        footer:
          parsed.missingFields.length > 0
            ? `Still needed: ${parsed.missingFields.join(", ")}`
            : "Open Post Load to review and publish.",
      },
      text,
      context
    );
  }

  if (isDashboardQuestion(text)) {
    return enrichSupplierReplyWithActions(
      {
        title: `Hi ${name}, your supplier snapshot`,
        sectionLabel: "Account summary:",
        bullets: [
          `${context.stats.totalLoads} total loads · ${context.stats.activeLoads} active on marketplace.`,
          `${context.stats.pendingBids} pending bids · ${context.stats.pendingPayments} awaiting payment.`,
          `${context.stats.podReviewCount} POD review(s) · ${context.stats.totalSpend} total spend.`,
        ],
        footer: "Ask about my posts, bids, payments, or describe a new shipment.",
      },
      text,
      context
    );
  }

  return null;
}

export function buildSupplierPaymentReminder(context: AiSupplierContext | null): AiAssistantReply | null {
  if (!context?.stats.pendingPayments) return null;

  return {
    title: `${context.stats.pendingPayments} load(s) need payment`,
    sectionLabel: "Payment reminder:",
    bullets: [
      "Pending loads stay unpublished until payment is completed.",
      "Open My Posts and tap Complete payment on each pending load.",
      "Pay now goes live instantly; pay later saves the load for up to 7 days.",
    ],
    actions: [
      { id: "posts-pay", label: "Open My Posts", route: "/(supplier-main)/posts" },
      { id: "post-load", label: "Post new load", route: "/post-load" },
    ],
  };
}
