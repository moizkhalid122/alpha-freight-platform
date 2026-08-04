"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { employeeOnboardingPath, employeeRoute } from "@/lib/employee-path";
import { clearLocalOnboardingComplete } from "@/lib/employee-onboarding";
import { supabase } from "@/lib/supabase";

export default function EmployeeExistingSessionBanner() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? null);
    });
  }, []);

  if (!email) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    if (userId) clearLocalOnboardingComplete(userId);
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
      <p>
        Already signed in as <strong>{email}</strong>.
      </p>
      <div className="mt-2 flex flex-wrap gap-3 font-semibold">
        <Link href={employeeOnboardingPath()} className="underline underline-offset-2">
          Continue onboarding
        </Link>
        <Link href={employeeRoute()} className="underline underline-offset-2">
          Go to dashboard
        </Link>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="underline underline-offset-2 disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
