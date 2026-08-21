"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AirPageShell from "@/components/air/AirPageShell";
import { getAirLanes, saveAirLane, type AirLane } from "@/lib/air-storage";

const DEFAULT_LANES = ["LHR ↔ DXB", "MAN ↔ AMS", "STN ↔ FRA"];

export default function AirForwarderLanesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [lanes, setLanes] = useState<AirLane[]>([]);
  const [route, setRoute] = useState("");
  const [ratePerKg, setRatePerKg] = useState("");
  const [frequency, setFrequency] = useState("Daily");

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setLanes(getAirLanes(user.id));
    })();
  }, []);

  const addLane = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !route.trim() || !ratePerKg.trim()) return;
    const lane: AirLane = {
      id: crypto.randomUUID(),
      route: route.trim(),
      ratePerKg: ratePerKg.trim(),
      frequency,
    };
    saveAirLane(userId, lane);
    setLanes((prev) => [lane, ...prev]);
    setRoute("");
    setRatePerKg("");
  };

  const allLanes = [
    ...lanes,
    ...DEFAULT_LANES.filter((r) => !lanes.some((l) => l.route === r)).map((r) => ({
      id: r,
      route: r,
      ratePerKg: "—",
      frequency: "Partner lane",
    })),
  ];

  return (
    <AirPageShell
      title="Lanes & rates"
      description="Manage your air corridors and publish rates to shippers."
      backHref="/air/forwarder/dashboard"
    >
      <form onSubmit={addLane} className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-gray-900">Add a lane</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="air-input"
            placeholder="e.g. LHR → DXB"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            required
          />
          <input
            className="air-input"
            placeholder="Rate per kg (£)"
            value={ratePerKg}
            onChange={(e) => setRatePerKg(e.target.value)}
            required
          />
          <select
            className="air-input"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option>Daily</option>
            <option>3× weekly</option>
            <option>Weekly</option>
            <option>Charter</option>
          </select>
        </div>
        <button type="submit" className="air-btn-primary mt-4 max-w-xs">
          Publish lane
        </button>
      </form>

      <div className="space-y-3">
        {allLanes.map((lane) => (
          <div key={lane.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="font-semibold text-gray-900">{lane.route}</p>
            <div className="text-sm text-gray-500">
              {lane.ratePerKg !== "—" ? `£${lane.ratePerKg}/kg` : "Market rate"} · {lane.frequency}
            </div>
          </div>
        ))}
      </div>
    </AirPageShell>
  );
}
