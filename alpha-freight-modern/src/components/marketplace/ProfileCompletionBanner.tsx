"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getCarrierProfileCompletion,
  getSupplierProfileCompletion,
} from "@/lib/profile-completion";
import { resolveCarrierExtras, resolveSupplierExtras } from "@/lib/profile-extras";

type ProfileCompletionBannerProps = {
  role: "carrier" | "supplier";
};

const PROFILE_BANNER_THRESHOLD = 85;

export default function ProfileCompletionBanner({ role }: ProfileCompletionBannerProps) {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(100);
  const [missing, setMissing] = useState<string[]>([]);

  const refreshCompletion = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_extras")
      .eq("id", user.id)
      .maybeSingle();

    const completion =
      role === "carrier"
        ? getCarrierProfileCompletion(resolveCarrierExtras(user.id, profile?.profile_extras))
        : getSupplierProfileCompletion(resolveSupplierExtras(user.id, profile?.profile_extras));

    setPercent(completion.percent);
    setMissing(completion.missing.slice(0, 3));
    setVisible(completion.percent < PROFILE_BANNER_THRESHOLD);
  }, [role]);

  useEffect(() => {
    void refreshCompletion();

    const handleProfileUpdated = () => {
      void refreshCompletion();
    };

    window.addEventListener("alpha-profile-updated", handleProfileUpdated);
    window.addEventListener("focus", handleProfileUpdated);

    return () => {
      window.removeEventListener("alpha-profile-updated", handleProfileUpdated);
      window.removeEventListener("focus", handleProfileUpdated);
    };
  }, [refreshCompletion]);

  if (!visible) return null;

  const profileHref = role === "carrier" ? "/carrier/complete-profile" : "/supplier/complete-profile";

  return (
    <div className="w-full border-b border-amber-100 bg-amber-50/90 px-4 py-3 sm:px-6">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">
              Complete your profile ({percent}% done)
            </p>
            <p className="text-[12px] text-slate-600">
              {missing.length
                ? `Still needed: ${missing.join(", ")}. Verification can be finished later from your profile.`
                : "Add a few details to unlock the best load matches and faster verification."}
            </p>
          </div>
        </div>
        <Link
          href={profileHref}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-900 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800 sm:self-auto"
        >
          Complete profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
