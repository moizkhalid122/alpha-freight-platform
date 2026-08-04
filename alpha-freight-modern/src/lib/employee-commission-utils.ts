import type { EmployeeCommission } from "@/lib/employee-types";

export const COMMISSION_RULES = [
  "Commission is calculated on closed deal value when a lead is marked Won in CRM.",
  "Default sales rate is 8% — managers may set a custom rate on your profile.",
  "New commissions start as Pending until admin approves in the HR panel.",
  "Approved commissions are paid to your registered bank account monthly.",
  "Payouts typically arrive within 5–7 working days after month-end approval.",
];

export function estimateCommission(valueGbp: number, ratePct: number): number {
  return Math.round(Number(valueGbp) * (ratePct / 100));
}

export type CommissionStats = {
  pending: number;
  approved: number;
  paidAllTime: number;
  paidThisMonth: number;
  thisMonthTotal: number;
  ytdTotal: number;
  countPending: number;
};

export function currentPeriodMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function formatPeriodMonth(period: string | null | undefined): string {
  if (!period) return "—";
  const d = new Date(`${period.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return period;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function computeCommissionStats(rows: EmployeeCommission[]): CommissionStats {
  const period = currentPeriodMonth();
  const year = new Date().getFullYear();

  return {
    pending: rows.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount_gbp), 0),
    approved: rows.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.amount_gbp), 0),
    paidAllTime: rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount_gbp), 0),
    paidThisMonth: rows
      .filter((r) => r.status === "paid" && r.period_month?.slice(0, 7) === period.slice(0, 7))
      .reduce((s, r) => s + Number(r.amount_gbp), 0),
    thisMonthTotal: rows
      .filter((r) => r.period_month?.slice(0, 7) === period.slice(0, 7))
      .reduce((s, r) => s + Number(r.amount_gbp), 0),
    ytdTotal: rows
      .filter((r) => r.period_month && new Date(r.period_month).getFullYear() === year)
      .reduce((s, r) => s + Number(r.amount_gbp), 0),
    countPending: rows.filter((r) => r.status === "pending").length,
  };
}

export function groupByMonth(rows: EmployeeCommission[]): { month: string; label: string; total: number; paid: number }[] {
  const map = new Map<string, { total: number; paid: number }>();
  for (const r of rows) {
    const key = r.period_month?.slice(0, 7) ?? "unknown";
    const cur = map.get(key) ?? { total: 0, paid: 0 };
    cur.total += Number(r.amount_gbp);
    if (r.status === "paid") cur.paid += Number(r.amount_gbp);
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, v]) => ({
      month,
      label: formatPeriodMonth(`${month}-01`),
      total: v.total,
      paid: v.paid,
    }));
}

export function commissionStatusTone(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    case "approved":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function filterCommissions(
  rows: EmployeeCommission[],
  status: "all" | "pending" | "approved" | "paid",
  search: string
): EmployeeCommission[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (q) {
      const hay = [r.notes, r.company_name, r.period_month, String(r.amount_gbp)].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function commissionsToCsv(rows: EmployeeCommission[]): string {
  const headers = ["period_month", "company_name", "deal_value_gbp", "amount_gbp", "status", "notes", "created_at"];
  const lines = rows.map((r) =>
    headers
      .map((h) => {
        const v = r[h as keyof EmployeeCommission];
        const s = v == null ? "" : String(v);
        return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export function downloadCommissionCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type BankDetails = {
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
};

const BANK_KEY = "af_bank";

export function loadLocalBank(userId: string): BankDetails | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(`${BANK_KEY}_${userId}`) || "null");
  } catch {
    return null;
  }
}

export function saveLocalBank(userId: string, bank: BankDetails) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${BANK_KEY}_${userId}`, JSON.stringify(bank));
}

export function maskAccountNumber(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `****${digits.slice(-4)}`;
}
