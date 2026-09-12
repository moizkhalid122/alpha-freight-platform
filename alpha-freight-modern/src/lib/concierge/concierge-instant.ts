import type { ChatHistoryItem } from "@/lib/chat-types";
import { buildConciergeAgentTools } from "@/lib/concierge/concierge-agent";
import {
  resolveExplicitPageRequest,
  resolveExplicitSignupRole,
} from "@/lib/concierge/concierge-tool-guard";

export function getConciergeInstantTurn(
  message: string,
  history: ChatHistoryItem[] = [],
): { message: string; agentTools: ReturnType<typeof buildConciergeAgentTools> } | null {
  const agentTools = buildConciergeAgentTools({ message, reply: "", history });
  const actionable = agentTools.some((t) => t.type === "navigate" || t.type === "fill_field");
  if (!actionable) return null;

  const lower = message.toLowerCase();
  const explicit = resolveExplicitPageRequest(message);

  if (explicit) {
    return {
      message: `Got it — opening ${explicit.title} for you now.`,
      agentTools,
    };
  }

  const signupRole = resolveExplicitSignupRole(message, history);
  if (signupRole === "carrier") {
    const hasFields = agentTools.some((t) => t.type === "fill_field");
    return {
      message: hasFields
        ? "Right — got your details. Opening carrier signup now; you'll just add a password on the form."
        : "Hmm, okay — carrier signup takes about a minute. Opening it for you now.",
      agentTools,
    };
  }

  if (signupRole === "supplier") {
    const hasFields = agentTools.some((t) => t.type === "fill_field");
    return {
      message: hasFields
        ? "Lovely — I've got your details. Opening supplier signup now; password stays private on the form."
        : "Ah okay — I'll open supplier signup for you. Posting loads is straightforward once you're in.",
      agentTools,
    };
  }

  if (/\b(find load|find loads|available load|loads near|search load)\b/i.test(lower)) {
    return {
      message: "Let me pull up available loads for you — opening that now.",
      agentTools,
    };
  }

  return {
    message: "On it — opening that page for you now.",
    agentTools,
  };
}
