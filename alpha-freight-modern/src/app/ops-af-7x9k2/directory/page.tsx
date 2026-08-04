"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";

type DirectoryRequest = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  fleetType: string;
  status: "pending" | "approved";
  submittedAt: string;
};

const initialRequests: DirectoryRequest[] = [
  {
    id: "101",
    companyName: "Global Logistics Ltd",
    email: "ops@global-logistics.com",
    phone: "+44 7700 900111",
    fleetType: "Dry Van",
    status: "pending",
    submittedAt: "26 Jun 2026",
  },
  {
    id: "102",
    companyName: "Northern Freight",
    email: "contact@northernfreight.co.uk",
    phone: "+44 7700 900222",
    fleetType: "Flatbed",
    status: "pending",
    submittedAt: "25 Jun 2026",
  },
  {
    id: "103",
    companyName: "WestLine Cargo",
    email: "team@westlinecargo.com",
    phone: "+44 7700 900333",
    fleetType: "Curtainsider",
    status: "approved",
    submittedAt: "24 Jun 2026",
  },
];

export default function AdminDirectoryPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"pending" | "approved">("pending");

  const filteredRequests = useMemo(
    () => requests.filter((request) => request.status === filter),
    [filter, requests]
  );

  const moveRequest = (id: string, status: "pending" | "approved") => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Directory Review
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Carrier directory approvals
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Review listing requests and keep the public directory clean,
              verified, and trusted.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                filter === "pending"
                  ? "bg-[#151B24] text-white"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setFilter("approved")}
              className={`rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                filter === "approved"
                  ? "bg-[#151B24] text-white"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              Approved
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Carrier
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Fleet
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Submitted
                </th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-t border-slate-100">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-900">
                      {request.companyName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{request.email}</p>
                    <p className="mt-1 text-xs text-slate-400">{request.phone}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                      {request.fleetType}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{request.submittedAt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => moveRequest(request.id, "pending")}
                        className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
                        aria-label="Move to pending"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRequest(request.id, "approved")}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-600 transition-colors hover:bg-emerald-100"
                        aria-label="Approve listing"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
                        aria-label="Open profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-900">
              No requests in this view.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Switch the filter to review another approval state.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
