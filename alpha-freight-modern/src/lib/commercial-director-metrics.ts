import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subMonths, startOfMonth as dateStartOfMonth } from "date-fns";
import type { ChartPoint } from "@/lib/air-dashboard";

export type MetricPair = { label: string; value: string };

export type CommercialMetricsPayload = {
  overview: {
    shippers: number;
    forwarders: number;
    loads: number;
    employees: number;
  };
  chartSeries: ChartPoint[];
  sections: Record<
    string,
    {
      metrics: MetricPair[];
      rows: Array<Record<string, string | number | null>>;
      rowColumns: Array<{ key: string; label: string }>;
    }
  >;
  updatedAt: string;
};

const CACHE_HEADERS = { "Cache-Control": "private, max-age=20" };

function fmtMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function buildLoadChartSeries(loads: Array<{ created_at?: string | null }>): ChartPoint[] {
  const buckets = new Map<string, number>();
  for (let index = 5; index >= 0; index -= 1) {
    const monthStart = dateStartOfMonth(subMonths(new Date(), index));
    buckets.set(format(monthStart, "MMM"), 0);
  }

  loads.forEach((load) => {
    if (!load.created_at) return;
    const label = format(new Date(load.created_at), "MMM");
    if (!buckets.has(label)) return;
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  });

  return Array.from(buckets.entries()).map(([name, value]) => ({ name, value }));
}

function emptySection(columns: Array<{ key: string; label: string }>, metrics: MetricPair[]) {
  return {
    metrics,
    rowColumns: columns,
    rows: [] as Array<Record<string, string | number | null>>,
  };
}

function safeCount(rows: unknown[] | null | undefined) {
  return rows?.length ?? 0;
}

function sumAmount(rows: Array<{ amount_gbp?: number | null; amount?: number | null; price?: number | null }>) {
  return rows.reduce((acc, row) => acc + Number(row.amount_gbp ?? row.amount ?? row.price ?? 0), 0);
}

type MetricsRowsInput = {
  overview: CommercialMetricsPayload["overview"];
  loads: Array<{
    id?: string;
    origin?: string | null;
    destination?: string | null;
    status?: string | null;
    price?: number | null;
    created_at?: string | null;
    title?: string | null;
  }>;
  leads: Array<{
    company_name?: string | null;
    contact_name?: string | null;
    status?: string | null;
    value_gbp?: number | null;
    created_at?: string | null;
  }>;
  tasks: Array<{
    title?: string | null;
    status?: string | null;
    priority?: string | null;
    due_date?: string | null;
    created_at?: string | null;
  }>;
  bids: Array<{
    load_id?: string | null;
    amount?: number | null;
    status?: string | null;
    created_at?: string | null;
  }>;
  commissions: Array<{
    amount_gbp?: number | null;
    status?: string | null;
    period_month?: string | null;
    created_at?: string | null;
  }>;
};

export function buildCommercialMetricsFromRows(input: MetricsRowsInput): CommercialMetricsPayload {
  const { overview, loads, leads, tasks, bids, commissions } = input;

  const openLeads = leads.filter((row) => !/won|lost|closed/i.test(String(row.status ?? "")));
  const wonLeads = leads.filter((row) => /won|converted|closed won/i.test(String(row.status ?? "")));
  const weekLeads = leads.filter((row) => String(row.created_at ?? "") >= daysAgo(7));
  const openTasks = tasks.filter((row) => !/done|complete|closed/i.test(String(row.status ?? "")));
  const dueTodayTasks = tasks.filter((row) => {
    if (!row.due_date) return false;
    return row.due_date === new Date().toISOString().slice(0, 10);
  });
  const overdueTasks = openTasks.filter((row) => row.due_date && row.due_date < new Date().toISOString().slice(0, 10));
  const pendingBids = bids.filter((row) => /pending|submitted|open/i.test(String(row.status ?? "")));
  const acceptedBids = bids.filter((row) => /accepted|approved|won/i.test(String(row.status ?? "")));
  const activeBookings = loads.filter((row) => /booked|confirmed|in_transit|assigned|active/i.test(String(row.status ?? "")));
  const confirmedToday = loads.filter(
    (row) =>
      /booked|confirmed/i.test(String(row.status ?? "")) &&
      String(row.created_at ?? "").slice(0, 10) === new Date().toISOString().slice(0, 10)
  );
  const mtdCommission = commissions
    .filter((row) => String(row.created_at ?? "") >= startOfMonth())
    .reduce((acc, row) => acc + Number(row.amount_gbp ?? 0), 0);
  const totalCommission = sumAmount(commissions);
  const loadVolume = loads.reduce((acc, row) => acc + Number(row.price ?? 0), 0);

  return {
    overview,
    chartSeries: buildLoadChartSeries(loads),
    sections: {
      leads: {
        metrics: [
          { label: "Open leads", value: String(openLeads.length) },
          { label: "Qualified (7d)", value: String(weekLeads.length) },
          { label: "Win rate", value: pct(wonLeads.length, leads.length || 1) },
          { label: "Pipeline value", value: fmtMoney(sumAmount(leads)) },
        ],
        rowColumns: [
          { key: "company_name", label: "Company" },
          { key: "contact_name", label: "Contact" },
          { key: "status", label: "Status" },
          { key: "value_gbp", label: "Value" },
        ],
        rows: leads.slice(0, 12).map((row) => ({
          company_name: row.company_name,
          contact_name: row.contact_name,
          status: row.status,
          value_gbp: row.value_gbp ? fmtMoney(Number(row.value_gbp)) : "—",
        })),
      },
      quotes: {
        metrics: [
          { label: "Open quotes", value: String(pendingBids.length) },
          { label: "Pending review", value: String(pendingBids.filter((row) => /review|pending/i.test(String(row.status))).length) },
          { label: "Accepted", value: String(acceptedBids.length) },
          { label: "Quote value", value: fmtMoney(sumAmount(bids)) },
        ],
        rowColumns: [
          { key: "load_id", label: "Load" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Sent" },
        ],
        rows: bids.slice(0, 12).map((row) => ({
          load_id: row.load_id?.slice(0, 8) ?? "—",
          amount: row.amount ? fmtMoney(Number(row.amount)) : "—",
          status: row.status,
          created_at: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "—",
        })),
      },
      bookings: {
        metrics: [
          { label: "Active bookings", value: String(activeBookings.length) },
          { label: "Confirmed today", value: String(confirmedToday.length) },
          { label: "Open loads", value: String(loads.filter((row) => /open|posted|available/i.test(String(row.status ?? ""))).length) },
          { label: "Booking value", value: fmtMoney(sumAmount(activeBookings)) },
        ],
        rowColumns: [
          { key: "route", label: "Route" },
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          { key: "price", label: "Price" },
        ],
        rows: activeBookings.slice(0, 12).map((row) => ({
          route: `${row.origin ?? "—"} → ${row.destination ?? "—"}`,
          title: row.title ?? "—",
          status: row.status,
          price: row.price ? fmtMoney(Number(row.price)) : "—",
        })),
      },
      tasks: {
        metrics: [
          { label: "Open tasks", value: String(openTasks.length) },
          { label: "Due today", value: String(dueTodayTasks.length) },
          { label: "Overdue", value: String(overdueTasks.length) },
          { label: "Completed", value: String(tasks.length - openTasks.length) },
        ],
        rowColumns: [
          { key: "title", label: "Task" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "due_date", label: "Due" },
        ],
        rows: openTasks.slice(0, 12).map((row) => ({
          title: row.title,
          priority: row.priority,
          status: row.status,
          due_date: row.due_date ?? "—",
        })),
      },
      revenue: {
        metrics: [
          { label: "Commission MTD", value: fmtMoney(mtdCommission) },
          { label: "Total earned", value: fmtMoney(totalCommission) },
          { label: "Pending", value: String(commissions.filter((row) => /pending/i.test(String(row.status ?? ""))).length) },
          { label: "Approved", value: String(commissions.filter((row) => /approved|paid/i.test(String(row.status ?? ""))).length) },
        ],
        rowColumns: [
          { key: "amount_gbp", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "period_month", label: "Period" },
          { key: "created_at", label: "Logged" },
        ],
        rows: commissions.slice(0, 12).map((row) => ({
          amount_gbp: fmtMoney(Number(row.amount_gbp ?? 0)),
          status: row.status,
          period_month: row.period_month ?? "—",
          created_at: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "—",
        })),
      },
      targets: emptySection(
        [
          { key: "metric", label: "KPI" },
          { key: "current", label: "Current" },
          { key: "target", label: "Target" },
          { key: "status", label: "Status" },
        ],
        [
          { label: "Active shippers", value: String(overview.shippers) },
          { label: "Active forwarders", value: String(overview.forwarders) },
          { label: "Loads posted", value: String(overview.loads) },
          { label: "Team size", value: String(overview.employees) },
        ]
      ),
      analytics: {
        metrics: [
          { label: "Active shippers", value: String(overview.shippers) },
          { label: "Active forwarders", value: String(overview.forwarders) },
          { label: "Load volume", value: fmtMoney(loadVolume) },
          { label: "Open leads", value: String(openLeads.length) },
        ],
        rowColumns: [
          { key: "segment", label: "Segment" },
          { key: "count", label: "Count" },
          { key: "note", label: "Note" },
        ],
        rows: [
          { segment: "Shippers", count: String(overview.shippers), note: "Supplier accounts" },
          { segment: "Forwarders", count: String(overview.forwarders), note: "Carrier accounts" },
          { segment: "Loads", count: String(overview.loads), note: "Marketplace posts" },
          { segment: "Leads", count: String(leads.length), note: "Sales pipeline" },
        ],
      },
      reports: emptySection(
        [
          { key: "report", label: "Report" },
          { key: "owner", label: "Owner" },
          { key: "frequency", label: "Frequency" },
          { key: "status", label: "Status" },
        ],
        [
          { label: "Open leads", value: String(openLeads.length) },
          { label: "Active bookings", value: String(activeBookings.length) },
          { label: "Open tasks", value: String(openTasks.length) },
          { label: "Commission MTD", value: fmtMoney(mtdCommission) },
        ]
      ),
      messages: emptySection(
        [
          { key: "subject", label: "Subject" },
          { key: "from", label: "From" },
          { key: "status", label: "Status" },
          { key: "time", label: "Time" },
        ],
        [
          { label: "Unread", value: "0" },
          { label: "Awaiting reply", value: "0" },
          { label: "Escalations", value: "0" },
          { label: "Resolved (7d)", value: "0" },
        ]
      ),
      notifications: {
        metrics: [
          { label: "Unread alerts", value: String(openTasks.length + openLeads.length) },
          { label: "Lead alerts", value: String(openLeads.length) },
          { label: "Booking alerts", value: String(activeBookings.length) },
          { label: "Task reminders", value: String(dueTodayTasks.length) },
        ],
        rowColumns: [
          { key: "alert", label: "Alert" },
          { key: "type", label: "Type" },
          { key: "priority", label: "Priority" },
          { key: "time", label: "Time" },
        ],
        rows: [
          ...openLeads.slice(0, 4).map((row) => ({
            alert: row.company_name,
            type: "Lead",
            priority: "Medium",
            time: "Today",
          })),
          ...dueTodayTasks.slice(0, 4).map((row) => ({
            alert: row.title,
            type: "Task",
            priority: row.priority ?? "Medium",
            time: "Due today",
          })),
        ],
      },
      settings: {
        metrics: [
          { label: "Profile status", value: "Active" },
          { label: "Role", value: "Commercial Director" },
          { label: "Banking controls", value: "Restricted" },
          { label: "Commission rates", value: "Restricted" },
        ],
        rowColumns: [
          { key: "setting", label: "Setting" },
          { key: "value", label: "Value" },
          { key: "scope", label: "Scope" },
          { key: "status", label: "Status" },
        ],
        rows: [
          { setting: "Banking controls", value: "Restricted", scope: "CEO/Admin", status: "Locked" },
          { setting: "Commission rates", value: "Restricted", scope: "CEO/Admin", status: "Locked" },
          { setting: "System settings", value: "Restricted", scope: "CEO/Admin", status: "Locked" },
        ],
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function buildCommercialMetrics(
  db: SupabaseClient
): Promise<{ body: CommercialMetricsPayload; headers: Record<string, string> }> {
  const [
    suppliers,
    carriers,
    loadsCountRes,
    employeesCountRes,
    loadsRes,
    leadsRes,
    tasksRes,
    bidsRes,
    commissionsRes,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "supplier"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "carrier"),
    db.from("loads").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employee"),
    db
      .from("loads")
      .select("id, origin, destination, status, price, created_at, title")
      .order("created_at", { ascending: false })
      .limit(120),
    db
      .from("employee_leads")
      .select("id, company_name, contact_name, status, value_gbp, created_at")
      .order("created_at", { ascending: false })
      .limit(120),
    db
      .from("employee_tasks")
      .select("id, title, status, priority, due_date, created_at")
      .order("created_at", { ascending: false })
      .limit(120),
    db
      .from("bids")
      .select("id, load_id, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(120),
    db
      .from("employee_commissions")
      .select("id, amount_gbp, status, period_month, created_at")
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  const body = buildCommercialMetricsFromRows({
    overview: {
      shippers: suppliers.count ?? 0,
      forwarders: carriers.count ?? 0,
      loads: loadsCountRes.count ?? safeCount(loadsRes.data),
      employees: employeesCountRes.count ?? 0,
    },
    loads: loadsRes.data ?? [],
    leads: leadsRes.error ? [] : (leadsRes.data ?? []),
    tasks: tasksRes.error ? [] : (tasksRes.data ?? []),
    bids: bidsRes.error ? [] : (bidsRes.data ?? []),
    commissions: commissionsRes.error ? [] : (commissionsRes.data ?? []),
  });

  return { body, headers: CACHE_HEADERS };
}
