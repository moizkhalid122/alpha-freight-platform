const analyticsCards = [
  { label: "Marketplace growth", value: "+12%" },
  { label: "Load fill rate", value: "86%" },
  { label: "Average response time", value: "4.2 min" },
  { label: "Dispute ratio", value: "1.8%" },
];

const analyticsNotes = [
  "Carrier engagement is strongest during the early morning booking window.",
  "Smart load recommendations are improving bid conversion week over week.",
  "Supplier repeat posting is up after AI assistant entry points were expanded.",
];

export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
          Analytics
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          Read the platform growth signals
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          This section is ready for charts, trend lines, and backend metrics as
          the admin panel expands.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[26px] border border-slate-200 bg-slate-50 p-5"
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

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-4">
          {analyticsNotes.map((note) => (
            <div
              key={note}
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5"
            >
              <p className="text-sm leading-6 text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
