import { getAiApiBaseUrl } from "@/lib/ai-api-config";
import type { PostLoadFormData, PostLoadUrgency } from "@/lib/supplier-post-load";

export type PostLoadAiExtractResult = {
  draft: Partial<PostLoadFormData>;
  confidence: "high" | "partial" | "low";
  missingFields: string[];
  summary: string;
};

const EQUIPMENT_ALIASES: [RegExp, string][] = [
 [/\bartic\b/i, "artic"],
 [/\b44\s*t\b/i, "artic"],
 [/\b18\s*t\b/i, "large-truck"],
 [/\blarge truck\b/i, "large-truck"],
 [/\b7\.?5\s*t\b/i, "medium-truck"],
 [/\bmedium truck\b/i, "medium-truck"],
 [/\b3\.?5\s*t\b/i, "small-truck"],
 [/\bsmall truck\b/i, "small-truck"],
 [/\bflatbed\b/i, "flatbed"],
 [/\bcurtain\s*side\b/i, "curtainside"],
 [/\bcurtainside\b/i, "curtainside"],
 [/\bvan\b/i, "van"],
];

const CARGO_HINTS: [RegExp, string][] = [
 [/\bsteel\b/i, "Steel"],
 [/\bpallet/i, "Pallets"],
 [/\bmachinery\b/i, "Machinery"],
 [/\bfurniture\b/i, "Furniture"],
 [/\bfood\b/i, "Food & drink"],
 [/\bgeneral freight\b/i, "General freight"],
];

function mergeDraft(
  base: Partial<PostLoadFormData>,
  patch: Partial<PostLoadFormData>
): Partial<PostLoadFormData> {
  const merged = { ...base };
  (Object.keys(patch) as (keyof PostLoadFormData)[]).forEach((key) => {
    const value = patch[key];
    if (typeof value === "boolean") {
      merged[key] = value as never;
      return;
    }
    if (typeof value === "string" && value.trim()) {
      merged[key] = value.trim() as never;
    }
  });
  return merged;
}

function parsePickupHints(text: string, draft: Partial<PostLoadFormData>) {
  const lower = text.toLowerCase();
  const today = new Date();

  if (/\b(tomorrow|kal)\b/i.test(text)) {
    const pickup = new Date(today);
    pickup.setDate(pickup.getDate() + 1);
    draft.pickupDate = pickup.toISOString().slice(0, 10);
  }

  if (/\b(today|aaj)\b/i.test(text)) {
    draft.pickupDate = today.toISOString().slice(0, 10);
  }

  const timeMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (timeMatch) {
    draft.pickupTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  } else if (/\b(morning|subah)\b/i.test(lower)) {
    draft.pickupTime = "09:00";
  } else if (/\b(afternoon|dopahar)\b/i.test(lower)) {
    draft.pickupTime = "14:00";
  }

  if (/\b(same day|same-day)\b/i.test(lower)) {
    draft.urgency = "same-day";
    if (!draft.pickupDate) draft.pickupDate = today.toISOString().slice(0, 10);
  } else if (/\b(urgent|asap|jaldi|turant)\b/i.test(lower)) {
    draft.urgency = "urgent";
  }
}

export function parsePostLoadLocally(text: string): PostLoadAiExtractResult {
  const draft: Partial<PostLoadFormData> = {};
  const missingFields: string[] = [];

  const routePatterns = [
    /(?:from|pickup(?: at)?|collect(?:ing)?(?: from)?)\s+([^,\n.]+?)\s+(?:to|→|->|deliver(?:y)?(?: to)?|drop(?: off)?(?: at)?)\s+([^,\n.]+)/i,
    /([^,\n.]+?)\s+(?:se|to|→|->)\s+([^,\n.]+)/i,
  ];

  for (const pattern of routePatterns) {
    const match = text.match(pattern);
    if (match) {
      draft.origin = match[1].trim();
      draft.destination = match[2].trim();
      break;
    }
  }

  const weightMatch = text.match(/(\d[\d.,]*)\s*(?:kg|kgs|kilos?)/i);
  if (weightMatch) {
    draft.weight = weightMatch[1].replace(/,/g, "");
  }

  const budgetMatch =
    text.match(/(?:£|gbp|budget|rate|price)\s*(\d[\d.,]*)/i) ||
    text.match(/(\d[\d.,]*)\s*(?:£|pounds?)/i);
  if (budgetMatch) {
    draft.maxBudget = budgetMatch[1].replace(/,/g, "");
  }

  for (const [pattern, equipment] of EQUIPMENT_ALIASES) {
    if (pattern.test(text)) {
      draft.equipment = equipment;
      break;
    }
  }

  for (const [pattern, cargo] of CARGO_HINTS) {
    if (pattern.test(text)) {
      draft.cargoType = cargo;
      break;
    }
  }

  if (/\btail\s*lift\b/i.test(text)) draft.tailLift = true;
  if (/\b(refrigerated|fridge|chilled|frozen)\b/i.test(text)) draft.refrigerated = true;
  if (/\badr\b/i.test(text)) draft.adrCertified = true;

  parsePickupHints(text, draft);

  if (!draft.origin) missingFields.push("pickup location");
  if (!draft.destination) missingFields.push("delivery location");
  if (!draft.weight) missingFields.push("weight");
  if (!draft.cargoType) missingFields.push("cargo type");
  if (!draft.pickupDate) missingFields.push("pickup date");

  const filledCount = ["origin", "destination", "weight", "cargoType", "equipment", "pickupDate"].filter(
    (key) => Boolean(draft[key as keyof PostLoadFormData])
  ).length;

  const confidence: PostLoadAiExtractResult["confidence"] =
    filledCount >= 4 && draft.origin && draft.destination ? "high" : filledCount >= 2 ? "partial" : "low";

  const summaryParts = [
    draft.origin && draft.destination ? `${draft.origin} → ${draft.destination}` : null,
    draft.weight ? `${draft.weight} kg` : null,
    draft.cargoType || null,
    draft.equipment || null,
    draft.pickupDate ? `Pickup ${draft.pickupDate}${draft.pickupTime ? ` ${draft.pickupTime}` : ""}` : null,
  ].filter(Boolean);

  return {
    draft,
    confidence,
    missingFields,
    summary: summaryParts.length
      ? summaryParts.join(" · ")
      : "Could not detect enough shipment details yet.",
  };
}

async function extractPostLoadViaAi(text: string): Promise<Partial<PostLoadFormData> | null> {
  try {
    const response = await fetch(`${getAiApiBaseUrl()}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message: text,
        assistantType: "supplier",
        history: [],
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      structuredMessage?: {
        actionRequest?: {
          payload?: {
            origin?: string | null;
            destination?: string | null;
            equipment?: string | null;
            weight?: string | number | null;
            price?: string | number | null;
          };
        };
      };
    };

    const payload = data.structuredMessage?.actionRequest?.payload;
    if (!payload?.origin && !payload?.destination) return null;

    return {
      origin: payload.origin?.trim() || "",
      destination: payload.destination?.trim() || "",
      equipment: payload.equipment?.trim() || "curtainside",
      weight: payload.weight != null ? String(payload.weight).replace(/[^\d.]/g, "") : "",
      maxBudget: payload.price != null ? String(payload.price).replace(/[^\d.]/g, "") : "",
    };
  } catch {
    return null;
  }
}

export async function extractPostLoadFromDescription(text: string): Promise<PostLoadAiExtractResult> {
  const local = parsePostLoadLocally(text);
  const aiPatch = await extractPostLoadViaAi(text);
  const draft = aiPatch ? mergeDraft(local.draft, aiPatch) : local.draft;

  const missingFields = [...local.missingFields];
  if (aiPatch?.origin) {
    const index = missingFields.indexOf("pickup location");
    if (index >= 0) missingFields.splice(index, 1);
  }
  if (aiPatch?.destination) {
    const index = missingFields.indexOf("delivery location");
    if (index >= 0) missingFields.splice(index, 1);
  }
  if (aiPatch?.weight) {
    const index = missingFields.indexOf("weight");
    if (index >= 0) missingFields.splice(index, 1);
  }

  const summaryParts = [
    draft.origin && draft.destination ? `${draft.origin} → ${draft.destination}` : null,
    draft.weight ? `${draft.weight} kg` : null,
    draft.cargoType || null,
    draft.equipment || null,
    draft.pickupDate ? `Pickup ${draft.pickupDate}${draft.pickupTime ? ` ${draft.pickupTime}` : ""}` : null,
  ].filter(Boolean);

  const filledCount = ["origin", "destination", "weight", "cargoType", "equipment", "pickupDate"].filter(
    (key) => Boolean(draft[key as keyof PostLoadFormData])
  ).length;

  return {
    draft,
    confidence:
      filledCount >= 4 && draft.origin && draft.destination
        ? "high"
        : filledCount >= 2
          ? "partial"
          : "low",
    missingFields,
    summary: summaryParts.length ? summaryParts.join(" · ") : local.summary,
  };
}

export function isPostLoadDescription(text: string) {
  return /\b(post|create|publish|book|ship|load|freight|delivery|pickup|collect)\b/i.test(text) &&
    (/\b(from|to|→|->|se)\b/i.test(text) || /\b\d+\s*kg\b/i.test(text));
}

export function urgencyLabel(value?: PostLoadUrgency) {
  if (value === "same-day") return "Same day";
  if (value === "urgent") return "Urgent";
  return "Standard";
}
