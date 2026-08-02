"use client";

import type { LanguagePreference } from "@/lib/copilot/language";

interface LanguageSelectorProps {
  value: LanguagePreference;
  onChange: (lang: LanguagePreference) => void;
}

const OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: "english", label: "English" },
  { value: "roman_urdu", label: "Roman Urdu" },
  { value: "urdu", label: "اردو" },
];

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
            value === opt.value
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
