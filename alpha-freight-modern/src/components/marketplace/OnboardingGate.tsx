"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolveCarrierExtras, resolveSupplierExtras } from "@/lib/profile-extras";
import type { MarketplaceRole } from "@/lib/account-verification";

type OnboardingGateProps = {
  role: MarketplaceRole;
  children: ReactNode;
};

const BYPASS_PREFIXES = ["/onboarding", "/auth"];

export default function OnboardingGate({ role, children }: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const check = async () => {
      if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        if (active) setReady(true);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_extras")
        .eq("id", user.id)
        .maybeSingle();

      const extras =
        role === "carrier"
          ? resolveCarrierExtras(user.id, profile?.profile_extras)
          : resolveSupplierExtras(user.id, profile?.profile_extras);

      if (!extras.onboardingComplete) {
        router.replace(`/onboarding?role=${role}`);
        return;
      }

      if (active) setReady(true);
    };

    void check();

    return () => {
      active = false;
    };
  }, [pathname, role, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#FDFDFD] text-sm font-medium text-slate-500">
        Checking account setup...
      </div>
    );
  }

  return <>{children}</>;
}
