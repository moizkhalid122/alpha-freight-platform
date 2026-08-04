import { findCountryOption } from "@/lib/country-options";

export const RENDER_BACKEND_URL = (
  process.env.NEXT_PUBLIC_RENDER_BACKEND_URL || "https://alpha-freight-server.onrender.com"
).replace(/\/$/, "");

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export const RENDER_PAYMENT_INTENT_URL = `${RENDER_BACKEND_URL}/api/create-payment-intent`;

export function isLiveCardCheckoutEnabled() {
  return Boolean(STRIPE_PUBLISHABLE_KEY) && !STRIPE_PUBLISHABLE_KEY.startsWith("YOUR_");
}

export function parseCardExpiry(expiry: string) {
  const digits = expiry.replace(/\D/g, "");
  if (digits.length < 4) return null;

  const month = Number.parseInt(digits.slice(0, 2), 10);
  let year = Number.parseInt(digits.slice(2, 4), 10);
  if (year < 100) year += 2000;

  if (!month || month < 1 || month > 12) return null;

  const expiryDate = new Date(year, month - 1);
  if (expiryDate < new Date()) return null;

  return { month, year };
}

export function countryToStripeCode(country: string) {
  if (/^[a-z]{2}$/i.test(country.trim())) {
    return country.trim().toUpperCase();
  }

  const option = findCountryOption(country);
  if (option) return option.value;

  const map: Record<string, string> = {
    "United Kingdom": "GB",
    "United States": "US",
    Ireland: "IE",
    Germany: "DE",
    France: "FR",
  };
  return map[country] || "GB";
}

export type RenderPaymentIntentResponse = {
  clientSecret?: string;
  status?: string;
  error?: { message?: string };
};

export async function createRenderPaymentIntent(params: {
  amountPence: number;
  loadId: string;
  paymentFor: string;
  paymentType?: string;
  currency?: string;
}) {
  const response = await fetch(RENDER_PAYMENT_INTENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amountPence,
      currency: params.currency || "gbp",
      loadId: params.loadId,
      paymentFor: params.paymentFor,
      paymentType: params.paymentType || "Instant Load Payment",
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error("Card payments are not available on the payment server. Please try again shortly.");
  }

  let data: RenderPaymentIntentResponse;
  try {
    data = JSON.parse(rawText) as RenderPaymentIntentResponse;
  } catch {
    throw new Error("Payment response was invalid. Please try again.");
  }

  if (!response.ok) {
    throw new Error(data.error?.message || "Unable to start payment.");
  }

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  return data;
}
