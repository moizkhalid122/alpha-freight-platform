import { markSupplierPaymentPaid } from "@/lib/supplier-payments";
import { countryToStripeCode, createRenderPaymentIntent } from "@/lib/stripe-payments";

type StripePaymentClient = {
  createPaymentMethod: (params: {
    paymentMethodType: "Card";
    paymentMethodData: {
      billingDetails: {
        name: string;
        email?: string;
        address?: {
          country?: string;
          postalCode?: string;
        };
      };
    };
  }) => Promise<{
    paymentMethod?: {
      id: string;
      card?: { brand?: string | null; last4?: string | null };
    };
    error?: { message?: string };
  }>;
  confirmPayment: (
    paymentIntentClientSecret: string,
    params: {
      paymentMethodType: "Card";
      paymentMethodData: {
        paymentMethodId: string;
      };
    }
  ) => Promise<{
    paymentIntent?: { id?: string; status?: string };
    error?: { message?: string };
  }>;
};

function formatCardBrand(brand?: string | null) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export async function createSupplierStripePaymentMethod(params: {
  stripe: StripePaymentClient;
  cardName: string;
  userEmail: string;
  country?: string;
  postcode?: string;
}) {
  if (!params.cardName.trim()) {
    return { ok: false as const, error: "Please enter the name on card." };
  }

  const { paymentMethod, error: pmError } = await params.stripe.createPaymentMethod({
    paymentMethodType: "Card",
    paymentMethodData: {
      billingDetails: {
        name: params.cardName.trim(),
        email: params.userEmail || undefined,
        address: {
          country: countryToStripeCode(params.country || "GB"),
          postalCode: params.postcode?.trim() || undefined,
        },
      },
    },
  });

  if (pmError || !paymentMethod) {
    return {
      ok: false as const,
      error: pmError?.message || "Unable to validate card details.",
    };
  }

  return {
    ok: true as const,
    paymentMethodId: paymentMethod.id,
    cardBrand: formatCardBrand(paymentMethod.card?.brand),
    cardLast4: paymentMethod.card?.last4 || "****",
  };
}

export async function confirmSupplierStripePayment(params: {
  stripe: StripePaymentClient;
  supplierId: string;
  loadId: string;
  loadTitle: string;
  amount: number;
  paymentMethodId: string;
  cardBrand: string;
  cardLast4: string;
}) {
  const amountPence = Math.round(params.amount * 100);
  if (amountPence <= 0) {
    return { ok: false as const, error: "Invalid payment amount." };
  }

  let paymentData;
  try {
    paymentData = await createRenderPaymentIntent({
      amountPence,
      loadId: params.loadId,
      paymentFor: params.loadTitle,
      paymentType: "Instant Load Payment",
    });
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to start payment.",
    };
  }

  if (paymentData.status === "succeeded") {
    return markSupplierPaymentPaid({
      supplierId: params.supplierId,
      loadId: params.loadId,
      cardBrand: params.cardBrand,
      cardLast4: params.cardLast4,
      paymentMethod: "card",
    });
  }

  if (!paymentData.clientSecret) {
    return { ok: false as const, error: "Payment response missing authorization." };
  }

  const { error: confirmError, paymentIntent } = await params.stripe.confirmPayment(
    paymentData.clientSecret,
    {
      paymentMethodType: "Card",
      paymentMethodData: {
        paymentMethodId: params.paymentMethodId,
      },
    }
  );

  if (confirmError) {
    return {
      ok: false as const,
      error: confirmError.message || "Payment was declined.",
    };
  }

  if (paymentIntent?.status?.toLowerCase() !== "succeeded") {
    return {
      ok: false as const,
      error: "Payment was not completed. Please try again.",
    };
  }

  return markSupplierPaymentPaid({
    supplierId: params.supplierId,
    loadId: params.loadId,
    cardBrand: params.cardBrand,
    cardLast4: params.cardLast4,
    paymentMethod: "card",
    stripePaymentIntentId: paymentIntent.id,
  });
}

/** Same flow as web PayInstantStripeCheckout — create method then confirm in one call. */
export async function processSupplierStripePayment(params: {
  stripe: StripePaymentClient;
  supplierId: string;
  loadId: string;
  loadTitle: string;
  amount: number;
  cardName: string;
  userEmail: string;
  country?: string;
  postcode?: string;
}) {
  const prepared = await createSupplierStripePaymentMethod({
    stripe: params.stripe,
    cardName: params.cardName,
    userEmail: params.userEmail,
    country: params.country,
    postcode: params.postcode,
  });

  if (!prepared.ok) {
    return prepared;
  }

  return confirmSupplierStripePayment({
    stripe: params.stripe,
    supplierId: params.supplierId,
    loadId: params.loadId,
    loadTitle: params.loadTitle,
    amount: params.amount,
    paymentMethodId: prepared.paymentMethodId,
    cardBrand: prepared.cardBrand,
    cardLast4: prepared.cardLast4,
  });
}
