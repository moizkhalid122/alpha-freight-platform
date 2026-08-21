import type { SupplierLoadAdvisory, SupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";
import { buildObservationPromptBlock } from "@/lib/copilot/page-observer";
import { resolveOpenAiModel } from "@/lib/openai-model-router";
import { isOpenAiConfigured } from "@/lib/openai-config";
import {
  detectBrowserLanguage,
  detectLanguage,
  getLanguageInstruction,
  type LanguagePreference,
} from "@/lib/copilot/language";
import {
  dedupeObservationLines,
  getInstantPostLoadCopilotReply,
  type PostLoadCopilotReply,
  type PostLoadCopilotTrigger,
} from "@/lib/copilot/post-load-copilot-instant";

export type { PostLoadCopilotReply, PostLoadCopilotTrigger } from "@/lib/copilot/post-load-copilot-instant";
export { getInstantPostLoadCopilotReply } from "@/lib/copilot/post-load-copilot-instant";

export async function getPostLoadCopilotReply(options: {
  draft: SupplierLoadDraft;
  currentStep: number;
  trigger: PostLoadCopilotTrigger;
  advisory?: SupplierLoadAdvisory | null;
  returningAfterDismiss?: boolean;
  agreementAccepted?: boolean;
  idleMs?: number;
  language?: LanguagePreference;
  userMessage?: string;
}): Promise<PostLoadCopilotReply & { observation: ReturnType<typeof getInstantPostLoadCopilotReply>["observation"] }> {
  const instant = getInstantPostLoadCopilotReply(options);
  const language =
    options.language ||
    (options.userMessage ? detectLanguage(options.userMessage) : detectBrowserLanguage());

  if (!isOpenAiConfigured()) {
    return instant;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return instant;

  const observation = instant.observation;
  const fallback = instant;
  const model = resolveOpenAiModel({ aiTier: "member" });
  const observationBlock = buildObservationPromptBlock(observation);

  const systemPrompt = `You are Supplier Co-Pilot on Alpha Freight UK — observing a supplier on the Post Load page in real time.
${getLanguageInstruction(language)}
Watch their step, missing fields, cargo, equipment, dates, budget, and readiness.
Never mention you are an AI model.

Return JSON only:
{
  "greeting": "short headline",
  "message": "2-3 sentences — holistic guidance for their current step",
  "observations": ["bullet 1", "bullet 2", "bullet 3"],
  "ctaLabel": "max 4 words",
  "secondaryLabel": "Not now",
  "nextStepHint": "one clear next action"
}`;

  const userPrompt = `Trigger: ${options.trigger}
Returning after dismiss: ${options.returningAfterDismiss ? "yes" : "no"}

${observationBlock}

Advisory summary: ${options.advisory?.summary || "none"}
Suggested price (if route known): ${options.advisory?.suggestedPrice || "n/a"}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        max_tokens: 180,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { ...fallback, observation };

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return { ...fallback, observation };

    const parsed = JSON.parse(raw) as Partial<PostLoadCopilotReply & { observations?: string[] }>;
    const greeting = String(parsed.greeting || fallback.greeting).trim();
    const message = String(parsed.message || fallback.message).trim();
    const ctaLabel = String(parsed.ctaLabel || fallback.ctaLabel).trim();
    const observations = dedupeObservationLines(
      (Array.isArray(parsed.observations) ? parsed.observations : [])
        .map((item) => String(item).trim())
        .filter(Boolean)
    );

    if (!greeting || !message) return { ...fallback, observation };

    return {
      greeting,
      message,
      observations: observations.length
        ? observations
        : dedupeObservationLines(fallback.observations),
      ctaLabel,
      secondaryLabel: String(parsed.secondaryLabel || "Not now").trim(),
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: String(parsed.nextStepHint || fallback.nextStepHint || "").trim(),
      source: "openai",
      observation,
    };
  } catch {
    return { ...fallback, observation };
  }
}
