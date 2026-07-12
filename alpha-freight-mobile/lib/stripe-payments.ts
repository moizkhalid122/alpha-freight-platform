import { getRenderBackendUrl } from "@/lib/stripe-config";

export type RenderPaymentIntentResponse = {
  clientSecret?: string;
  status?: string;
  error?: { message?: string };
};

export function countryToStripeCode(country: string) {
  const trimmed = country.trim();
  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const map: Record<string, string> = {
    "United Kingdom": "GB",
    UK: "GB",
    "United States": "US",
    Ireland: "IE",
    Germany: "DE",
    France: "FR",
  };

  return map[trimmed] || "GB";
}

export async function createRenderPaymentIntent(params: {
  amountPence: number;
  loadId: string;
  paymentFor: string;
  paymentType?: string;
  currency?: string;
}) {
  const response = await fetch(`${getRenderBackendUrl()}/api/create-payment-intent`, {
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
