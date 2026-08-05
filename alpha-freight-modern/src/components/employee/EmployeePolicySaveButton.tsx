"use client";

import { Download } from "lucide-react";

export default function EmployeePolicySaveButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 print:hidden"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
