const LOADS_PROMPT = /load|freight|route|bid|haul|delivery|pickup/i;
const WALLET_PROMPT = /wallet|payout|earn|withdraw|payment|money|spend|invoice|checkout/i;
const BIDS_PROMPT = /bid|offer|marketplace|carrier/i;
const STATUS_PROMPT = /status|transit|deliver|pod|my load|my post|track/i;
const POST_LOAD_PROMPT = /post load|create load|publish|ship freight|new shipment/i;

export type AiQuickAction = {
  id: string;
  label: string;
  route?: string;
};

export type AiAssistantRole = "carrier" | "supplier";

export type AiAssistantReply = {
  title: string;
  sectionLabel?: string;
  bullets: string[];
  footer?: string;
  actions?: AiQuickAction[];
};

function buildSupplierReply(input: string): AiAssistantReply {
  const text = input.trim();

  if (POST_LOAD_PROMPT.test(text)) {
    return {
      title: "Posting loads on Alpha Freight",
      sectionLabel: "Supplier workflow:",
      bullets: [
        "Open Post Load and enter route, cargo, vehicle, and pickup window.",
        "Review the market estimate, set your budget, then accept terms.",
        "Pay now to publish instantly, or Pay later and complete from My Posts.",
      ],
      footer: "Try: “Help me post Birmingham to London, 1200kg steel, urgent.”",
    };
  }

  if (BIDS_PROMPT.test(text) && !WALLET_PROMPT.test(text)) {
    return {
      title: "Managing carrier bids",
      sectionLabel: "Best practice:",
      bullets: [
        "Review bids on My Posts or Bids — compare price and equipment fit.",
        "Accept the carrier that matches your timeline and service needs.",
        "Mark in transit once freight is collected, then review POD on delivery.",
      ],
    };
  }

  if (WALLET_PROMPT.test(text)) {
    return {
      title: "Supplier payments explained",
      sectionLabel: "Payment options:",
      bullets: [
        "Pay now — secure card checkout, load goes live immediately.",
        "Pay later — load is saved pending; pay within 7 days from My Posts.",
        "All payments are handled via Stripe — Alpha Freight does not store card details.",
      ],
    };
  }

  if (STATUS_PROMPT.test(text)) {
    return {
      title: "Tracking your shipments",
      sectionLabel: "Load lifecycle:",
      bullets: [
        "Pending payment → Active (live) → Booked → In transit → Delivered.",
        "Approve POD when the carrier uploads proof of delivery.",
        "Use My Posts filters to find active, booked, or POD review loads.",
      ],
    };
  }

  if (LOADS_PROMPT.test(text)) {
    return {
      title: "Your posted loads",
      sectionLabel: "Quick actions:",
      bullets: [
        "My Posts shows every shipment with status and payment state.",
        "Loads awaiting payment show a Complete payment action.",
        "Booked + paid loads can be marked in transit from the app.",
      ],
    };
  }

  return {
    title: "Alpha Freight Supplier Co-Pilot",
    sectionLabel: "I can help with:",
    bullets: [
      "Posting new loads and pricing guidance",
      "Reviewing carrier bids and load status",
      "Payments — pay now, pay later, pending invoices",
      "POD review and shipment tracking",
    ],
    footer: "Try: “Show my active loads” or “How do I pay for a pending load?”",
  };
}

function buildCarrierReply(input: string): AiAssistantReply {
  const text = input.trim();

  if (LOADS_PROMPT.test(text) && !BIDS_PROMPT.test(text)) {
    return {
      title: "Finding the right UK loads for your fleet",
      sectionLabel: "Marketplace recommendations:",
      bullets: [
        "Open Available Loads and filter by high pay or pickup soon.",
        "Check route distance and equipment match before placing a bid.",
        "Save loads you like so you can compare offers quickly.",
      ],
      footer: "Want live loads now? Head to Loads → open a shipment → Place bid.",
    };
  }

  if (BIDS_PROMPT.test(text)) {
    return {
      title: "Making your bids stand out to suppliers",
      sectionLabel: "Bid strategy:",
      bullets: [
        "Price competitively against the listed rate — not always the lowest.",
        "Track pending offers on My Bids and withdraw if plans change.",
        "Respond quickly when a supplier accepts; booked loads move fast.",
      ],
    };
  }

  if (WALLET_PROMPT.test(text)) {
    return {
      title: "Getting payouts set up correctly",
      sectionLabel: "Wallet checklist:",
      bullets: [
        "Complete payout setup in Wallet before your first withdrawal.",
        "Verified carriers typically receive funds in 1–2 business days.",
        "Use your load reference (AF-XXXX) when contacting support.",
      ],
    };
  }

  if (STATUS_PROMPT.test(text)) {
    return {
      title: "Updating load status without delays",
      sectionLabel: "Status flow:",
      bullets: [
        "Booked → confirm pickup when freight is collected.",
        "In transit → share accurate ETAs with the broker if asked.",
        "Delivered → mark complete only after proof of delivery.",
      ],
    };
  }

  return {
    title: "Here to help with your carrier operations",
    sectionLabel: "You can ask me about:",
    bullets: [
      "Finding and bidding on UK freight loads",
      "Wallet, payouts, and verification",
      "Load status updates and delivery workflow",
      "Support contacts and account settings",
    ],
    footer: "Try: “Show me high-pay loads near Manchester” or “How do I withdraw earnings?”",
  };
}

export function buildAiAssistantReply(
  input: string,
  role: AiAssistantRole = "carrier"
): AiAssistantReply {
  return role === "supplier" ? buildSupplierReply(input) : buildCarrierReply(input);
}
