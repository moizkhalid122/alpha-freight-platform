import type { ChatHistoryItem } from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";

const AGENT_ESCALATION_PATTERN =
  /\b(step by step|help me apply|profit|margin|rpm|strategy|compare|versus|explain in detail|samjha|detail men|zayada detail|complex|multi.?step|calculate|calculator|bid strategy|negotiat)\b/i;

export function shouldEscalateConciergeToAgent(
  message: string,
  detected: DetectedIntent,
  history: ChatHistoryItem[] = [],
): boolean {
  if (detected.actionRequest) return true;
  if (detected.platformIntent) return true;
  if (detected.needsHandoff) return true;
  if (detected.needsProfitCalc) return true;

  const trimmed = message.trim();
  if (trimmed.length > 140) return true;
  if (AGENT_ESCALATION_PATTERN.test(trimmed)) return true;

  const recentUser = history
    .filter((h) => h.role === "user")
    .slice(-3)
    .map((h) => h.content)
    .join(" ");
  if (AGENT_ESCALATION_PATTERN.test(recentUser)) return true;

  return false;
}
