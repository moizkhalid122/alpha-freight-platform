"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type CustomSelectFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
};

export default function CustomSelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select option",
  compact = false,
}: CustomSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonClass = compact
    ? "flex h-full min-h-[46px] w-full items-center justify-between border-r border-slate-200 bg-white px-3.5 py-2.5 text-left text-[14px] font-semibold text-slate-900 outline-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    : "flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div ref={rootRef} className={compact ? "h-full" : undefined}>
      {label ? (
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      ) : null}
      <div className={`relative ${label ? "mt-2" : ""}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={buttonClass}
        >
          <span className={value ? "truncate text-slate-900" : "truncate text-slate-500"}>
            {value || placeholder}
          </span>
          <ChevronDown
            className={`ml-2 h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && !disabled ? (
          <div
            className={`absolute left-0 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
              compact ? "top-[calc(100%+4px)] min-w-[220px]" : "right-0 top-[calc(100%+8px)]"
            }`}
          >
            <div className="max-h-60 overflow-y-auto py-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 ${
                    value === option ? "bg-emerald-50/70" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
