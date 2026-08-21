import { ADMIN_CARD } from "@/lib/admin-ui";

const paymentCards = [
  { label: "Processed today", value: "GBP 84,320" },
  { label: "Held payouts", value: "4" },
  { label: "Failed attempts", value: "7" },
];

const paymentRows = [
  {
    title: "Supplier payout batch",
    status: "Processing",
    amount: "GBP 18,400",
    note: "Scheduled release at 18:30.",
  },
  {
    title: "Carrier wallet withdrawal",
    status: "On hold",
    amount: "GBP 2,950",
    note: "Manual review triggered for bank mismatch.",
  },
  {
    title: "Instant pay settlement",
    status: "Completed",
    amount: "GBP 6,120",
    note: "Released successfully this morning.",
  },
];

export default function AdminPaymentsPage() {
  return (
    <div className="admin-page-stack space-y-4">
      <section className={`${ADMIN_CARD} p-6 sm:p-8`}>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
          Payments
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          Monitor payout and settlement flow
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {paymentCards.map((card) => (
            <div
              key={card.label}
              className={`${ADMIN_CARD} p-4`}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${ADMIN_CARD} p-6 sm:p-8`}>
        <div className="space-y-4">
          {paymentRows.map((row) => (
            <div
              key={row.title}
              className={`${ADMIN_CARD} flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between`}
            >
              <div>
                <p className="text-lg font-black tracking-tight text-slate-900">
                  {row.title}
                </p>
                <p className="mt-1 text-sm text-slate-500">{row.note}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {row.amount}
                </span>
                <span className="rounded-full bg-[#BFFF07] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900">
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
