"use client";

import { useState, type FormEvent } from "react";
import { Calculator } from "lucide-react";
import { calculateProfit } from "@/lib/copilot/profit-calculator";

type AiRpmCalculatorProps = {
  onAskFollowUp?: (question: string) => void;
};

export default function AiRpmCalculator({ onAskFollowUp }: AiRpmCalculatorProps) {
  const [payment, setPayment] = useState("800");
  const [miles, setMiles] = useState("320");
  const [emptyMiles, setEmptyMiles] = useState("0");
  const [result, setResult] = useState<ReturnType<typeof calculateProfit> | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const rate = Number(payment);
    const loaded = Number(miles);
    if (!rate || !loaded) return;
    setResult(
      calculateProfit({
        rate,
        loadedMiles: loaded,
        emptyMiles: Number(emptyMiles) || 0,
      })
    );
  };

  return (
    <div className="mt-3 rounded-2xl border border-[#e8e8e8] bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#333]">
        <Calculator className="h-4 w-4 text-[#666]" />
        RPM & profit calculator
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs text-[#666]">
          Load payment (£)
          <input
            type="number"
            min={1}
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e5e5e5] px-3 py-2 text-sm text-[#111] outline-none focus:border-[#999]"
          />
        </label>
        <label className="block text-xs text-[#666]">
          Loaded miles
          <input
            type="number"
            min={1}
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e5e5e5] px-3 py-2 text-sm text-[#111] outline-none focus:border-[#999]"
          />
        </label>
        <label className="block text-xs text-[#666]">
          Empty miles
          <input
            type="number"
            min={0}
            value={emptyMiles}
            onChange={(e) => setEmptyMiles(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e5e5e5] px-3 py-2 text-sm text-[#111] outline-none focus:border-[#999]"
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-3 rounded-full bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
        >
          Calculate
        </button>
      </form>

      {result && (
        <div className="mt-4 space-y-2 border-t border-[#eee] pt-4 text-sm text-[#333]">
          <p>
            <strong>RPM:</strong> £{result.rpm.toFixed(2)}/mile · <strong>Est. profit:</strong> £
            {result.grossProfit.toFixed(2)} · <strong>Margin:</strong> {result.marginPct.toFixed(1)}%
          </p>
          <p className="text-[#666]">{result.recommendation}</p>
          {onAskFollowUp && (
            <button
              type="button"
              onClick={() => onAskFollowUp(`Is £${result.rpm.toFixed(2)}/mi RPM good for this load?`)}
              className="text-sm text-[#555] underline hover:text-[#111]"
            >
              Ask AI if this RPM is good
            </button>
          )}
        </div>
      )}
    </div>
  );
}
