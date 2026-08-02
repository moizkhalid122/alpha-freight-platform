"use client";

import { useState } from "react";
import { FileText, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface PodUploadPanelProps {
  onAnalyze: (description: string) => void;
  disabled?: boolean;
}

export default function PodUploadPanel({ onAnalyze, disabled }: PodUploadPanelProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ score: number; complete: boolean; recommendation: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat/pod-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      setResult(data.analysis);
      onAnalyze(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-4 mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <FileText className="h-4 w-4" /> POD Document Check
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Describe your POD or paste delivery notes — AI will check completeness.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="e.g. Signed by John at ABC Warehouse, delivered 2pm, load #1234, goods in good condition"
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 disabled:opacity-60"
        rows={2}
      />
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={disabled || loading || !text.trim()}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        <Upload className="h-3 w-3" /> {loading ? "Checking…" : "Check POD"}
      </button>
      {result && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 ${result.complete ? "bg-emerald-50" : "bg-amber-50"}`}>
          {result.complete ? (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}
          <div>
            <p className="text-xs font-semibold text-slate-800">Score: {result.score}%</p>
            <p className="mt-0.5 text-xs text-slate-600">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
