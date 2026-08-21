import { shipmentStatusLabel } from "@/lib/air-dashboard";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  booked: "bg-blue-50 text-blue-700",
  confirmed: "bg-blue-50 text-blue-700",
  in_transit: "bg-sky-50 text-sky-700",
  delivered: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
};

type AirStatusBadgeProps = {
  status: string;
};

export default function AirStatusBadge({ status }: AirStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style}`}>
      {shipmentStatusLabel(status as never)}
    </span>
  );
}
