import type { CommercialActivityItem } from "@/lib/commercial-director-dashboard";

const TONE_CLASS = {
  sky: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-800 ring-amber-100",
  slate: "bg-gray-100 text-gray-700 ring-gray-200",
} as const;

export default function CommercialActivityFeed({
  items,
  title = "Commercial pulse",
}: {
  items: CommercialActivityItem[];
  title?: string;
}) {
  return (
    <section className="air-card rounded-[24px] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="air-font-display text-xl font-medium text-gray-900">{title}</h2>
        <p className="mt-1 text-[12px] text-gray-500">Live overview across your workspace.</p>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-3"
          >
            <span
              className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${
                TONE_CLASS[item.tone ?? "slate"]
              }`}
            >
              {item.time}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-900">{item.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
