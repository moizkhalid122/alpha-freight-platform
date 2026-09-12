import type { ConciergeAgentTool } from "@/lib/chat-types";

export type ConciergeOnboardingField = {
  id: string;
  label: string;
  required?: boolean;
  filled?: boolean;
};

export type ConciergeOnboardingContext = {
  role: "carrier" | "supplier";
  stepIndex: number;
  totalSteps: number;
  stepId: string;
  stepType: "form" | "documents" | "choice";
  question: string;
  description: string;
  fields?: ConciergeOnboardingField[];
  options?: Array<{ label: string; value: string }>;
  nextTarget: string;
  nextHint: string;
  progressLabel: string;
};

export function resolveOnboardingNextTarget(context: ConciergeOnboardingContext): string {
  if (context.stepType === "form") {
    const emptyRequired = context.fields?.find((f) => f.required !== false && !f.filled);
    if (emptyRequired) return emptyRequired.id;
    return "next";
  }
  if (context.stepType === "documents") {
    const missingDoc = context.fields?.find((f) => f.required !== false && !f.filled);
    if (missingDoc) return missingDoc.id;
    return "next";
  }
  return `step_${context.stepId}`;
}

export function buildOnboardingNextHint(context: ConciergeOnboardingContext): string {
  if (context.stepType === "form") {
    const emptyRequired = context.fields?.find((f) => f.required !== false && !f.filled);
    if (emptyRequired) {
      return `Fill in "${emptyRequired.label}" then tap Continue.`;
    }
    return "Tap Continue to move to the next step.";
  }
  if (context.stepType === "documents") {
    const missingDoc = context.fields?.find((f) => f.required !== false && !f.filled);
    if (missingDoc) {
      return `Upload "${missingDoc.label}" then submit for review.`;
    }
    return "Tap Submit account for review when uploads are done.";
  }
  if (context.options?.length) {
    return `Choose one: ${context.options.map((o) => o.label).join(" or ")}.`;
  }
  return "Follow the options on screen.";
}

export function buildOnboardingContextPayload(input: {
  role: string;
  stepIndex: number;
  totalSteps: number;
  stepId: string;
  stepType: "form" | "documents" | "choice";
  question: string;
  description: string;
  fields?: ConciergeOnboardingField[];
  options?: Array<{ label: string; value: string }>;
}): ConciergeOnboardingContext {
  const role = input.role === "supplier" ? "supplier" : "carrier";
  const base: ConciergeOnboardingContext = {
    role,
    stepIndex: input.stepIndex,
    totalSteps: input.totalSteps,
    stepId: input.stepId,
    stepType: input.stepType,
    question: input.question,
    description: input.description,
    fields: input.fields,
    options: input.options,
    nextTarget: "next",
    nextHint: "",
    progressLabel: `Step ${input.stepIndex + 1} of ${input.totalSteps}`,
  };
  base.nextTarget = resolveOnboardingNextTarget(base);
  base.nextHint = buildOnboardingNextHint(base);
  return base;
}

export function formatOnboardingContextForPrompt(context?: ConciergeOnboardingContext | null): string {
  if (!context) return "";

  const fieldLines =
    context.fields?.map((f) => {
      const status = f.filled ? "filled" : f.required === false ? "optional" : "empty";
      return `- ${f.label} (${f.id}): ${status}`;
    }) ?? [];

  const optionLines = context.options?.map((o) => `- ${o.label} (${o.value})`) ?? [];

  return `ONBOARDING WIZARD (user is mid-setup — guide THIS step only):
- Role: ${context.role}
- ${context.progressLabel}: ${context.question}
- Purpose: ${context.description}
- Step type: ${context.stepType}
${fieldLines.length ? `Fields on this step:\n${fieldLines.join("\n")}` : ""}
${optionLines.length ? `Choices on this step:\n${optionLines.join("\n")}` : ""}
- NEXT for user: ${context.nextHint}
- When they say continue / next / proceed → call click_element with target "next".
- When they ask for help / what's next → call highlight_element with target "${context.nextTarget}".
- Explain only this step — do not skip ahead to later onboarding steps.
- Never send them back to signup unless they explicitly ask.`;
}

export function buildOnboardingInstantActions(
  message: string,
  context?: ConciergeOnboardingContext | null,
): ConciergeAgentTool[] {
  if (!context) return [];
  const lower = message.toLowerCase();

  if (/\b(next|continue|proceed|go ahead|submit|agla|aage|done)\b/i.test(lower)) {
    return [{ type: "click", target: context.nextTarget === "next" ? "next" : context.nextTarget }];
  }

  if (
    /\b(what'?s next|help|highlight|show me|where|kahan|step|field|button|upload)\b/i.test(
      lower,
    )
  ) {
    return [{ type: "highlight", target: context.nextTarget }];
  }

  for (const field of context.fields ?? []) {
    const label = field.label.toLowerCase();
    if (lower.includes(label) || lower.includes(field.id.replace(/_/g, " "))) {
      return [{ type: "highlight", target: field.id }];
    }
  }

  for (const option of context.options ?? []) {
    if (lower.includes(option.label.toLowerCase()) || lower.includes(option.value)) {
      return [{ type: "highlight", target: `step_${context.stepId}` }];
    }
  }

  return [];
}

export function buildOnboardingProactiveMessage(context?: ConciergeOnboardingContext | null): string | null {
  if (!context) return null;
  return `You're on ${context.progressLabel}: ${context.question}. ${context.nextHint}`;
}
