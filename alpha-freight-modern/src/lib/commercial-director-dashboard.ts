import type { ChartPoint } from "@/lib/air-dashboard";
import { commercialDirectorRoute } from "@/lib/commercial-director-path";
import type { CommercialMetricsPayload } from "@/lib/commercial-director-metrics";

export type CommercialOverviewStats = {
  shippers: number;
  forwarders: number;
  loads: number;
  employees: number;
};

export type CommercialTool = {
  name: string;
  description: string;
  path: string;
  category: string;
  badge?: string;
};

export type CommercialActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone?: "sky" | "emerald" | "amber" | "slate";
};

export function getCommercialChartData(metrics?: CommercialMetricsPayload | null): ChartPoint[] {
  return metrics?.chartSeries ?? [];
}

export function getCommercialTools(): CommercialTool[] {
  return [
    {
      category: "Commercial",
      name: "Leads & Sales",
      description: "Pipeline, follow-ups, and conversion tracking.",
      path: commercialDirectorRoute("/leads"),
    },
    {
      category: "Network",
      name: "Shippers",
      description: "Registered shipper accounts and profiles.",
      path: commercialDirectorRoute("/shippers"),
    },
    {
      category: "Network",
      name: "Freight Forwarders",
      description: "Carrier and forwarder directory overview.",
      path: commercialDirectorRoute("/forwarders"),
    },
    {
      category: "Operations",
      name: "Loads",
      description: "Marketplace load activity and lane demand.",
      path: commercialDirectorRoute("/loads"),
    },
    {
      category: "Team",
      name: "Employees",
      description: "Commercial team roster and assignments.",
      path: commercialDirectorRoute("/employees"),
    },
    {
      category: "Performance",
      name: "Revenue Tasks",
      description: "Daily plan + AI tasks · tick or dismiss.",
      path: commercialDirectorRoute("/tasks"),
      badge: "Daily",
    },
    {
      category: "Performance",
      name: "Revenue Command Center",
      description: "44 streams · monthly plan · actions · targets.",
      path: commercialDirectorRoute("/revenue-plan"),
      badge: "44 streams",
    },
    {
      category: "Performance",
      name: "Revenue view",
      description: "Read-only revenue and commission insights.",
      path: commercialDirectorRoute("/revenue"),
      badge: "View only",
    },
    {
      category: "Performance",
      name: "Targets",
      description: "KPIs and attainment against goals.",
      path: commercialDirectorRoute("/targets"),
    },
    {
      category: "Reporting",
      name: "Analytics",
      description: "Growth trends and commercial intelligence.",
      path: commercialDirectorRoute("/analytics"),
    },
    {
      category: "Reporting",
      name: "Reports",
      description: "Executive summaries for leadership reviews.",
      path: commercialDirectorRoute("/reports"),
    },
  ];
}

export function getCommercialActivity(
  stats: CommercialOverviewStats | undefined,
  metrics?: CommercialMetricsPayload | null
): CommercialActivityItem[] {
  const openLeads = Number(metrics?.sections.leads?.metrics?.[0]?.value ?? 0);
  const openTasks = Number(metrics?.sections.tasks?.metrics?.[0]?.value ?? 0);
  const dueToday = Number(metrics?.sections.tasks?.metrics?.[1]?.value ?? 0);

  const items: CommercialActivityItem[] = [
    {
      id: "network",
      title: "Network snapshot refreshed",
      detail: `${stats?.shippers ?? 0} shippers · ${stats?.forwarders ?? 0} forwarders · ${stats?.loads ?? 0} loads`,
      time: "Just now",
      tone: "sky",
    },
    {
      id: "team",
      title: "Commercial team roster",
      detail: `${stats?.employees ?? 0} employees on the Alpha Freight roster`,
      time: "Today",
      tone: "emerald",
    },
  ];

  if (openLeads > 0) {
    items.push({
      id: "leads",
      title: "Open leads",
      detail: `${openLeads} lead${openLeads === 1 ? "" : "s"} waiting for follow-up`,
      time: "Live",
      tone: "amber",
    });
  }

  if (openTasks > 0) {
    items.push({
      id: "tasks",
      title: "Open employee tasks",
      detail: `${openTasks} open task${openTasks === 1 ? "" : "s"}${dueToday > 0 ? ` · ${dueToday} due today` : ""}`,
      time: "Live",
      tone: "slate",
    });
  }

  return items;
}

export function getCommercialFocusItems(metrics?: CommercialMetricsPayload | null): string[] {
  const openLeads = Number(metrics?.sections.leads?.metrics?.[0]?.value ?? 0);
  const openTasks = Number(metrics?.sections.tasks?.metrics?.[0]?.value ?? 0);
  const overdueTasks = Number(metrics?.sections.tasks?.metrics?.[2]?.value ?? 0);
  const pendingQuotes = Number(metrics?.sections.quotes?.metrics?.[0]?.value ?? 0);

  const items = [
    openLeads > 0 ? `${openLeads} open lead${openLeads === 1 ? "" : "s"} need follow-up.` : null,
    pendingQuotes > 0 ? `${pendingQuotes} quote${pendingQuotes === 1 ? "" : "s"} still pending review.` : null,
    openTasks > 0 ? `${openTasks} employee task${openTasks === 1 ? "" : "s"} remain open.` : null,
    overdueTasks > 0 ? `${overdueTasks} task${overdueTasks === 1 ? "" : "s"} overdue.` : null,
  ].filter(Boolean) as string[];

  return items.length > 0 ? items : ["No open commercial actions right now."];
}
