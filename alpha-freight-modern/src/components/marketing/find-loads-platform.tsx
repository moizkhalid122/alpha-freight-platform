import {
  BarChart3,
  Search,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";

import PremiumPlatformBento from "@/components/marketing/PremiumPlatformBento";

const lanePreview = [
  { lane: "London → Manchester", rpm: "£2.13" },
  { lane: "Birmingham → Leeds", rpm: "£1.98" },
  { lane: "Bristol → Cardiff", rpm: "£1.87" },
];

export function FindLoadsPlatformSection() {
  return (
    <PremiumPlatformBento
      eyebrow="Carrier platform"
      title={
        <>
          Everything to find,
          <br />
          <span className="text-slate-400">bid, and earn.</span>
        </>
      }
      subtitle="From live load board to 7-day payout — one carrier workspace built for UK haulage operators."
      hero={{
        icon: Search,
        title: "Live load board",
        description: "Find freight loads by route, equipment, timing, and budget — updated in real time.",
        image: "/how-4.jpg",
        preview: (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {["London", "Curtain-side", "Tomorrow", "£300+"].map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-600"
                >
                  {filter}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { lane: "London → Manchester", rate: "£418", match: "96% lane fit" },
                { lane: "London → Birmingham", rate: "£252", match: "91% lane fit" },
              ].map((row) => (
                <div
                  key={row.lane}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2.5"
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{row.lane}</p>
                    <p className="text-[10px] font-medium text-[#7da600]">{row.match}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{row.rate}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      }}
      cards={[
        {
          icon: Zap,
          title: "Smart matching",
          description: "AI suggests lane-fit jobs based on your fleet profile, history, and operating regions.",
          className: "md:col-span-6 lg:col-span-4",
          preview: (
            <div className="overflow-hidden rounded-xl border border-slate-200/80">
              {[
                { lane: "Leeds → London", score: "98%", reason: "Return lane" },
                { lane: "Manchester → Glasgow", score: "94%", reason: "Equipment match" },
                { lane: "Bristol → Cardiff", score: "89%", reason: "Short haul fit" },
              ].map((row, i) => (
                <div
                  key={row.lane}
                  className={`flex items-center justify-between px-3.5 py-3 ${i > 0 ? "border-t border-slate-100" : ""}`}
                >
                  <div>
                    <span className="text-sm font-medium text-slate-800">{row.lane}</span>
                    <p className="text-[10px] text-slate-400">{row.reason}</p>
                  </div>
                  <span className="rounded-full bg-[#BFFF07]/25 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                    {row.score}
                  </span>
                </div>
              ))}
            </div>
          ),
        },
        {
          icon: ShieldCheck,
          title: "Verified shippers",
          description: "Work with approved UK suppliers — clear workflows and transparent load details.",
          className: "md:col-span-6 lg:col-span-3",
          preview: (
            <div className="space-y-2">
              {["Verified supplier badge", "Clear pickup windows", "Digital POD required", "Rated after delivery"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#BFFF07]" />
                    <span className="text-xs text-slate-600">{item}</span>
                  </div>
                ),
              )}
            </div>
          ),
        },
        {
          icon: Wallet,
          title: "7-day payouts",
          description: "Get paid faster after POD verification — full earnings history in your carrier wallet.",
          className: "md:col-span-6 lg:col-span-4",
          preview: (
            <>
              <div className="flex flex-wrap gap-2">
                {["POD upload", "Auto verify", "Wallet", "7-day payout"].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                  >
                    {pill}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[#BFFF07]/30 bg-[#BFFF07]/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7da600]">Last payout</p>
                <p className="mt-1 text-lg font-bold text-slate-900">£418.00 · Cleared</p>
              </div>
            </>
          ),
        },
        {
          icon: BarChart3,
          title: "Lane rate index",
          description: "Check £/mile benchmarks before you bid on UK corridors.",
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
