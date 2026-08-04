"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import {
  carrierOnboardingCountryOptions,
  findCountryOption,
  getCountryFlagSrc,
} from "@/lib/country-options";

type CountrySelectFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function CountrySelectField({
  label = "Country",
  value,
  onChange,
  disabled = false,
  placeholder = "Choose a country and currency",
}: CountrySelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => findCountryOption(value), [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef}>
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <div className="relative mt-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex min-w-0 items-center gap-3">
            {selectedOption ? (
              <>
                <Image
                  src={getCountryFlagSrc(selectedOption.value)}
                  alt={selectedOption.label}
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 rounded-full object-cover"
                />
                <span className="truncate">{selectedOption.label}</span>
              </>
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && !disabled ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="max-h-72 overflow-y-auto py-2">
              {carrierOnboardingCountryOptions.map((country) => (
                <button
                  key={country.value}
                  type="button"
                  onClick={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    selectedOption?.value === country.value ? "bg-emerald-50/70" : ""
                  }`}
                >
                  <Image
                    src={getCountryFlagSrc(country.value)}
                    alt={country.label}
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{country.label}</span>
                    <span className="block text-[11px] text-slate-500">{country.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
