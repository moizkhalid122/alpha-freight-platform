import { stripLoadMarketMeta } from "@/lib/load-market-meta";

const FORM_META_REGEX = /\[\[af-form:([A-Za-z0-9+/=_-]+)\]\]\s*/;

export type LoadFormMeta = {
  pickup_postcode?: string;
  delivery_postcode?: string;
  cargo_description?: string;
  quantity?: string;
  packaging_type?: string;
  pallet_count?: string;
  dimension_length?: string;
  dimension_width?: string;
  dimension_height?: string;
  special_handling?: string[];
  declared_cargo_value?: string;
  volume?: string;
  forklift_required?: boolean;
  crane_required?: boolean;
  pallet_exchange_required?: boolean;
  other_vehicle_requirements?: string;
  tail_lift?: boolean;
  refrigerated?: boolean;
  adr_certified?: boolean;
  cargo_photo_urls?: string[];
  load_price?: string;
  urgency?: string;
};

export function encodeLoadFormMeta(meta: LoadFormMeta): string {
  const json = JSON.stringify(meta);
  const encoded =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf-8").toString("base64");
  return `[[af-form:${encoded}]] `;
}

export function parseLoadFormMeta(notes?: string | null): LoadFormMeta | null {
  if (!notes) return null;
  const match = notes.match(FORM_META_REGEX);
  if (!match) return null;

  try {
    const decoded =
      typeof atob === "function"
        ? decodeURIComponent(escape(atob(match[1])))
        : Buffer.from(match[1], "base64").toString("utf-8");
    return JSON.parse(decoded) as LoadFormMeta;
  } catch {
    return null;
  }
}

export function stripLoadFormMeta(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(FORM_META_REGEX, "").trim();
}

export function mergeLoadNotesWithFormMeta(
  humanNotes: string | undefined | null,
  formMeta: LoadFormMeta,
  marketNotes: string
): string {
  const cleaned = stripLoadFormMeta(stripLoadMarketMeta(humanNotes));
  const prefix = encodeLoadFormMeta(formMeta);
  const parts = [marketNotes.trim(), prefix.trim(), cleaned.trim()].filter(Boolean);
  return parts.join("\n").trim();
}

export function buildHumanReadableCargoSummary(meta: LoadFormMeta): string {
  const lines: string[] = [];

  if (meta.pickup_postcode) lines.push(`Pickup postcode: ${meta.pickup_postcode}`);
  if (meta.delivery_postcode) lines.push(`Delivery postcode: ${meta.delivery_postcode}`);
  if (meta.cargo_description) lines.push(`Cargo: ${meta.cargo_description}`);
  if (meta.quantity) lines.push(`Quantity: ${meta.quantity}`);
  if (meta.packaging_type) lines.push(`Packaging: ${meta.packaging_type}`);
  if (meta.pallet_count) lines.push(`Units/pallets: ${meta.pallet_count}`);
  if (meta.dimension_length || meta.dimension_width || meta.dimension_height) {
    lines.push(
      `Dimensions (L×W×H cm): ${meta.dimension_length || "—"} × ${meta.dimension_width || "—"} × ${meta.dimension_height || "—"}`
    );
  }
  if (meta.special_handling?.length) {
    lines.push(`Special handling: ${meta.special_handling.join(", ")}`);
  }
  if (meta.declared_cargo_value) {
    lines.push(`Declared cargo value: £${meta.declared_cargo_value}`);
  }
  if (meta.forklift_required) lines.push("Forklift required");
  if (meta.crane_required) lines.push("Crane required");
  if (meta.pallet_exchange_required) lines.push("Pallet exchange required");
  if (meta.other_vehicle_requirements) {
    lines.push(`Other vehicle requirements: ${meta.other_vehicle_requirements}`);
  }

  return lines.join("\n");
}
