"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, PackageSearch } from "lucide-react";

import { EQUIPMENT_OPTIONS, UK_CITY_SUGGESTIONS } from "@/lib/freight-tools";
import { toolCardClass, toolInputClass, toolLabelClass } from "@/components/tools/tool-form-styles";

type LoadRow = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  price: number;
  equipment: string;
  pickupDate: string | null;
  commodity: string;
  status: string;
};

export default function LiveLoadsPanel() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [total, setTotal] = useState(0);

  const fetchLoads = useCallback(async (filters?: { origin?: string; destination?: string; equipment?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "12" });
      if (filters?.origin) params.set("origin", filters.origin);
      if (filters?.destination) params.set("destination", filters.destination);
      if (filters?.equipment) params.set("equipment", filters.equipment);

      const response = await fetch(`/api/public/loads?${params.toString()}`);
      const payload = (await response.json()) as {
        loads?: LoadRow[];
        stats?: { total: number };
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Unable to fetch loads.");
      setLoads(payload.loads ?? []);
      setTotal(payload.stats?.total ?? 0);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch loads.");
      setLoads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchLoads({ origin, destination, equipment });
  };

  return (
    <div className="space-y-8">
      <section className={toolCardClass}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Filter live UK loads</h2>
              <p className="text-sm text-slate-500">Browse open marketplace freight — sign up free to bid.</p>
            </div>
          </div>
          <Link
            href="/auth/carrier-signup"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Join as carrier
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="loads-origin" className={toolLabelClass}>
              Origin
            </label>
            <input
              id="loads-origin"
              list="uk-cities-loads"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Any city"
              className={toolInputClass}
            />
          </div>
          <div>
            <label htmlFor="loads-destination" className={toolLabelClass}>
              Destination
            </label>
            <input
              id="loads-destination"
              list="uk-cities-loads"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Any city"
              className={toolInputClass}
            />
          </div>
          <div>
            <label htmlFor="loads-equipment" className={toolLabelClass}>
              Equipment
            </label>
            <select
              id="loads-equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className={toolInputClass}
            >
              <option value="">All types</option>
              {EQUIPMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#BFFF07] px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-900 hover:bg-[#d4ff4d] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Search
            </button>
          </div>
          <datalist id="uk-cities-loads">
            {UK_CITY_SUGGESTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </form>
      </section>

      <section className={toolCardClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7da600]">Live board</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{total} open load{total === 1 ? "" : "s"}</h3>
          </div>
          <Link href="/available-loads" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Full load board →
          </Link>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <div className="mt-8 flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : loads.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No matching open loads right now. Try another corridor or check back soon.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="pb-3 pr-4">Lane</th>
                  <th className="pb-3 pr-4">Equipment</th>
                  <th className="pb-3 pr-4">Rate</th>
                  <th className="pb-3">Ref</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((load) => (
                  <tr key={load.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3.5 pr-4 font-medium text-slate-800">
                      {load.origin} → {load.destination}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">{load.equipment}</td>
                    <td className="py-3.5 pr-4 font-semibold text-slate-900">
                      {load.price > 0 ? `£${load.price.toLocaleString()}` : "Open to bid"}
                    </td>
                    <td className="py-3.5 text-slate-500">{load.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
