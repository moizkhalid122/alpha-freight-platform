import type { SupplierLoadAdvisory, SupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";
import { analyzeSupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";
import { observeSupplierPostLoadPage, type PageObservation } from "@/lib/copilot/page-observer";
import {
  detectBrowserLanguage,
  detectLanguage,
  type LanguagePreference,
} from "@/lib/copilot/language";

export type PostLoadCopilotTrigger =
  | "idle"
  | "validation_error"
  | "missing_route"
  | "missing_budget"
  | "step_incomplete"
  | "equipment_mismatch"
  | "return_after_dismiss"
  | "manual";

export type PostLoadCopilotReply = {
  greeting: string;
  message: string;
  observations: string[];
  ctaLabel: string;
  secondaryLabel?: string;
  suggestedFixes?: Partial<SupplierLoadDraft>;
  nextStepHint?: string;
  source: "openai" | "local";
};

export function dedupeObservationLines(items: string[], limit = 4): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = String(item || "").trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
    if (result.length >= limit) break;
  }

  return result;
}

function buildLocalReply(options: {
  draft: SupplierLoadDraft;
  currentStep: number;
  trigger: PostLoadCopilotTrigger;
  observation: PageObservation;
  advisory?: SupplierLoadAdvisory | null;
  returningAfterDismiss?: boolean;
  language?: LanguagePreference;
}): PostLoadCopilotReply {
  const { observation, advisory, returningAfterDismiss, trigger, language = "english" } = options;

  if (language === "finnish") {
    return buildFinnishLocalReply(options);
  }

  const observations = dedupeObservationLines([
    ...observation.priorityActions.slice(0, 2),
    ...observation.missingItems.slice(0, 2),
    ...observation.warnings.slice(0, 2),
    ...observation.tips.slice(0, 1),
  ]);

  const topAction = observation.priorityActions[0] || observation.missingItems[0] || "Complete this step";
  const stepHint =
    options.currentStep < 4
      ? `Next: finish ${observation.stepLabel}, then continue to step ${options.currentStep + 1}.`
      : "Next: confirm load price and publish your load.";

  if (returningAfterDismiss || trigger === "return_after_dismiss") {
    return {
      greeting: "Still here if you need me.",
      message: `I noticed you're on ${observation.stepLabel}. ${topAction}. I can also apply fixes or suggest pricing when your route is ready.`,
      observations: observations.length
        ? observations
        : ["Tell me if you want help with route, cargo, vehicle, or load price."],
      ctaLabel: Object.keys(observation.suggestedFixes).length ? "Apply fixes" : "Guide me",
      secondaryLabel: "Not now",
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: stepHint,
      source: "local",
    };
  }

  if (trigger === "equipment_mismatch") {
    return {
      greeting: "Equipment needs attention.",
      message:
        "Your vehicle selection doesn't match the cargo requirements. I can switch equipment and keep your other details intact.",
      observations: observation.warnings.length ? observation.warnings.slice(0, 3) : observations,
      ctaLabel: "Fix equipment",
      secondaryLabel: "I'll change it",
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: stepHint,
      source: "local",
    };
  }

  if (trigger === "step_incomplete") {
    return {
      greeting: `Step ${options.currentStep}: ${observation.stepLabel}`,
      message: `You paused on this step. Here's what still matters before carriers can bid accurately.`,
      observations: observations.length ? observations : observation.missingItems.slice(0, 3),
      ctaLabel: Object.keys(observation.suggestedFixes).length ? "Fix & continue" : "Next step",
      secondaryLabel: "Not now",
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: stepHint,
      source: "local",
    };
  }

  if (trigger === "validation_error") {
    return {
      greeting: "I spotted issues to fix.",
      message: "These items could block posting or reduce carrier interest. I can correct them in one click.",
      observations: observation.warnings.length ? observation.warnings.slice(0, 4) : observations,
      ctaLabel: "Fix for me",
      secondaryLabel: "I'll do it myself",
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: stepHint,
      source: "local",
    };
  }

  if (trigger === "missing_budget" && advisory?.suggestedPrice) {
    return {
      greeting: "Load price not set yet.",
      message: `Carriers need the exact transport amount. For this lane, similar loads are posting around £${advisory.suggestedPrice.toLocaleString("en-GB")}.`,
      observations: dedupeObservationLines([
        ...observation.tips.slice(0, 2),
        `Suggested range: £${advisory.priceLow.toLocaleString("en-GB")}–£${advisory.priceHigh.toLocaleString("en-GB")}`,
      ]),
      ctaLabel: "Apply suggested price",
      secondaryLabel: "Not now",
      suggestedFixes: { load_price: String(advisory.suggestedPrice), ...observation.suggestedFixes },
      nextStepHint: "Then accept terms and continue to payment.",
      source: "local",
    };
  }

  if (trigger === "missing_route") {
    return {
      greeting: "Start with your route.",
      message:
        "Pickup and delivery unlock pricing, distance, equipment advice, and carrier matching — not just the rate.",
      observations: observation.missingItems.slice(0, 3),
      ctaLabel: "Got it",
      secondaryLabel: "Not now",
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: "Add cities, then pickup date and time.",
      source: "local",
    };
  }

  return {
    greeting: "Need a hand?",
    message: `On ${observation.stepLabel}, focus on what carriers need to quote accurately — not only price.`,
    observations: observations.length ? observations : observation.tips.slice(0, 3),
    ctaLabel: Object.keys(observation.suggestedFixes).length ? "Apply fixes" : "Help me finish",
    secondaryLabel: "Not now",
    suggestedFixes: observation.suggestedFixes,
    nextStepHint: stepHint,
    source: "local",
  };
}

function buildFinnishLocalReply(options: {
  currentStep: number;
  trigger: PostLoadCopilotTrigger;
  observation: PageObservation;
  advisory?: SupplierLoadAdvisory | null;
  returningAfterDismiss?: boolean;
}): PostLoadCopilotReply {
  const { observation, advisory, returningAfterDismiss, trigger } = options;
  const observations =
    observation.priorityActions.length > 0
      ? observation.priorityActions.slice(0, 3)
      : observation.missingItems.slice(0, 3);
  const stepHint =
    options.currentStep < 4
      ? `Seuraavaksi: viimeistele ${observation.stepLabel} ja siirry vaiheeseen ${options.currentStep + 1}.`
      : "Seuraavaksi: vahvista budjetti ja julkaise kuorma.";

  if (returningAfterDismiss || trigger === "return_after_dismiss") {
    return {
      greeting: "Olen täällä auttamassa.",
      message: `Huomasin, että olet vaiheessa ${observation.stepLabel}. Voin ehdottaa hintaa, korjata tietoja tai auttaa julkaisussa.`,
      observations: observations.length ? observations : ["Kysy rohkeasti reitistä, kuormasta, ajoneuvosta tai budjetista."],
      ctaLabel: Object.keys(observation.suggestedFixes).length ? "Korjaa puolestani" : "Auta minua",
      secondaryLabel: "Ei nyt",
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: stepHint,
      source: "local",
    };
  }

  if (trigger === "missing_budget" && advisory?.suggestedPrice) {
    return {
      greeting: "Budjettia ei ole vielä asetettu.",
      message: `Kuljettajat tarvitsevat tavoitehintaa. Tälle reitille tyypillinen hinta on noin £${advisory.suggestedPrice.toLocaleString("en-GB")}.`,
      observations: [
        `Ehdotus: £${advisory.priceLow.toLocaleString("en-GB")}–£${advisory.priceHigh.toLocaleString("en-GB")}`,
        "Aseta max-budjetti, jotta tarjoukset tulevat nopeammin.",
      ],
      ctaLabel: "Käytä ehdotusta",
      secondaryLabel: "Ei nyt",
      suggestedFixes: observation.suggestedFixes,
      nextStepHint: "Hyväksy ehdot ja valitse maksutapa.",
      source: "local",
    };
  }

  return {
    greeting: "Tarvitsetko apua?",
    message: `Vaiheessa ${observation.stepLabel} tärkeintä on antaa kuljettajille oikeat tiedot — ei vain hinta.`,
    observations: observations.length ? observations : observation.tips.slice(0, 3),
    ctaLabel: Object.keys(observation.suggestedFixes).length ? "Korjaa tiedot" : "Auta minua",
    secondaryLabel: "Ei nyt",
    suggestedFixes: observation.suggestedFixes,
    nextStepHint: stepHint,
    source: "local",
  };
}

export function getInstantPostLoadCopilotReply(options: {
  draft: SupplierLoadDraft;
  currentStep: number;
  trigger: PostLoadCopilotTrigger;
  advisory?: SupplierLoadAdvisory | null;
  returningAfterDismiss?: boolean;
  agreementAccepted?: boolean;
  idleMs?: number;
  currency?: string;
  language?: LanguagePreference;
  userMessage?: string;
}): PostLoadCopilotReply & { observation: PageObservation } {
  const language =
    options.language ||
    (options.userMessage ? detectLanguage(options.userMessage) : detectBrowserLanguage());
  const advisory =
    options.advisory ?? analyzeSupplierLoadDraft(options.draft, [], options.currency || "GBP");

  const observation = observeSupplierPostLoadPage({
    draft: options.draft,
    currentStep: options.currentStep,
    advisory,
    agreementAccepted: options.agreementAccepted,
    idleMs: options.idleMs,
  });

  return {
    ...buildLocalReply({
      ...options,
      advisory,
      observation,
      language,
    }),
    observation,
  };
}
