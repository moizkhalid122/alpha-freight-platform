import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  CircleDollarSign,
  ClipboardList,
  FileBarChart,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Plane,
  Settings,
  Target,
  TrendingUp,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { commercialDirectorRoute } from "@/lib/commercial-director-path";

export type CommercialDirectorNavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  description?: string;
};

export type CommercialDirectorNavSection = {
  label: string;
  items: CommercialDirectorNavItem[];
};

export const COMMERCIAL_DIRECTOR_NAV: CommercialDirectorNavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", path: commercialDirectorRoute(), icon: LayoutDashboard },
      {
        name: "Tasks",
        path: commercialDirectorRoute("/tasks"),
        icon: Briefcase,
        description: "Daily AI tasks · sales · deals · funding",
      },
    ],
  },
  {
    label: "COMMERCIAL",
    items: [
      { name: "Leads & Sales", path: commercialDirectorRoute("/leads"), icon: TrendingUp },
      { name: "Shippers", path: commercialDirectorRoute("/shippers"), icon: Building2 },
      { name: "Freight Forwarders", path: commercialDirectorRoute("/forwarders"), icon: Truck },
      { name: "Loads", path: commercialDirectorRoute("/loads"), icon: ClipboardList },
      { name: "Quotes", path: commercialDirectorRoute("/quotes"), icon: FileBarChart },
      { name: "Bookings", path: commercialDirectorRoute("/bookings"), icon: CalendarCheck },
    ],
  },
  {
    label: "TEAM",
    items: [
      { name: "Employees", path: commercialDirectorRoute("/employees"), icon: Users },
    ],
  },
  {
    label: "PERFORMANCE",
    items: [
      {
        name: "Revenue Command Center",
        path: commercialDirectorRoute("/revenue-plan"),
        icon: Layers,
        description: "44 streams · plan · actions · monthly targets",
      },
      {
        name: "Revenue & Commissions",
        path: commercialDirectorRoute("/revenue"),
        icon: CircleDollarSign,
        description: "View only — no payout controls",
      },
      { name: "Targets", path: commercialDirectorRoute("/targets"), icon: Target },
      { name: "Analytics", path: commercialDirectorRoute("/analytics"), icon: BarChart3 },
      { name: "Reports", path: commercialDirectorRoute("/reports"), icon: FileBarChart },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { name: "Messages", path: commercialDirectorRoute("/messages"), icon: MessageSquare },
      { name: "Notifications", path: commercialDirectorRoute("/notifications"), icon: Bell },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { name: "Profile & Settings", path: commercialDirectorRoute("/settings"), icon: Settings },
    ],
  },
];

/** Paths that must never be exposed in the Commercial Director panel. */
export const COMMERCIAL_DIRECTOR_RESTRICTED_SEGMENTS = [
  "banking",
  "payments",
  "payouts",
  "refunds",
  "settings/system",
  "settings/api",
  "settings/commission",
  "settings/security",
  "users/delete",
  "database",
] as const;

export function isCommercialDirectorRestrictedPath(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return COMMERCIAL_DIRECTOR_RESTRICTED_SEGMENTS.some((segment) =>
    normalized.includes(`/${segment}`)
  );
}

export type CommercialSectionConfig = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  highlights: string[];
};

export const COMMERCIAL_SECTION_CONFIG: Record<string, CommercialSectionConfig> = {
  leads: {
    slug: "leads",
    eyebrow: "Leads & Sales",
    title: "Pipeline and conversion control",
    description:
      "Track inbound shipper and forwarder leads, assign follow-ups, and monitor sales momentum across the Alpha Freight network.",
    metrics: [
      { label: "Open leads", value: "—" },
      { label: "Qualified this week", value: "—" },
      { label: "Win rate", value: "—" },
      { label: "Avg. response time", value: "—" },
    ],
    highlights: [
      "Review new shipper and forwarder enquiries before they enter the marketplace.",
      "Assign leads to employees and set follow-up tasks with due dates.",
      "Monitor conversion from lead → quote → booking without touching payout controls.",
    ],
  },
  quotes: {
    slug: "quotes",
    eyebrow: "Quotes",
    title: "Commercial quote workspace",
    description: "Prepare, review, and approve lane quotes for shippers and forwarders.",
    metrics: [
      { label: "Open quotes", value: "—" },
      { label: "Pending approval", value: "—" },
      { label: "Accepted (30d)", value: "—" },
      { label: "Avg. quote value", value: "—" },
    ],
    highlights: [
      "Compare lane pricing against historical performance.",
      "Share quotes with shippers while keeping commission rates locked to CEO/Admin.",
      "Convert accepted quotes into bookings in one workflow.",
    ],
  },
  bookings: {
    slug: "bookings",
    eyebrow: "Bookings",
    title: "Confirmed commercial bookings",
    description: "Monitor confirmed bookings across road and air lanes without payment execution access.",
    metrics: [
      { label: "Active bookings", value: "—" },
      { label: "Confirmed today", value: "—" },
      { label: "At risk", value: "—" },
      { label: "On-time rate", value: "—" },
    ],
    highlights: [
      "View booking status from confirmation through delivery.",
      "Escalate operational issues to the ops team.",
      "No access to banking, payouts, or Stripe controls.",
    ],
  },
  tasks: {
    slug: "tasks",
    eyebrow: "Tasks & Follow-ups",
    title: "Daily revenue tasks",
    description:
      "Today's tasks from the 44 Revenue System — plan seed, OpenAI suggestions, tick complete or dismiss.",
    metrics: [
      { label: "Open tasks", value: "—" },
      { label: "Due today", value: "—" },
      { label: "Overdue", value: "—" },
      { label: "Completed (7d)", value: "—" },
    ],
    highlights: [
      "Auto-loaded daily tasks from the revenue plan and 44 streams.",
      "OpenAI generates extra tasks based on monthly revenue targets.",
      "Tick ✓ to complete or ✕ to dismiss — progress tracked live.",
      "Add manual tasks or reset from plan any time.",
    ],
  },
  revenue: {
    slug: "revenue",
    eyebrow: "Revenue & Commissions",
    title: "Performance view — read only",
    description:
      "Review revenue and commission outcomes for commercial planning. Payout execution and rate configuration remain with CEO/Admin.",
    metrics: [
      { label: "Revenue MTD", value: "—" },
      { label: "Commission earned", value: "—" },
      { label: "Top lane", value: "—" },
      { label: "Team attainment", value: "—" },
    ],
    highlights: [
      "View commission totals and team performance — no payout buttons.",
      "Cannot edit commission rates or release settlements.",
      "Export summaries for board and target reviews.",
      "Use Revenue Command Center for the full 44-stream plan and monthly actions.",
    ],
  },
  "revenue-plan": {
    slug: "revenue-plan",
    eyebrow: "44 Revenue System",
    title: "Revenue Command Center",
    description:
      "Execute the 44-stream strategy — monthly targets, sales actions, product launches, and progress vs plan.",
    metrics: [
      { label: "This month target", value: "—" },
      { label: "Revenue MTD", value: "—" },
      { label: "Streams live", value: "—" },
      { label: "M12 run-rate", value: "—" },
    ],
    highlights: [
      "All 44 revenue streams with this-month and M12 targets.",
      "Auto-generated sales, product, and KPI actions for the current plan month.",
      "12-month roadmap and daily effort checklist.",
      "Progress tracked against commission MTD from live data.",
    ],
  },
  targets: {
    slug: "targets",
    eyebrow: "Targets",
    title: "Commercial targets & KPIs",
    description: "Set and monitor team targets for leads, bookings, and revenue attainment.",
    metrics: [
      { label: "Monthly target", value: "—" },
      { label: "Progress", value: "—" },
      { label: "Team on track", value: "—" },
      { label: "Gap to target", value: "—" },
    ],
    highlights: [
      "Track employee and team KPIs against commercial goals.",
      "Align sales activity with quarterly growth plans.",
      "Escalate underperformance without changing system commission rules.",
    ],
  },
  analytics: {
    slug: "analytics",
    eyebrow: "Analytics",
    title: "Commercial intelligence",
    description: "Lane demand, conversion trends, and customer growth analytics for strategic decisions.",
    metrics: [
      { label: "Active shippers", value: "—" },
      { label: "Active forwarders", value: "—" },
      { label: "Load volume trend", value: "—" },
      { label: "Retention", value: "—" },
    ],
    highlights: [
      "Analyse shipper and forwarder growth by region.",
      "Identify high-performing lanes and under-served corridors.",
      "No access to company banking or treasury analytics.",
    ],
  },
  reports: {
    slug: "reports",
    eyebrow: "Reports",
    title: "Executive commercial reports",
    description: "Generate weekly and monthly reports for leadership reviews.",
    metrics: [
      { label: "Scheduled reports", value: "—" },
      { label: "Last export", value: "—" },
      { label: "Custom views", value: "—" },
      { label: "Shared with CEO", value: "—" },
    ],
    highlights: [
      "Export commercial summaries for leadership meetings.",
      "Combine leads, bookings, and team performance in one view.",
      "Financial settlement reports remain admin-only.",
    ],
  },
  messages: {
    slug: "messages",
    eyebrow: "Messages",
    title: "Commercial inbox",
    description: "Central messages with shippers, forwarders, and internal team members.",
    metrics: [
      { label: "Unread", value: "—" },
      { label: "Awaiting reply", value: "—" },
      { label: "Escalations", value: "—" },
      { label: "Resolved (7d)", value: "—" },
    ],
    highlights: [
      "Respond to shipper and forwarder enquiries from one inbox.",
      "Loop in employees on active deals.",
      "No system or security message classes exposed here.",
    ],
  },
  notifications: {
    slug: "notifications",
    eyebrow: "Notifications",
    title: "Alerts & activity feed",
    description: "Commercial alerts for new leads, bookings, tasks, and team updates.",
    metrics: [
      { label: "Unread alerts", value: "—" },
      { label: "Lead alerts", value: "—" },
      { label: "Booking alerts", value: "—" },
      { label: "Task reminders", value: "—" },
    ],
    highlights: [
      "Stay ahead of new leads and booking confirmations.",
      "Receive task due-date reminders for your team.",
      "Payment and payout alerts are intentionally excluded.",
    ],
  },
  settings: {
    slug: "settings",
    eyebrow: "Profile & Settings",
    title: "Your commercial profile",
    description:
      "Update your profile, notification preferences, and display settings. System, security, and financial controls are not available here.",
    metrics: [
      { label: "Profile status", value: "Active" },
      { label: "Role", value: "Commercial Director" },
      { label: "2FA", value: "—" },
      { label: "Last login", value: "—" },
    ],
    highlights: [
      "Edit your name, contact details, and notification preferences.",
      "Cannot delete users, rotate API keys, or change commission rates.",
      "For banking or system changes, contact the CEO/Admin team.",
    ],
  },
};

export const COMMERCIAL_DIRECTOR_PROFILE = {
  name: "Alastair James Massey",
  title: "Commercial Director",
  email: "alastair@alphafreightuk.com",
};

export const COMMERCIAL_RESTRICTED_NOTICE =
  "Restricted: banking, payouts, commission-rate configuration, user deletion, API keys, and system controls remain with CEO/Admin only.";

/** Icons for directory pages */
export const DIRECTORY_ICONS = {
  shippers: Building2,
  forwarders: Truck,
  loads: ClipboardList,
  employees: UserCog,
  air: Plane,
};
