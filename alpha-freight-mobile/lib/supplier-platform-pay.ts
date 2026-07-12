import { Platform } from "react-native";
import { PlatformPay } from "@stripe/stripe-react-native";
import { markSupplierPaymentPaid } from "@/lib/supplier-payments";
import { createRenderPaymentIntent } from "@/lib/stripe-payments";
import { isGooglePayTestEnv } from "@/lib/stripe-config";

type PlatformPayClient = {
  isPlatformPaySupported: (params?: {
    googlePay?: PlatformPay.IsGooglePaySupportedParams;
  }) => Promise<boolean>;
  confirmPlatformPayPayment: (
    clientSecret: string,
    params: PlatformPay.ConfirmParams
  ) => Promise<PlatformPay.ConfirmPaymentResult>;
};

function sanitizeLabel(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80) || "Alpha Freight load";
}

function buildPlatformPayConfirmParams(loadTitle: string, amount: number): PlatformPay.ConfirmParams {
  const label = sanitizeLabel(loadTitle);
  const amountLabel = amount.toFixed(2);

  if (Platform.OS === "ios") {
    return {
      applePay: {
        cartItems: [
          {
            label,
            amount: amountLabel,
            paymentType: PlatformPay.PaymentType.Immediate,
          },
        ],
        merchantCountryCode: "GB",
        currencyCode: "GBP",
      },
    };
  }

  return {
    googlePay: {
      testEnv: isGooglePayTestEnv(),
      merchantName: "Alpha Freight",
      merchantCountryCode: "GB",
      currencyCode: "GBP",
      label,
      existingPaymentMethodRequired: false,
      billingAddressConfig: {
        format: PlatformPay.BillingAddressFormat.Min,
        isPhoneNumberRequired: false,
        isRequired: false,
      },
    },
  };
}

export async function processSupplierPlatformPayment(params: {
  platformPay: PlatformPayClient;
  supplierId: string;
  loadId: string;
  loadTitle: string;
  amount: number;
}) {
  const amountPence = Math.round(params.amount * 100);
  if (amountPence <= 0) {
    return { ok: false as const, error: "Invalid payment amount." };
  }

  const googlePayCheck =
    Platform.OS === "android"
      ? { googlePay: { testEnv: isGooglePayTestEnv() } }
      : undefined;

  const supported = await params.platformPay.isPlatformPaySupported(googlePayCheck);

  if (!supported) {
    return {
      ok: false as const,
      error:
        Platform.OS === "ios"
          ? "Apple Pay is not set up on this device."
          : "Google Pay is not available. Add a card to Google Wallet or pay by debit/credit card.",
    };
  }

  let paymentData;
  try {
    paymentData = await createRenderPaymentIntent({
      amountPence,
      loadId: params.loadId,
      paymentFor: sanitizeLabel(params.loadTitle),
      paymentType: "Instant Load Payment",
    });
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to start payment.",
    };
  }

  const walletLabel = Platform.OS === "ios" ? "Apple Pay" : "Google Pay";
  const paymentMethod = Platform.OS === "ios" ? "apple_pay" : "google_pay";

  if (paymentData.status === "succeeded") {
    return markSupplierPaymentPaid({
      supplierId: params.supplierId,
      loadId: params.loadId,
      cardBrand: walletLabel,
      paymentMethod,
    });
  }

  if (!paymentData.clientSecret) {
    return { ok: false as const, error: "Payment server did not authorise this checkout." };
  }

  const { error, paymentIntent } = await params.platformPay.confirmPlatformPayPayment(
    paymentData.clientSecret,
    buildPlatformPayConfirmParams(params.loadTitle, params.amount)
  );

  if (error) {
    const message = error.message || "Payment was cancelled.";
    if (/cancel/i.test(message)) {
      return { ok: false as const, error: "Google Pay was cancelled." };
    }
    return { ok: false as const, error: message };
  }

  const status = paymentIntent?.status?.toLowerCase() ?? "";
  if (status !== "succeeded" && status !== "processing") {
    return {
      ok: false as const,
      error: "Payment was not completed. Please try again or use card payment.",
    };
  }

  return markSupplierPaymentPaid({
    supplierId: params.supplierId,
    loadId: params.loadId,
    cardBrand: walletLabel,
    paymentMethod,
    stripePaymentIntentId: paymentIntent?.id,
  });
}
