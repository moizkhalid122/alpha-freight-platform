"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { DEMO_TRACK, getAirShipments } from "@/lib/air-storage";

type TrackResult = {
  awb: string;
  status: string;
  route: string;
  eta: string;
};

export default function AirShipperTrackPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<TrackResult[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim().toUpperCase();
    if (!term) {
      setResults([]);
      setSearched(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const mine = user
      ? getAirShipments(user.id)
          .filter((s) => s.awb.toUpperCase().includes(term))
          .map((s) => ({
            awb: s.awb,
            status: s.status === "pending" ? "Awaiting booking" : s.status.replace("_", " "),
            route: `${s.origin} → ${s.destination}`,
            eta: "Pending confirmation",
          }))
      : [];

    const demo = DEMO_TRACK.filter((d) => d.awb.toUpperCase().includes(term));
    setResults([...mine, ...demo.filter((d) => !mine.some((m) => m.awb === d.awb))]);
    setSearched(true);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      void runSearch(q);
    }
  }, [searchParams, runSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    void runSearch(query);
  };

  return (
    <AirPageShell
      title="Track AWB"
      description="Search by air waybill number for live status updates."
      backHref="/air/shipper/dashboard"
    >
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          className="air-input flex-1"
          placeholder="Enter AWB number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
          <Search className="h-4 w-4" />
          Track
        </button>
      </form>

      {searched && results.length === 0 ? (
        <p className="text-sm text-gray-500">No AWB found for &quot;{query}&quot;.</p>
      ) : null}

      <div className="space-y-3">
        {(searched ? results : DEMO_TRACK).map((row) => (
          <div key={row.awb} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="font-semibold text-gray-900">{row.awb}</p>
            <p className="text-sm text-gray-500">
              {row.status} · {row.route}
            </p>
            <p className="mt-1 text-xs text-gray-400">ETA: {row.eta}</p>
          </div>
        ))}
      </div>
    </AirPageShell>
  );
}
