import type { ChatApiResponse } from "@/lib/chat-types";

const SUPPORT_EMAIL = "support@alphafreightuk.com";
const SUPPORT_PHONE = "+44 7782 294718";

type ChatHistoryItem = { role: string; content: string };

function includesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function greetingReply(): string {
  return "Hi! I'm Alpha Freight AI. I can help with posting loads, finding freight, carrier payouts, live tracking, vetting, and account questions. What would you like to know?";
}

function postLoadReply(): string {
  return `To post a load as a supplier:

1. Sign in and open **Post a Load**
2. Enter pickup & delivery, timing, cargo, equipment, and budget
3. Choose **Pay Instant** or **Pay Later**
4. Publish — AI matching typically finds carriers in under 60 seconds

Need hands-on help? Email ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE} (Mon–Fri, 8am–6pm GMT).`;
}

function payoutReply(): string {
  return `Carrier payouts on Alpha Freight:

• After **digital POD** is verified, funds move to your **Wallet**
• Standard payout window: **7 days**
• Track balances and withdrawals in **Wallet → Earnings**

For payout delays or wallet setup issues, email ${SUPPORT_EMAIL} with your load reference.`;
}

function trackingReply(): string {
  return `Live tracking on Alpha Freight:

• Carriers share GPS during **in-transit** deliveries
• Suppliers see real-time location on the shipment map
• Tracking stops when the delivery ends

If tracking isn't updating, check the load is marked in-transit and location permissions are enabled on the mobile app.`;
}

function findLoadsReply(): string {
  return `Carriers can find loads via:

• **Available Loads** — browse active marketplace freight
• **Smart Loads** — AI-recommended lanes matched to your fleet
• Submit a bid or accept at the posted rate

Tip: keep your fleet profile and operating regions updated for better matches.`;
}

function aboutReply(): string {
  return `Alpha Freight is a UK logistics platform connecting suppliers with verified carriers through AI load matching, live GPS tracking, and digital POD.

Company: ALPHA FREIGHT SOLUTIONS LIMITED (No. 16860760)
Office: 124 City Road, London EC1V 2NX
Support: ${SUPPORT_EMAIL} · ${SUPPORT_PHONE}`;
}

function supportReply(): string {
  return `Alpha Freight support channels:

• **Live chat** — fastest for active shipment questions
• **Email** — ${SUPPORT_EMAIL} (within ~2 hours)
• **Phone** — ${SUPPORT_PHONE} (Mon–Fri, 8am–6pm GMT)

For urgent live shipments, include your load reference and current status.`;
}

function humanReply(): string {
  return `I'll connect you with our team. Email ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE}. Include your name, account email, and a short description of the issue — we'll respond within 2 hours on business days.`;
}

export function getMarketingChatReply(
  message: string,
  history: ChatHistoryItem[] = []
): ChatApiResponse {
  const text = message.toLowerCase().trim();

  if (
    includesAny(text, ["hi", "hello", "hey", "salam", "assalam", "aslam", "good morning", "good afternoon"])
  ) {
    return { message: greetingReply() };
  }

  if (includesAny(text, ["human", "agent", "person", "talk to", "email support", "real person"])) {
    return { message: humanReply() };
  }

  if (
    includesAny(text, [
      "post a load",
      "post load",
      "how do i post",
      "create load",
      "publish load",
      "supplier post",
    ])
  ) {
    return { message: postLoadReply() };
  }

  if (
    includesAny(text, [
      "payout",
      "pay out",
      "wallet",
      "earnings",
      "get paid",
      "payment carrier",
      "7 day",
      "7-day",
    ])
  ) {
    return { message: payoutReply() };
  }

  if (
    includesAny(text, [
      "track",
      "tracking",
      "gps",
      "live location",
      "shipment map",
      "where is my",
    ])
  ) {
    return { message: trackingReply() };
  }

  if (
    includesAny(text, [
      "find load",
      "available load",
      "smart load",
      "bid",
      "book load",
      "carrier load",
    ])
  ) {
    return { message: findLoadsReply() };
  }

  if (
    includesAny(text, [
      "what is alpha",
      "who are you",
      "about alpha",
      "company",
      "platform",
    ])
  ) {
    return { message: aboutReply() };
  }

  if (includesAny(text, ["support", "help", "contact", "phone", "complaint"])) {
    return { message: supportReply() };
  }

  if (includesAny(text, ["pod", "proof of delivery", "delivery confirmation"])) {
    return {
      message:
        "Carriers upload **digital POD** via the app or web after delivery. Once verified, settlement and payout workflows start automatically. Suppliers can review POD in their load dashboard.",
    };
  }

  if (includesAny(text, ["vet", "verify", "insurance", "compliance"])) {
    return {
      message:
        "Every carrier passes a 5-step vetting flow: identity & registration, insurance verification, safety/compliance checks, equipment review, and performance assessment. This keeps the Alpha network trusted for suppliers.",
    };
  }

  if (includesAny(text, ["thank", "thanks", "shukriya"])) {
    return {
      message: "You're welcome! If you need anything else about Alpha Freight, just ask.",
    };
  }

  const lastTopic = history
    .slice()
    .reverse()
    .find((item) => item.role === "assistant")?.content;

  if (text.length <= 20 && lastTopic) {
    return {
      message: `Happy to help with more detail on that. Could you tell me if you're a **supplier** or **carrier**, and what step you're stuck on? You can also email ${SUPPORT_EMAIL} for direct support.`,
    };
  }

  return {
    message: `I can help with posting loads, finding freight, payouts, live tracking, POD, and account questions.

Try asking something like:
• "How do I post a load?"
• "How do carrier payouts work?"
• "Help with live tracking"

Or email ${SUPPORT_EMAIL} for human support.`,
  };
}
