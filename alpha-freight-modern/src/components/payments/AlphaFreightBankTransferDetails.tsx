"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  getAlphaFreightBankDetailFields,
  type AlphaFreightBankDetailField,
} from "@/lib/alpha-freight-bank-details";

type AlphaFreightBankTransferDetailsProps = {
  reference?: string;
  amountLabel?: string;
  className?: string;
};

function BankDetailRow({ field }: { field: AlphaFreightBankDetailField }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(field.copyValue ?? field.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-b-0">
      <span className="text-[14px] text-slate-600">{field.label}</span>
      <div className="flex min-w-0 items-start gap-2">
        <span className="text-right text-[14px] font-medium text-emerald-800">{field.value}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${field.label}`}
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AlphaFreightBankTransferDetails({
  reference,
  amountLabel,
  className = "",
}: AlphaFreightBankTransferDetailsProps) {
  const fields = getAlphaFreightBankDetailFields();

  return (
    <div className={`rounded-xl border border-slate-200 bg-white px-5 py-2 shadow-sm ${className}`}>
      {amountLabel ? (
        <div className="border-b border-slate-100 py-3.5">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[14px] text-slate-600">Amount to transfer</span>
            <span className="text-right text-[14px] font-semibold text-emerald-800">{amountLabel}</span>
          </div>
        </div>
      ) : null}
      {reference ? (
        <div className="border-b border-slate-100 py-3.5">
          <BankDetailRow
            field={{
              label: "Payment reference",
              value: reference,
              copyValue: reference,
            }}
          />
        </div>
      ) : null}
      {fields.map((field) => (
        <BankDetailRow key={field.label} field={field} />
      ))}
      <p className="py-3 text-[12px] leading-5 text-slate-500">
        Use your load reference in the bank transfer description so Alpha Freight can match your payment
        quickly.
      </p>
    </div>
  );
}
