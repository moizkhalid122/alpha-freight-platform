const LOADS_PROMPT = /load|freight|route|bid|haul|delivery|pickup/i;
const WALLET_PROMPT = /wallet|payout|earn|withdraw|payment|money/i;
const BIDS_PROMPT = /bid|offer|marketplace|supplier/i;
const STATUS_PROMPT = /status|transit|deliver|pod|my load/i;

export type AiAssistantReply = {
  title: string;
  sectionLabel?: string;
  bullets: string[];
  footer?: string;
};

export function buildAiAssistantReply(input: string): AiAssistantReply {
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
