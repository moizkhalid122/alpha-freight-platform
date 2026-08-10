const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function normalizeUkPostcode(value?: string | null): string {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!raw) return "";

  if (raw.length > 3) {
    return `${raw.slice(0, -3)} ${raw.slice(-3)}`;
  }

  return raw;
}

export function isValidUkPostcode(value?: string | null): boolean {
  const normalized = normalizeUkPostcode(value);
  return UK_POSTCODE_REGEX.test(normalized);
}

export function buildUkRouteQuery(city?: string, postcode?: string): string {
  const normalizedCity = String(city || "").trim();
  const normalizedPostcode = normalizeUkPostcode(postcode);

  if (normalizedCity && normalizedPostcode) {
    return `${normalizedPostcode}, ${normalizedCity}, United Kingdom`;
  }
  if (normalizedPostcode) {
    return `${normalizedPostcode}, United Kingdom`;
  }
  return normalizedCity;
}

export function formatRouteLabel(city?: string, postcode?: string): string {
  const normalizedCity = String(city || "").trim();
  const normalizedPostcode = normalizeUkPostcode(postcode);

  if (normalizedCity && normalizedPostcode) {
    return `${normalizedCity} (${normalizedPostcode})`;
  }
  return normalizedCity || normalizedPostcode;
}
