import type { ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";
import { buildConciergeAgentTools } from "@/lib/concierge/concierge-agent";
import { enrichPublicAiReply } from "@/lib/public-ai-growth";

export function enrichConciergeReply(
  reply: StructuredAssistantReply,
  message: string,
  options: {
    history?: ChatHistoryItem[];
    detectedIntent?: DetectedIntent;
    pagePath?: string;
    escalated?: boolean;
  } = {},
): StructuredAssistantReply {
  let enriched = enrichPublicAiReply(reply, message);
  const agentTools = buildConciergeAgentTools({
    message,
    reply: enriched.shortExplanation || enriched.rawText || "",
    history: options.history,
    detectedIntent: options.detectedIntent,
    pagePath: options.pagePath,
  });

  if (agentTools.length) {
    enriched = {
      ...enriched,
      agentTools,
      knowledgeSource: enriched.knowledgeSource || "concierge+agent",
    };
  }

  if (options.escalated) {
    enriched = {
      ...enriched,
      knowledgeSource: `${enriched.knowledgeSource || "concierge"}+agent`,
    };
  }

  return enriched;
}
