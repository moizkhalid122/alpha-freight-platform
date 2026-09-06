"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { AdminPanel } from "@/components/admin/AdminHrShell";
import { Button } from "@/components/ui/button";
import { editorIntakePath } from "@/lib/editor-intake-path";

export default function EditorIntakeLinkCard() {
  const [url, setUrl] = useState(editorIntakePath());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${editorIntakePath()}`);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <AdminPanel className="border-violet-100/80 bg-gradient-to-br from-violet-50/50 to-white">
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-violet-600" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Private editor form</p>
      </div>
      <h2 className="text-lg font-bold text-slate-900">Editor details intake</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
        Share this link only with hired editors. Not on the public website. Collects photo, ID, portfolio, and contact
        details. Submissions appear on the <strong>Editor Intake</strong> page in admin.
      </p>
      <div className="mt-4 rounded-xl border border-violet-200/70 bg-white/90 p-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 font-mono text-[11px] text-slate-700 sm:text-xs">
          {url}
        </div>
        <Button type="button" onClick={() => void copy()} className="mt-3 w-full rounded-xl sm:w-auto" variant="secondary">
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy private form link
            </>
          )}
        </Button>
      </div>
    </AdminPanel>
  );
}
