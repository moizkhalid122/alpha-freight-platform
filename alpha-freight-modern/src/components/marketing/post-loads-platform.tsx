import {
  BarChart3,
  Boxes,
  ClipboardList,
  Truck,
  Wallet,
} from "lucide-react";

import PremiumPlatformBento from "@/components/marketing/PremiumPlatformBento";

const lanePreview = [
  { lane: "London → Manchester", rpm: "£2.13" },
  { lane: "Birmingham → Leeds", rpm: "£1.98" },
  { lane: "Glasgow → Edinburgh", rpm: "£2.05" },
];

export function PostLoadsPlatformSection() {
  return (
    <PremiumPlatformBento
      eyebrow="Supplier platform"
      title={
        <>
          Everything to post,
          <br />
          <span className="text-slate-400">award, and settle.</span>
        </>
      }
      subtitle="From first publish to final POD — one supplier workspace for UK haulage and freight operations."
      hero={{
        icon: Boxes,
        title: "Post in minutes",
        description: "One guided flow for route, cargo, equipment, and budget — no spreadsheets.",
        image: "/how-1.jpg",
        preview: (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[
                { label: "Route", value: "London → Manchester" },
                { label: "Equipment", value: "Curtain-side · 24 pallets" },
                { label: "Pickup", value: "Tomorrow · 08:00" },
                { label: "Budget", value: "£420" },
              ].map((field) => (
                <div key={field.label} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{field.label}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-slate-800">{field.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7da600]">Ready to publish</span>
              <span className="rounded-full bg-[#BFFF07] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900">
                Post load
              </span>
            </div>
          </div>
        ),
      }}
      cards={[
        {
          icon: ClipboardList,
          title: "Compare bids",
          description: "Transparent carrier offers with vetting status visible before you award.",
          className: "md:col-span-6 lg:col-span-4",
          preview: (
            <div className="overflow-hidden rounded-xl border border-slate-200/80">
              {[
                { name: "Northern Express", bid: "£412", verified: true },
                { name: "Midlands Haulage", bid: "£418", verified: true },
                { name: "Swift Freight", bid: "£435", verified: false },
              ].map((row, i) => (
                <div
                  key={row.name}
                  className={`flex items-center justify-between px-3.5 py-3 ${i > 0 ? "border-t border-slate-100" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{row.name}</span>
                    {row.verified && (
                      <span className="rounded-full bg-[#BFFF07]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-800">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{row.bid}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          icon: Truck,
          title: "Live tracking",
          description: "Pickup, in-transit, and delivery milestones on every assigned load.",
          className: "md:col-span-6 lg:col-span-3",
          preview: (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              {[
                { label: "Collected", time: "08:42", done: true },
                { label: "In transit", time: "11:15", done: true },
                { label: "Delivered", time: "Pending", done: false },
              ].map((point, i) => (
                <div key={point.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${point.done ? "bg-[#BFFF07] ring-4 ring-[#BFFF07]/20" : "border-2 border-slate-300 bg-white"}`}
                    />
                    {i < 2 && <span className={`my-1 w-px flex-1 min-h-[1.25rem] ${point.done ? "bg-[#BFFF07]/50" : "bg-slate-200"}`} />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-semibold text-slate-800">{point.label}</p>
                    <p className="text-xs text-slate-400">{point.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          icon: Wallet,
          title: "Pay your way",
          description: "Instant settlement or pay later — full audit trail on supplier wallet.",
          className: "md:col-span-6 lg:col-span-4",
          preview: (
            <>
              <div className="flex flex-wrap gap-2">
                {["Pay instant", "Pay later", "Wallet", "Export"].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                  >
                    {pill}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[#BFFF07]/30 bg-[#BFFF07]/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7da600]">Last settlement</p>
                <p className="mt-1 text-lg font-bold text-slate-900">£418.00 · Paid</p>
              </div>
            </>
          ),
        },
        {
          icon: BarChart3,
          title: "Lane rate intelligence",
          description: "Benchmark UK corridors before you set budget — powered by marketplace data.",
          className: "md:col-span-6 lg:col-span-3",
          href: "/tools/lane-rates",
          linkLabel: "Open tool",
          preview: (
            <div className="overflow-hidden rounded-xl border border-slate-200/80">
              <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>Lane</span>
                <span>£/mi</span>
              </div>
              {lanePreview.map((row, i) => (
                <div
                  key={row.lane}
                  className={`grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 ${i > 0 ? "border-t border-slate-100" : ""}`}
                >
                  <span className="truncate text-xs text-slate-600">{row.lane}</span>
                  <span className="text-xs font-bold text-slate-900">{row.rpm}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
