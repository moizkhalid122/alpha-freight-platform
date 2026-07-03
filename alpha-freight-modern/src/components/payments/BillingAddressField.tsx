"use client";

type BillingAddressFieldProps = {
  label?: string;
  addressLine: string;
  onAddressLineChange: (value: string) => void;
  postcode: string;
  onPostcodeChange: (value: string) => void;
  disabled?: boolean;
  labelClass?: string;
  addressPlaceholder?: string;
};

export default function BillingAddressField({
  label = "Billing address",
  addressLine,
  onAddressLineChange,
  postcode,
  onPostcodeChange,
  disabled = false,
  labelClass = "text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500",
  addressPlaceholder = "City or address line",
}: BillingAddressFieldProps) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
        <div className="grid grid-cols-[1.05fr_0.95fr]">
          <input
            value={addressLine}
            onChange={(e) => onAddressLineChange(e.target.value)}
            placeholder={addressPlaceholder}
            disabled={disabled}
            className="min-h-[46px] border-r border-slate-200 bg-white px-3.5 py-2.5 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
          />
          <input
            value={postcode}
            onChange={(e) => onPostcodeChange(e.target.value.toUpperCase())}
            placeholder="Postcode"
            disabled={disabled}
            className="min-h-[46px] bg-white px-3.5 py-2.5 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
