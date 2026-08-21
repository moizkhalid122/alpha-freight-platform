"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { employeeLoginPath, employeeSignupPath } from "@/lib/employee-path";
import { AdminPanel } from "@/components/admin/AdminHrShell";
import { ADMIN_BTN_PRIMARY } from "@/lib/admin-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EmployeePortalLinkCard() {
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [loginUrl, setLoginUrl] = useState(employeeLoginPath());
  const [inviteUrl, setInviteUrl] = useState(employeeSignupPath());

  useEffect(() => {
    const origin = window.location.origin;
    setLoginUrl(`${origin}${employeeLoginPath()}`);
    setInviteUrl(
      `${origin}${employeeSignupPath()}?email=employee@alphafreight.uk&name=Full+Name&position=Account+Executive`
    );
  }, []);

  const copy = async (text: string, which: "login" | "invite") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "login") {
        setCopiedLogin(true);
        setTimeout(() => setCopiedLogin(false), 2000);
      } else {
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <AdminPanel className="border-emerald-100/80 bg-gradient-to-br from-emerald-50/60 to-white">
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-emerald-600" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Employee links</p>
      </div>
      <h2 className="text-lg font-bold text-slate-900">Share with your team</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
        Naye employee ko <strong>invite link</strong> do (name, email, position auto-fill). Purane employees{" "}
        <strong>login link</strong> use karein.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-200/70 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">New employee — signup invite</p>
          <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 font-mono text-[11px] text-slate-700 sm:text-xs">
            {inviteUrl}
          </div>
          <Button type="button" onClick={() => copy(inviteUrl, "invite")} className="mt-3 w-full rounded-xl" variant="secondary">
            {copiedInvite ? (
              <>
                <Check className="h-4 w-4" /> Copied invite!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy invite link
              </>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Existing employee — login</p>
          <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 font-mono text-[11px] text-slate-700 sm:text-xs">
            {loginUrl}
          </div>
          <button type="button" onClick={() => copy(loginUrl, "login")} className={cn(ADMIN_BTN_PRIMARY, "mt-3 w-full")}>
            {copiedLogin ? (
              <>
                <Check className="h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy login link
              </>
            )}
          </button>
        </div>
      </div>
    </AdminPanel>
  );
}
