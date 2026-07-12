import { ReactNode } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import {
  getStripePublishableKey,
  isExpoGo,
  STRIPE_URL_SCHEME,
} from "@/lib/stripe-config";

const MERCHANT_IDENTIFIER = "merchant.com.alphafreight.uk";

export default function StripePaymentProvider({ children }: { children: ReactNode }) {
  const publishableKey = getStripePublishableKey();

  if (!publishableKey || isExpoGo()) {
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier={MERCHANT_IDENTIFIER}
      urlScheme={STRIPE_URL_SCHEME}
    >
      {children}
    </StripeProvider>
  );
}
