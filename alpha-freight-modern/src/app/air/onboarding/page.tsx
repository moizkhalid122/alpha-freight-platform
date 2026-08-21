import { Suspense } from "react";
import AirOnboardingClient from "./AirOnboardingClient";

export default function AirOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center air-onboarding-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
        </div>
      }
    >
      <AirOnboardingClient />
    </Suspense>
  );
}
