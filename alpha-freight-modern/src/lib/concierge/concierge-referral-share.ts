import { SITE_URL } from "@/lib/sitemap-data";

export function buildReferralShareUrl(code: string, role: "carrier" | "supplier"): string {
  const normalized = code.trim().toUpperCase();
  const params = new URLSearchParams({ ref: normalized, role });
  return `${SITE_URL}/auth/signup?${params.toString()}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildReferralShareMessage(code: string, role: "carrier" | "supplier"): string {
  const link = buildReferralShareUrl(code, role);
  const who = role === "supplier" ? "suppliers posting loads" : "carriers finding UK loads";
  return `Join me on Alpha Freight — ${who}. Use my referral code ${code}: ${link}`;
}

export async function copyReferralToClipboard(code: string, role: "carrier" | "supplier"): Promise<boolean> {
  const message = buildReferralShareMessage(code, role);
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}
