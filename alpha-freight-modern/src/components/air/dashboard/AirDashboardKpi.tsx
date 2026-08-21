import type { LucideIcon } from "lucide-react";

type AirDashboardKpiProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: string;
};

export default function AirDashboardKpi({
  label,
  value,
  sub,
  icon: Icon,
  tone = "text-sky-600",
}: AirDashboardKpiProps) {
  return (
    <div className="air-card rounded-[24px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className="air-font-display text-3xl font-medium text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
