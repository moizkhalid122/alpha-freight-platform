"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import EmployeePolicyDocument from "@/components/employee/EmployeePolicyDocument";
import EmployeePolicySaveButton from "@/components/employee/EmployeePolicySaveButton";
import type { EmployeePolicyDocument as PolicyDoc } from "@/lib/employee-policies";
import { cn } from "@/lib/utils";

type EmployeePolicyModalProps = {
  policy: PolicyDoc | null;
  open: boolean;
  onClose: () => void;
  onConfirmRead: (policyId: PolicyDoc["id"]) => void;
  alreadyRead: boolean;
};

export default function EmployeePolicyModal({
  policy,
  open,
  onClose,
  onConfirmRead,
  alreadyRead,
}: EmployeePolicyModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (atBottom) setScrolledToEnd(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setScrolledToEnd(false);
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    if (el.scrollHeight <= el.clientHeight + 24) {
      setScrolledToEnd(true);
    }
  }, [open, policy, handleScroll]);

  if (!open || !policy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Policy document</p>
            <h2 className="text-lg font-black text-slate-900">{policy.shortTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close policy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <EmployeePolicyDocument policy={policy} />
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          <div className="mb-3 flex justify-center">
            <EmployeePolicySaveButton label="Save as PDF" />
          </div>
          {alreadyRead ? (
            <p className="text-center text-sm font-semibold text-emerald-600">You have read this document.</p>
          ) : (
            <>
              <p className="mb-3 text-center text-xs text-slate-500">
                {scrolledToEnd
                  ? "Scroll complete. Confirm that you have read the full document."
                  : "Scroll to the bottom to confirm you have read the full document."}
              </p>
              <button
                type="button"
                disabled={!scrolledToEnd}
                onClick={() => onConfirmRead(policy.id)}
                className={cn(
                  "w-full rounded-2xl py-3.5 text-sm font-bold transition",
                  scrolledToEnd
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-200 text-slate-400"
                )}
              >
                I have read this document
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
