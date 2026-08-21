"use client";

import { Download } from "lucide-react";
import AirPageShell from "@/components/air/AirPageShell";
import { DEMO_AWBS } from "@/lib/air-storage";

export default function AirForwarderDocumentsPage() {
  const downloadDoc = (awb: string, type: string) => {
    const content = `Alpha Freight Air Document\nAWB: ${awb}\nType: ${type}\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${awb}-${type.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AirPageShell
      title="Documents"
      description="AWB copies, customs paperwork, and airway bills."
      backHref="/air/forwarder/dashboard"
    >
      <div className="space-y-3">
        {DEMO_AWBS.slice(0, 4).map((row) => (
          <div
            key={row.awb}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold text-gray-900">{row.awb}</p>
              <p className="text-sm text-gray-500">{row.route}</p>
            </div>
            <div className="flex gap-2">
              {["AWB copy", "Customs"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => downloadDoc(row.awb, type)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {type}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AirPageShell>
  );
}
