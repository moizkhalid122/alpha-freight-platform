import type { StructuredAssistantReply } from "@/lib/chat-types";

const SUPPORT_EMAIL = "support@alphafreightuk.com";
const SUPPORT_PHONE = "+44 7782 294718";
const WHATSAPP = "https://wa.me/447782294718";

export function buildHandoffReply(displayName?: string): StructuredAssistantReply {
  const name = displayName ? ` ${displayName}` : "";
  return {
    mode: "logistics_copilot",
    displayStyle: "card",
    assistantName: "Alpha Freight Support",
    modeLabel: "Human Support",
    knowledgeSource: "handoff",
    confidence: 100,
    title: "🤝 Connecting you to our team",
    shortExplanation: `Hi${name}! I'll connect you with a real Alpha Freight support agent who can help with account issues, disputes, or complex requests.`,
    keyPoints: [
      `📧 Email: ${SUPPORT_EMAIL} (reply within 24 hours)`,
      `📞 Phone: ${SUPPORT_PHONE} (Mon–Fri 9am–6pm UK)`,
      `💬 WhatsApp: Tap below for instant chat`,
      "🔒 Have your load ID or account email ready for faster help",
    ],
    recommendation: "For urgent in-transit issues, call directly — fastest response.",
    nextStep: "Choose WhatsApp for quick chat or email for detailed support.",
    quickActions: [
      { label: "WhatsApp Support", href: WHATSAPP, action: "Open WhatsApp support", variant: "primary" },
      { label: "Email Support", href: `mailto:${SUPPORT_EMAIL}`, action: "Send email", variant: "secondary" },
      { label: "Call Now", href: `tel:${SUPPORT_PHONE.replace(/\s/g, "")}`, action: "Call support", variant: "ghost" },
    ],
    actionRequest: { type: "human_handoff", status: "ready", successMessage: "Support options shown" },
    suggestedQuestions: ["What info should I have ready?", "How long until someone replies?"],
    rawText: `Contact Alpha Freight support: ${SUPPORT_EMAIL} · ${SUPPORT_PHONE}`,
  };
}

export async function logHandoffRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string | null,
  message: string,
  assistantType: string
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from("ai_handoff_requests").insert({
      user_id: userId,
      message: message.slice(0, 500),
      assistant_type: assistantType,
      status: "pending",
    });
  } catch {
    // Table may not exist yet — non-blocking
  }
}
