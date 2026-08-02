import type { AssistantKind, CopilotPlatformIntent, CopilotActionRequest } from "@/lib/chat-types";

export type DetectedIntent = {
  platformIntent?: CopilotPlatformIntent;
  actionRequest?: CopilotActionRequest | null;
  needsWebSearch?: boolean;
  needsProfitCalc?: boolean;
  needsHandoff?: boolean;
  needsPodHelp?: boolean;
  profitInputs?: {
    rate?: number;
    miles?: number;
    emptyMiles?: number;
    fuelPrice?: number;
    origin?: string;
    destination?: string;
  };
};

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\bdesile\b/g, "diesel")
    .replace(/\bdesial\b/g, "diesel")
    .replace(/\bdesel\b/g, "diesel");
}

export function detectIntent(message: string, assistantType: AssistantKind): DetectedIntent {
  const lower = normalize(message);
  const result: DetectedIntent = {};

  if (
    /\b(agent|human|support|representative|insaan|banday se|kisi se baat|live chat|call me|phone karo)\b/i.test(
      lower
    )
  ) {
    result.needsHandoff = true;
  }

  if (/\b(pod|proof of delivery|document upload|signature missing|delivery note)\b/i.test(lower)) {
    result.needsPodHelp = true;
  }

  const webPatterns = [
    /\b(diesel|petrol|fuel|desile|desial|desel) (?:price|prices|cost|rate)\b/i,
    /\b(price|prices|cost|rate) (?:of |for )?(?:uk )?(?:diesel|petrol|fuel|desile)\b/i,
    /\b(?:uk|british)\b.*\b(diesel|petrol|fuel|desile|desial|hgv)\b/i,
    /\b(diesel|petrol|fuel|desile|desial)\b.*\b(?:uk|british)\b/i,
    /\b(news|closure|closed|traffic|delay|accident|weather|forecast)\b/i,
    /\b(m\d+|motorway)\b.*\b(closure|closed|traffic|delay|accident|works)\b/i,
    /\b(hgv|lorry|haulage) (?:rules|regulations|news)\b/i,
    /\b(live|real.?time|today|current|latest)\b.*\b(update|status|price|news|weather)\b/i,
  ];
  if (webPatterns.some((p) => p.test(lower)) && !/\b(my wallet|my bids?|my loads?)\b/i.test(lower)) {
    result.needsWebSearch = true;
  }

  if (
    /\b(profit|rpm|margin|fuel cost|calculate|kitna faida|kitna milega)\b/i.test(lower) &&
    (/\b£|\bpound|\bmile|\bkm|\brate|\bbid\b/i.test(lower) || /\d/.test(lower))
  ) {
    result.needsProfitCalc = true;
    const rateMatch = lower.match(/£?\s*(\d+(?:\.\d+)?)/);
    const milesMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:mile|miles|mi\b)/i);
    const fromTo = lower.match(/(?:from|se)\s+([a-z\s]+?)\s+(?:to|->|→)\s+([a-z\s]+)/i);
    result.profitInputs = {
      rate: rateMatch ? Number(rateMatch[1]) : undefined,
      miles: milesMatch ? Number(milesMatch[1]) : undefined,
      origin: fromTo?.[1]?.trim(),
      destination: fromTo?.[2]?.trim(),
    };
  }

  if (assistantType === "carrier" || assistantType === "general") {
    if (
      /\b(my loads?|active loads?|current loads?|mer[aei] load|assigned loads?)\b/i.test(lower)
    ) {
      result.platformIntent = { type: "active_loads_lookup" };
    } else if (
      /\b(find|search|show|dikhao|dhundo|available|book|highest paying|best load|backhaul|near me|nearby)\b.*\b(load|freight|job)\b/i.test(
        lower
      ) ||
      /\b(load|freight|job)\b.*\b(find|search|show|near|available|book)\b/i.test(lower)
    ) {
      const locationMatch = lower.match(
        /\b(?:near|in|from|around|close to)\s+([a-z\s]{3,30}?)(?:\?|$|,|\band\b|\bto\b)/i
      );
      const routeMatch = lower.match(/([a-z\s]+?)\s*(?:to|->|→)\s*([a-z\s]+)/i);
      const equipmentMatch = lower.match(
        /\b(artic|flatbed|reefer|box truck|sprinter|curtain|dry van|general)\b/i
      );
      result.platformIntent = {
        type: "loads_search",
        location: locationMatch?.[1]?.trim() || null,
        route: routeMatch ? `${routeMatch[1].trim()} to ${routeMatch[2].trim()}` : null,
        equipmentType: equipmentMatch?.[1] || null,
      };
    } else if (/\b(wallet|payout|earnings|balance|payment|paisa|kamai)\b/i.test(lower)) {
      result.platformIntent = { type: "earnings_lookup" };
    }
  }

  if (assistantType === "supplier" || assistantType === "general") {
    if (/\b(my bids?|incoming bids?|bid status|carrier bids?)\b/i.test(lower)) {
      result.platformIntent = { type: "bids_lookup" };
    } else if (
      /\b(post|create|add|new|lagao|dal)\b.*\b(load|shipment|freight)\b/i.test(lower) ||
      /\b(load|shipment)\b.*\b(post|create|add)\b/i.test(lower)
    ) {
      const routeMatch = lower.match(/([a-z\s]+?)\s*(?:to|->|→|se)\s*([a-z\s]+)/i);
      const priceMatch = lower.match(/£?\s*(\d+(?:\.\d+)?)/);
      const equipmentMatch = lower.match(
        /\b(artic|flatbed|reefer|box truck|sprinter|curtain|dry van|general|pallet)\b/i
      );
      const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|ton|tonne|t)\b/i);
      const origin = routeMatch?.[1]?.trim() || "";
      const destination = routeMatch?.[2]?.trim() || "";
      const equipment = equipmentMatch?.[1] || "";
      const price = priceMatch ? Number(priceMatch[1]) : 0;
      const missing: string[] = [];
      if (!origin) missing.push("origin");
      if (!destination) missing.push("destination");
      if (!equipment) missing.push("equipment");
      if (!price) missing.push("price");

      result.platformIntent = { type: "post_load_lookup" };
      result.actionRequest = {
        type: "create_load",
        status: missing.length ? "needs_input" : "ready",
        missingFields: missing,
        payload: {
          origin,
          destination,
          equipment,
          price,
          weight: weightMatch ? `${weightMatch[1]} ${weightMatch[0].includes("kg") ? "kg" : "t"}` : "",
        },
        prompt: missing.length
          ? `I need ${missing.join(", ")} to post this load. Please provide the missing details.`
          : "Ready to create load — confirm to post.",
      };
    } else if (/\b(my posts?|posted loads?|active shipments?)\b/i.test(lower)) {
      result.platformIntent = { type: "active_loads_lookup" };
    }
  }

  return result;
}
