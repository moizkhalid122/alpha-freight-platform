import { getStripeClient } from "@/lib/stripe-server";

export type StripeRefundResult =
  | { ok: true; refundId: string; mode: "stripe" }
  | { ok: true; refundId: null; mode: "manual" }
  | { ok: false; error: string; mode: "manual" | "stripe" };

export async function processStripeRefund(params: {
  paymentIntentId?: string | null;
  amount?: number;
  currency?: string;
}): Promise<StripeRefundResult> {
  const paymentIntentId = params.paymentIntentId?.trim();

  if (!paymentIntentId) {
    return {
      ok: true,
      refundId: null,
      mode: "manual",
    };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return {
      ok: true,
      refundId: null,
      mode: "manual",
    };
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(params.amount && params.amount > 0
        ? {
            amount: Math.round(params.amount * 100),
          }
        : {}),
    });

    return {
      ok: true,
      refundId: refund.id,
      mode: "stripe",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Stripe refund failed",
      mode: "stripe",
    };
  }
}
