"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { CheckCircle2, Lock, Loader2 } from "lucide-react";
import { markSupplierPaymentPaid } from "@/lib/supplier-payments";
import {
  countryToStripeCode,
  createRenderPaymentIntent,
  STRIPE_PUBLISHABLE_KEY,
} from "@/lib/render-payments";
import CountrySelectField from "@/components/payments/CountrySelectField";
import BillingAddressField from "@/components/payments/BillingAddressField";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const cardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: "14px",
      color: "#0f172a",
      fontFamily: "Inter, system-ui, sans-serif",
      "::placeholder": {
        color: "#94a3b8",
      },
    },
    invalid: {
      color: "#b91c1c",
    },
  },
};

type PayInstantStripeCheckoutProps = {
  supplierId: string;
  loadId: string;
  loadTitle: string;
  amount: number;
  userEmail: string;
  cardName: string;
  onCardNameChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  addressLine: string;
  onAddressLineChange: (value: string) => void;
  postcode: string;
  onPostcodeChange: (value: string) => void;
  isPaid: boolean;
  inputClass: string;
  labelClass: string;
  formatMoney: (value: number) => string;
  onFlashMessage: (message: string) => void;
  onSuccess: () => void;
};

function StripeCheckoutForm({
  supplierId,
  loadId,
  loadTitle,
  amount,
  userEmail,
  cardName,
  onCardNameChange,
  country,
  onCountryChange,
  addressLine,
  onAddressLineChange,
  postcode,
  onPostcodeChange,
  isPaid,
  inputClass,
  labelClass,
  formatMoney,
  onFlashMessage,
  onSuccess,
}: PayInstantStripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = async () => {
    if (!stripe || !elements || isPaid) return;

    if (!cardName.trim()) {
      onFlashMessage("Please enter the name on card.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onFlashMessage("Card form is not ready. Please refresh and try again.");
      return;
    }

    const amountPence = Math.round(amount * 100);
    if (amountPence <= 0) {
      onFlashMessage("Invalid payment amount.");
      return;
    }

    setIsProcessing(true);
    onFlashMessage("");

    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: cardName.trim(),
          email: userEmail || undefined,
          address: {
            line1: addressLine.trim() || undefined,
            postal_code: postcode || undefined,
            country: countryToStripeCode(country),
          },
        },
      });

      if (pmError || !paymentMethod) {
        throw new Error(pmError?.message || "Unable to validate card details.");
      }

      const paymentData = await createRenderPaymentIntent({
        amountPence,
        loadId,
        paymentFor: loadTitle,
        paymentType: "Instant Load Payment",
      });

      if (paymentData.status === "succeeded") {
        await markSupplierPaymentPaid({
          supplierId,
          loadId,
          cardBrand: paymentMethod.card?.brand
            ? paymentMethod.card.brand.charAt(0).toUpperCase() + paymentMethod.card.brand.slice(1)
            : "Card",
          cardLast4: paymentMethod.card?.last4 || "****",
        });
        onSuccess();
        return;
      }

      if (!paymentData.clientSecret) {
        throw new Error("Payment response missing client secret.");
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        { payment_method: paymentMethod.id }
      );

      if (confirmError) {
        throw new Error(confirmError.message || "Payment failed.");
      }

      if (paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not completed. Please try again.");
      }

      await markSupplierPaymentPaid({
        supplierId,
        loadId,
        cardBrand: paymentMethod.card?.brand
          ? paymentMethod.card.brand.charAt(0).toUpperCase() + paymentMethod.card.brand.slice(1)
          : "Card",
        cardLast4: paymentMethod.card?.last4 || "****",
        stripePaymentIntentId: paymentIntent.id,
      });

      onFlashMessage("Payment completed successfully.");
      onSuccess();
    } catch (error) {
      console.error("Payment error:", error);
      onFlashMessage(error instanceof Error ? error.message : "Something went wrong while processing payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="mt-6 space-y-4">
        <div>
          <label className={labelClass}>Name on card</label>
          <input
            value={cardName}
            onChange={(e) => onCardNameChange(e.target.value)}
            placeholder="Full name"
            disabled={isPaid}
            className={`mt-2 ${inputClass}`}
          />
        </div>

        <div>
          <label className={labelClass}>Card details</label>
          <div className="mt-2 rounded-md border border-slate-200 bg-white px-3.5 py-3 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <CountrySelectField
          value={country}
          onChange={onCountryChange}
          disabled={isPaid}
        />

        <BillingAddressField
          addressLine={addressLine}
          onAddressLineChange={onAddressLineChange}
          postcode={postcode}
          onPostcodeChange={onPostcodeChange}
          disabled={isPaid}
          labelClass={labelClass}
        />
      </div>

      <button
        type="button"
        onClick={handlePayNow}
        disabled={isProcessing || isPaid || !stripe}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#6d28d9] text-[14px] font-semibold text-white transition hover:bg-[#5b21b6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPaid ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Payment completed
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay {formatMoney(amount)}
          </>
        )}
      </button>
    </>
  );
}

export default function PayInstantStripeCheckout(props: PayInstantStripeCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripeCheckoutForm {...props} />
    </Elements>
  );
}
