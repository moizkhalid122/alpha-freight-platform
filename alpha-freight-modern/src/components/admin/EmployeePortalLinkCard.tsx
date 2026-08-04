"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { employeeLoginPath, employeeSignupPath } from "@/lib/employee-path";
import { AdminPanel } from "@/components/admin/AdminHrShell";
import { Button } from "@/components/ui/button";

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
    <AdminPanel className="mb-6 border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white">
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-emerald-600" />
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">Employee links</p>
      </div>
      <h2 className="text-lg font-black text-slate-900">Share with your team</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Naye employee ko <strong>invite link</strong> do (name, email, position auto-fill). Purane employees{" "}
        <strong>login link</strong> use karein.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">New employee — signup invite</p>
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800 sm:text-xs">
            {inviteUrl}
          </div>
          <Button type="button" onClick={() => copy(inviteUrl, "invite")} className="mt-3 w-full rounded-2xl" variant="secondary">
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

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Existing employee — login</p>
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-800 sm:text-xs">
            {loginUrl}
          </div>
          <Button type="button" onClick={() => copy(loginUrl, "login")} className="mt-3 w-full rounded-2xl">
            {copiedLogin ? (
              <>
                <Check className="h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy login link
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminPanel>
  );
}
