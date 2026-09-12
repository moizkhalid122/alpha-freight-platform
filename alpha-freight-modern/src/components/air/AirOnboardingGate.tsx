"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolveAirExtras, isAirOnboardingComplete } from "@/lib/air-account-verification";
import type { AirRole } from "@/lib/air-portal";
import { AIR_PORTAL } from "@/lib/air-portal";

type AirOnboardingGateProps = {
  role: AirRole;
  children: ReactNode;
};

const BYPASS_PREFIXES = ["/air/onboarding", "/auth/air", "/air/shipper/verification", "/air/forwarder/verification"];

export default function AirOnboardingGate({ role, children }: AirOnboardingGateProps) {
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

      const extras = resolveAirExtras(user.id, profile?.profile_extras);

      if (!isAirOnboardingComplete(extras, role)) {
        router.replace(`${AIR_PORTAL.onboarding}?role=${role === "carrier" ? "carrier" : "supplier"}`);
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
        Checking air account setup...
      </div>
    );
  }

  return <>{children}</>;
}
