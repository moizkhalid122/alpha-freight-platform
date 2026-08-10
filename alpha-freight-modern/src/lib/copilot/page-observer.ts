import type { SupplierLoadAdvisory, SupplierLoadDraft } from "@/lib/copilot/supplier-load-advisor";
import { formatRouteLabel } from "@/lib/uk-postcode";

export type ObservedPageId =
  | "supplier_post_load"
  | "supplier_ai_assistant"
  | "carrier_ai_assistant"
  | "supplier_my_posts"
  | "carrier_available_loads";

export type PageObservation = {
  pageId: ObservedPageId;
  pageLabel: string;
  currentStep?: number;
  stepLabel?: string;
  readinessScore?: number;
  completedItems: string[];
  missingItems: string[];
  warnings: string[];
  tips: string[];
  priorityActions: string[];
  suggestedFixes: Partial<SupplierLoadDraft>;
  contextSummary: string;
};

const POST_LOAD_STEPS: Record<number, string> = {
  1: "Route & timing",
  2: "Cargo details",
  3: "Vehicle & requirements",
  4: "Review, budget & publish",
};

function hasText(value?: string | number | null) {
  return Boolean(String(value || "").trim());
}

export function observeSupplierPostLoadPage(options: {
  draft: SupplierLoadDraft;
  currentStep: number;
  advisory?: SupplierLoadAdvisory | null;
  agreementAccepted?: boolean;
  idleMs?: number;
}): PageObservation {
  const { draft, currentStep, advisory, agreementAccepted, idleMs = 0 } = options;
  const stepLabel = POST_LOAD_STEPS[currentStep] || "Post load";
  const completedItems: string[] = [];
  const missingItems: string[] = [];
  const warnings: string[] = [];
  const tips: string[] = [];
  const priorityActions: string[] = [];
  const suggestedFixes: Partial<SupplierLoadDraft> = {};

  if (hasText(draft.origin)) completedItems.push("Pickup location entered");
  else missingItems.push("Add pickup city or town");

  if (hasText(draft.pickup_postcode)) completedItems.push(`Pickup postcode: ${draft.pickup_postcode}`);
  else if (currentStep >= 1 && hasText(draft.origin)) {
    tips.push("Add pickup postcode (e.g. M1 1AE) for sharper UK lane matching and rates.");
  }

  if (hasText(draft.destination)) completedItems.push("Delivery location entered");
  else missingItems.push("Add delivery city or town");

  if (hasText(draft.delivery_postcode)) completedItems.push(`Delivery postcode: ${draft.delivery_postcode}`);
  else if (currentStep >= 1 && hasText(draft.destination)) {
    tips.push("Add delivery postcode for exact delivery-area matching.");
  }

  if (hasText(draft.pickup_date)) completedItems.push("Pickup date set");
  else if (currentStep >= 1) missingItems.push("Set pickup date so carriers can plan");

  if (hasText(draft.pickup_time)) completedItems.push("Pickup time set");
  else if (currentStep >= 1 && hasText(draft.pickup_date)) {
    tips.push("Adding a pickup time improves same-day carrier matching.");
  }

  if (hasText(draft.delivery_date)) completedItems.push("Delivery date set");
  else if (currentStep >= 1 && hasText(draft.origin) && hasText(draft.destination)) {
    missingItems.push("Add expected delivery date");
  }

  if (draft.urgency === "same-day" || draft.urgency === "urgent") {
    tips.push(`Urgency is ${draft.urgency} — budget may need a premium for fast cover.`);
  }

  if (currentStep >= 2) {
    if (hasText(draft.cargo_type)) completedItems.push("Cargo type described");
    else missingItems.push("Describe cargo type (e.g. pallets, machinery, food)");

    if (hasText(draft.cargo_description || draft.description)) completedItems.push("Cargo description added");
    else if (currentStep >= 2) missingItems.push("Add cargo description (e.g. palletised steel components)");

    if (hasText(draft.quantity)) completedItems.push("Quantity entered");
    else if (currentStep >= 2) missingItems.push("Enter quantity (e.g. 20 pallets)");

    if (hasText(draft.weight)) completedItems.push("Weight entered");
    else {
      missingItems.push("Enter weight — required for equipment and pricing accuracy");
      if (draft.cargo_type) suggestedFixes.weight = "1000 kg";
    }

    if (hasText(draft.volume)) completedItems.push("Volume / dimensions noted");
    else tips.push("Volume or pallet count helps carriers confirm vehicle fit.");
  }

  if (currentStep >= 3) {
    if (hasText(draft.equipment)) completedItems.push(`Equipment: ${draft.equipment}`);
    else missingItems.push("Select vehicle type (curtain, artic, refrigerated, etc.)");

    if (draft.refrigerated) {
      if (!/reef|fridge|chiller|temp/i.test(String(draft.equipment || ""))) {
        warnings.push("Refrigeration requested but equipment is not chilled — switch vehicle type.");
        suggestedFixes.equipment = "refrigerated";
      }
      if (!hasText(draft.description)) {
        tips.push("State temperature range in notes (e.g. 2–5°C for food).");
      }
    }

    if (draft.tail_lift) tips.push("Tail lift selected — mention bay access or ground-level delivery in notes.");
    if (draft.adr_certified) tips.push("ADR enabled — specify hazard class and UN number in cargo details.");
    if (draft.pallet_exchange_required) tips.push("Pallet exchange required — confirm standard pallet type in notes.");
  }

  if (currentStep >= 4 || (hasText(draft.origin) && hasText(draft.destination))) {
    if (hasText(draft.load_price || draft.max_budget)) completedItems.push("Load price set");
    else if (advisory?.suggestedPrice) {
      missingItems.push("Set load price — the exact transport amount carriers will be paid");
      suggestedFixes.load_price = String(advisory.suggestedPrice);
    }

    if (advisory?.suggestedPrice) {
      tips.push(
        `Live corridor rate: £${advisory.suggestedPrice.toLocaleString("en-GB")} (${advisory.distanceMiles} mi, £${advisory.marketRpm.toFixed(2)}/mi).`
      );
    }

    if (!agreementAccepted && currentStep >= 4) {
      missingItems.push("Accept terms & conditions before publishing");
    }
  }

  for (const issue of advisory?.issues || []) {
    const line = issue.message;
    const normalized = line.trim().toLowerCase();
    const alreadyListed = [...missingItems, ...warnings, ...tips].some(
      (item) => item.trim().toLowerCase() === normalized
    );
    if (alreadyListed) continue;

    if (issue.severity === "error") warnings.unshift(line);
    else if (issue.severity === "warning") warnings.push(line);
    else tips.push(line);

    if (issue.field === "equipment" && issue.message.includes("refrigerated")) {
      suggestedFixes.equipment = "refrigerated";
    }
    if (issue.field === "load_price" && advisory?.suggestedPrice && !hasText(draft.load_price || draft.max_budget)) {
      suggestedFixes.load_price = String(advisory.suggestedPrice);
    }
  }

  if (currentStep === 1 && missingItems.some((item) => item.includes("pickup") || item.includes("delivery"))) {
    priorityActions.push("Complete route: pickup and delivery cities");
  }
  if (currentStep === 1 && !hasText(draft.pickup_date)) {
    priorityActions.push("Add pickup date on the Route step");
  }
  if (currentStep === 2 && !hasText(draft.cargo_type)) {
    priorityActions.push("Describe what you are shipping on the Cargo step");
  }
  if (currentStep === 2 && !hasText(draft.weight)) {
    priorityActions.push("Enter cargo weight — carriers need this to bid accurately");
  }
  if (currentStep === 3 && draft.refrigerated && suggestedFixes.equipment) {
    priorityActions.push("Match equipment to refrigerated cargo");
  }
  if (currentStep === 4 && !hasText(draft.load_price || draft.max_budget) && advisory?.suggestedPrice) {
    priorityActions.push("Apply suggested market rate as your load price");
  }
  if (currentStep === 4 && !agreementAccepted) {
    priorityActions.push("Tick the agreement checkbox, then choose pay now or pay later");
  }
  if (currentStep < 4 && idleMs >= 60_000) {
    priorityActions.push(`Move to step ${currentStep + 1} when ${stepLabel.toLowerCase()} looks complete`);
  }

  if (priorityActions.length === 0 && missingItems.length > 0) {
    priorityActions.push(missingItems[0]);
  }

  const route =
    hasText(draft.origin) && hasText(draft.destination)
      ? `${formatRouteLabel(String(draft.origin), draft.pickup_postcode)} → ${formatRouteLabel(String(draft.destination), draft.delivery_postcode)}`
      : null;

  const contextSummary = [
    `Page: Post a load (step ${currentStep}/4 — ${stepLabel})`,
    route ? `Route: ${route}` : "Route: not complete",
    advisory?.readinessScore != null ? `Readiness: ${advisory.readinessScore}/100` : null,
    idleMs >= 60_000 ? `User idle ~${Math.round(idleMs / 1000)}s on this step` : null,
    completedItems.length ? `Done: ${completedItems.slice(0, 4).join("; ")}` : null,
    missingItems.length ? `Still needed: ${missingItems.slice(0, 4).join("; ")}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    pageId: "supplier_post_load",
    pageLabel: "Post a load",
    currentStep,
    stepLabel,
    readinessScore: advisory?.readinessScore,
    completedItems,
    missingItems,
    warnings,
    tips,
    priorityActions: priorityActions.slice(0, 4),
    suggestedFixes,
    contextSummary,
  };
}

export function observeSupplierAiAssistantPage(options: {
  hasStarted?: boolean;
  messageCount?: number;
  lastUserMessage?: string;
  idleMs?: number;
}): PageObservation {
  const { hasStarted, messageCount = 0, lastUserMessage, idleMs = 0 } = options;
  const missingItems: string[] = [];
  const tips: string[] = [];
  const priorityActions: string[] = [];

  if (!hasStarted || messageCount === 0) {
    missingItems.push("Ask a question or pick a suggested prompt to begin");
    priorityActions.push("Try: “What price should I offer Manchester to London?”");
    tips.push("I can help with pricing, posting loads, tracking shipments, and bid review.");
  } else if (idleMs >= 45_000) {
    tips.push("Still thinking? I can suggest market rates, validate a load, or walk you through posting.");
    priorityActions.push("Tell me your route and cargo — I’ll recommend next steps");
  }

  if (lastUserMessage && /price|rate|budget|offer/i.test(lastUserMessage) && !/to|from|→/i.test(lastUserMessage)) {
    tips.push("Include origin and destination (e.g. Manchester to London) for live corridor pricing.");
  }

  return {
    pageId: "supplier_ai_assistant",
    pageLabel: "Supplier AI Assistant",
    completedItems: messageCount > 0 ? [`${messageCount} messages in this session`] : [],
    missingItems,
    warnings: [],
    tips,
    priorityActions: priorityActions.slice(0, 3),
    suggestedFixes: {},
    contextSummary: `Supplier AI chat${hasStarted ? " active" : " — not started yet"}.`,
  };
}

export function observeCarrierAiAssistantPage(options: {
  hasStarted?: boolean;
  messageCount?: number;
  lastUserMessage?: string;
  idleMs?: number;
}): PageObservation {
  const { hasStarted, messageCount = 0, lastUserMessage, idleMs = 0 } = options;
  const tips: string[] = [];
  const priorityActions: string[] = [];
  const missingItems: string[] = [];

  if (!hasStarted || messageCount === 0) {
    missingItems.push("Start by asking about loads, RPM, or bid strategy");
    priorityActions.push("Try: “Find highest paying loads near Birmingham”");
    tips.push("I can match loads, calculate profit, plan backhauls, and review bids.");
  } else if (idleMs >= 45_000) {
    priorityActions.push("Ask for load matches or profit on a specific lane");
  }

  if (lastUserMessage && /bid|offer|rate/i.test(lastUserMessage) && !/\d/.test(lastUserMessage)) {
    tips.push("Share your proposed bid amount and route for a full margin breakdown.");
  }

  return {
    pageId: "carrier_ai_assistant",
    pageLabel: "Carrier AI Assistant",
    completedItems: messageCount > 0 ? [`${messageCount} messages in this session`] : [],
    missingItems,
    warnings: [],
    tips,
    priorityActions: priorityActions.slice(0, 3),
    suggestedFixes: {},
    contextSummary: `Carrier AI chat${hasStarted ? " active" : " — not started yet"}.`,
  };
}

export function buildObservationPromptBlock(observation: PageObservation): string {
  return [
    `PAGE: ${observation.pageLabel} (${observation.pageId})`,
    observation.stepLabel ? `STEP: ${observation.currentStep} — ${observation.stepLabel}` : null,
    observation.readinessScore != null ? `READINESS: ${observation.readinessScore}/100` : null,
    observation.contextSummary,
    observation.completedItems.length
      ? `COMPLETED:\n- ${observation.completedItems.join("\n- ")}`
      : "COMPLETED: none yet",
    observation.missingItems.length
      ? `MISSING / TODO:\n- ${observation.missingItems.join("\n- ")}`
      : null,
    observation.warnings.length ? `WARNINGS:\n- ${observation.warnings.join("\n- ")}` : null,
    observation.tips.length ? `TIPS:\n- ${observation.tips.join("\n- ")}` : null,
    observation.priorityActions.length
      ? `PRIORITY ACTIONS:\n- ${observation.priorityActions.join("\n- ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}
