import AdminSectionPage from "@/components/admin/AdminSectionPage";

const pageContent: Record<
  string,
  {
    eyebrow: string;
    title: string;
    description: string;
    metrics: { label: string; value: string }[];
    highlights: string[];
    relatedLinks?: Array<{ label: string; href: string }>;
  }
> = {
  "quick-stats": {
    eyebrow: "Quick Stats",
    title: "Track weekly growth and pending review pressure",
    description:
      "Use this surface to keep a fast executive snapshot of new carriers, supplier growth, and verification backlog.",
    metrics: [
      { label: "New carriers", value: "46" },
      { label: "New suppliers", value: "29" },
      { label: "Pending checks", value: "18" },
      { label: "Loads today", value: "194" },
    ],
    highlights: [
      "Review the verification queue before the next payout cycle.",
      "Watch supplier growth against active carrier coverage in each lane.",
      "Keep backlog below the target threshold for same-day approval.",
    ],
    relatedLinks: [
      { label: "Open carriers", href: "/admin/carriers" },
      { label: "Open suppliers", href: "/admin/suppliers" },
    ],
  },
  "carriers": {
    eyebrow: "Carrier Management",
    title: "Manage all carriers across compliance, performance, and payouts",
    description:
      "This section is the primary control layer for reviewing registered carriers, approval health, and delivery quality.",
    metrics: [
      { label: "Total carriers", value: "2,480" },
      { label: "Verified", value: "1,982" },
      { label: "Pending", value: "54" },
      { label: "Rejected", value: "19" },
    ],
    highlights: [
      "Prioritize pending verification and document expiry checks.",
      "Monitor high-performing carriers for premium routing opportunities.",
      "Keep payout readiness aligned with carrier compliance status.",
    ],
    relatedLinks: [
      { label: "Pending verification", href: "/admin/carriers/pending-verifications" },
      { label: "Carrier performance", href: "/admin/carriers/performance" },
    ],
  },
  "carriers/add": {
    eyebrow: "Add Carrier",
    title: "Create a new manual carrier profile",
    description:
      "Operations can register carriers directly here when onboarding happens outside the self-serve flow.",
    metrics: [
      { label: "Manual additions", value: "12 this month" },
      { label: "Fast-track reviews", value: "6" },
      { label: "Pending docs", value: "4" },
      { label: "Avg. onboarding", value: "18 min" },
    ],
    highlights: [
      "Capture company identity and compliance data in one flow.",
      "Link payout details only after verification passes.",
      "Use this workflow for assisted onboarding and support escalations.",
    ],
  },
  "carriers/pending-verifications": {
    eyebrow: "Pending Verification",
    title: "Review identity, insurance, and carrier documents",
    description:
      "This queue helps the compliance team clear pending registrations and keep the marketplace trusted.",
    metrics: [
      { label: "Open reviews", value: "18" },
      { label: "Insurance checks", value: "7" },
      { label: "ID mismatches", value: "3" },
      { label: "SLA target", value: "Under 2h" },
    ],
    highlights: [
      "Work oldest requests first to keep approval times consistent.",
      "Escalate missing insurance before dispatch access is granted.",
      "Keep manual overrides logged for audit review.",
    ],
  },
  "carriers/verified": {
    eyebrow: "Verified Carriers",
    title: "View approved carriers with marketplace-ready status",
    description:
      "Verified carriers can receive premium load distribution, fast payouts, and stronger matching priority.",
    metrics: [
      { label: "Verified carriers", value: "1,982" },
      { label: "Top tier", value: "218" },
      { label: "On-time rate", value: "96.4%" },
      { label: "Avg. rating", value: "4.8/5" },
    ],
    highlights: [
      "Promote high-performing fleets into premium routing programs.",
      "Watch for document expiry to avoid silent risk exposure.",
      "Use verified profiles as a benchmark for onboarding quality.",
    ],
  },
  "carriers/performance": {
    eyebrow: "Carrier Performance",
    title: "Monitor ratings, completion rate, and on-time delivery",
    description:
      "Performance analytics keep service quality visible across every fleet, lane, and customer relationship.",
    metrics: [
      { label: "Avg. rating", value: "4.8/5" },
      { label: "Completed loads", value: "8,924" },
      { label: "On-time rate", value: "96.4%" },
      { label: "Risk watchlist", value: "11" },
    ],
    highlights: [
      "Use performance data to influence smart matching rules.",
      "Flag delivery slippage before it affects supplier trust.",
      "Identify top fleets for strategic growth partnerships.",
    ],
  },
  "carriers/payments": {
    eyebrow: "Carrier Payments",
    title: "Track payout history and pending carrier settlements",
    description:
      "Finance and operations can use this section to reduce payout friction and monitor release schedules.",
    metrics: [
      { label: "Pending payouts", value: "GBP 12.4K" },
      { label: "Released today", value: "GBP 18.4K" },
      { label: "On hold", value: "4" },
      { label: "Avg. clearance", value: "1.8 days" },
    ],
    highlights: [
      "Review mismatched bank details before batch release.",
      "Link payout readiness to verification health.",
      "Keep failed withdrawal attempts visible for support.",
    ],
  },
  "suppliers": {
    eyebrow: "Supplier Management",
    title: "Manage all suppliers, their activity, and payment flow",
    description:
      "This section covers demand-side control, load generation, invoice status, and account health.",
    metrics: [
      { label: "Total suppliers", value: "1,140" },
      { label: "Active 30 days", value: "824" },
      { label: "New this week", value: "29" },
      { label: "Open invoices", value: "46" },
    ],
    highlights: [
      "Track high-volume shippers for retention and support.",
      "Connect supplier activity with live load supply levels.",
      "Use invoice patterns to surface finance risk early.",
    ],
    relatedLinks: [
      { label: "Active suppliers", href: "/admin/suppliers/active" },
      { label: "Supplier loads", href: "/admin/suppliers/loads" },
    ],
  },
  "suppliers/add": {
    eyebrow: "Add Supplier",
    title: "Create a supplier profile through manual onboarding",
    description:
      "Support or sales teams can add supplier accounts directly when onboarding happens through assisted channels.",
    metrics: [
      { label: "Manual supplier adds", value: "8" },
      { label: "KYC review", value: "3" },
      { label: "Saved templates", value: "14" },
      { label: "Avg. setup", value: "11 min" },
    ],
    highlights: [
      "Capture billing and company details in one pass.",
      "Attach invoice preferences before first posting.",
      "Use assisted onboarding for enterprise suppliers.",
    ],
  },
  "suppliers/active": {
    eyebrow: "Active Suppliers",
    title: "Review suppliers with recent marketplace activity",
    description:
      "Active supplier monitoring helps operations understand demand consistency and key shipper health.",
    metrics: [
      { label: "Active suppliers", value: "824" },
      { label: "Posting this week", value: "312" },
      { label: "High-value accounts", value: "88" },
      { label: "Avg. weekly loads", value: "5.3" },
    ],
    highlights: [
      "Surface top demand accounts for account management follow-up.",
      "Track changes in posting behavior before churn happens.",
      "Map activity concentration across priority lanes.",
    ],
  },
  "suppliers/loads": {
    eyebrow: "Supplier Loads",
    title: "See load creation volume per supplier account",
    description:
      "Use supplier load analytics to spot growth, inactivity, and operational bottlenecks from the demand side.",
    metrics: [
      { label: "Loads this week", value: "1,286" },
      { label: "Enterprise accounts", value: "114" },
      { label: "Repeat suppliers", value: "68%" },
      { label: "Avg. fill time", value: "42 min" },
    ],
    highlights: [
      "Spot suppliers who create volume but convert poorly.",
      "Review fill-time performance by account and lane.",
      "Use this section to support retention and account expansion.",
    ],
  },
  "suppliers/payments": {
    eyebrow: "Supplier Payments",
    title: "Manage supplier invoices, outstanding balances, and payment history",
    description:
      "Finance can use this section to watch invoice quality, collection pace, and spend concentration.",
    metrics: [
      { label: "Open invoices", value: "46" },
      { label: "Outstanding", value: "GBP 28.9K" },
      { label: "Paid today", value: "GBP 14.2K" },
      { label: "Invoice SLA", value: "Same day" },
    ],
    highlights: [
      "Keep outstanding balances visible by supplier segment.",
      "Escalate delayed invoices before dispatch risk increases.",
      "Track invoice quality to support premium shipper service.",
    ],
  },
  "loads/available": {
    eyebrow: "Available Loads",
    title: "Monitor loads waiting for carrier matching",
    description:
      "This section helps operations understand supply-demand balance before a shipment is assigned.",
    metrics: [
      { label: "Available loads", value: "214" },
      { label: "Avg. age", value: "26 min" },
      { label: "Hot lanes", value: "8" },
      { label: "Urgent", value: "17" },
    ],
    highlights: [
      "Watch ageing loads to avoid delayed assignment.",
      "Use lane pressure to inform pricing and matching.",
      "Keep urgent supplier demand in the first review lane.",
    ],
  },
  "loads/matched": {
    eyebrow: "Matched Loads",
    title: "Track loads already assigned to carriers",
    description:
      "Matched load monitoring helps operations spot dispatch quality and assignment efficiency.",
    metrics: [
      { label: "Matched today", value: "194" },
      { label: "Avg. match time", value: "14 min" },
      { label: "Reassigned", value: "9" },
      { label: "Premium matches", value: "41" },
    ],
    highlights: [
      "Monitor match quality across load value and distance.",
      "Review reassignment reasons to refine recommendation rules.",
      "Track premium carrier allocation against service KPIs.",
    ],
  },
  "loads/in-transit": {
    eyebrow: "In-Transit Loads",
    title: "Watch active shipments currently on the road",
    description:
      "Use this section to monitor movement, delay signals, and customer risk while freight is live.",
    metrics: [
      { label: "In transit", value: "386" },
      { label: "Delayed", value: "14" },
      { label: "On time", value: "96%" },
      { label: "Escalations", value: "5" },
    ],
    highlights: [
      "Keep shipment alerts visible for supplier communication.",
      "Use tracking events to detect lane-specific delay patterns.",
      "Coordinate support quickly when ETA shifts.",
    ],
  },
  "loads/completed": {
    eyebrow: "Completed Loads",
    title: "Review delivered and closed shipment history",
    description:
      "Completed load history supports payout accuracy, supplier billing, and performance measurement.",
    metrics: [
      { label: "Completed", value: "8,924" },
      { label: "Closed today", value: "112" },
      { label: "POD complete", value: "98%" },
      { label: "Disputes", value: "13" },
    ],
    highlights: [
      "Link completed loads directly into settlement and invoicing.",
      "Monitor POD completion quality across fleets.",
      "Keep dispute frequency low through cleaner closure rules.",
    ],
  },
  "loads/ai-matching": {
    eyebrow: "AI Matching",
    title: "Optimize load-to-carrier assignment with smart matching",
    description:
      "This area is designed for ranking match quality, load fit, and high-confidence routing decisions.",
    metrics: [
      { label: "Suggested matches", value: "164" },
      { label: "High confidence", value: "87%" },
      { label: "Manual overrides", value: "9" },
      { label: "Time saved", value: "31%" },
    ],
    highlights: [
      "Use smart matching to reduce assignment time on hot lanes.",
      "Audit manual overrides to refine recommendation quality.",
      "Feed performance outcomes back into ranking logic.",
    ],
  },
  "finance/carrier-payouts": {
    eyebrow: "Carrier Payouts",
    title: "Manage money flowing back to carriers",
    description:
      "Carrier payouts bring finance, compliance, and shipment completion into one release workflow.",
    metrics: [
      { label: "Pending payout", value: "GBP 12.4K" },
      { label: "Released today", value: "GBP 18.4K" },
      { label: "Held", value: "4" },
      { label: "Exceptions", value: "2" },
    ],
    highlights: [
      "Check completion and verification before payout release.",
      "Review held payouts caused by banking mismatches.",
      "Keep payout aging under the finance SLA target.",
    ],
  },
  "finance/supplier-invoices": {
    eyebrow: "Supplier Invoices",
    title: "Track invoices raised to suppliers",
    description:
      "This page supports invoice accuracy, collection speed, and supplier finance visibility.",
    metrics: [
      { label: "Invoices open", value: "46" },
      { label: "Raised today", value: "19" },
      { label: "Overdue", value: "7" },
      { label: "Collected", value: "GBP 14.2K" },
    ],
    highlights: [
      "Prioritize overdue invoices with high-value suppliers.",
      "Use invoice visibility to support account management.",
      "Keep finance reporting aligned with shipment completion.",
    ],
  },
  "finance/transactions": {
    eyebrow: "Transaction History",
    title: "Review the full finance trail across the platform",
    description:
      "A clean transaction history makes disputes, settlements, and reconciliation much easier to handle.",
    metrics: [
      { label: "Transactions today", value: "182" },
      { label: "Success rate", value: "98.8%" },
      { label: "Exceptions", value: "5" },
      { label: "Reconciled", value: "GBP 64K" },
    ],
    highlights: [
      "Keep every payout, invoice, and adjustment traceable.",
      "Use exception monitoring to catch finance issues early.",
      "Support audit-readiness with a full transaction trail.",
    ],
  },
  "finance/commission-report": {
    eyebrow: "Commission Report",
    title: "Measure commission earned per shipment and account segment",
    description:
      "Commission reporting helps finance understand profitability by lane, customer mix, and shipment volume.",
    metrics: [
      { label: "Avg. commission", value: "12%" },
      { label: "This week", value: "GBP 18.8K" },
      { label: "Top lane", value: "Manchester to London" },
      { label: "Margin watch", value: "9 loads" },
    ],
    highlights: [
      "Track margin pressure before high-volume lanes weaken.",
      "Compare supplier segments against earned commission quality.",
      "Use this page to support pricing refinement.",
    ],
  },
  "finance/revenue": {
    eyebrow: "Revenue Dashboard",
    title: "See total revenue, pending clearance, and cleared earnings",
    description:
      "This finance dashboard is built for quick executive review across cleared, pending, and outstanding value.",
    metrics: [
      { label: "Revenue today", value: "GBP 84K" },
      { label: "Pending", value: "GBP 12.4K" },
      { label: "Cleared", value: "GBP 71.6K" },
      { label: "Collection rate", value: "96.1%" },
    ],
    highlights: [
      "Keep pending value low and predictable through the day.",
      "Link revenue movement to invoice and payout events.",
      "Use this dashboard for fast finance snapshot reviews.",
    ],
  },
  "analytics/carriers": {
    eyebrow: "Carrier Analytics",
    title: "Understand carrier onboarding, retention, and performance trends",
    description:
      "Carrier analytics help you improve service quality, growth, and operational consistency over time.",
    metrics: [
      { label: "Onboarding rate", value: "+8.2%" },
      { label: "Retention", value: "78%" },
      { label: "Top performer score", value: "96%" },
      { label: "At-risk fleets", value: "11" },
    ],
    highlights: [
      "Track retention after initial verification completion.",
      "Use trend visibility to improve carrier support timing.",
      "Compare performance quality across regions and fleet types.",
    ],
  },
  "analytics/suppliers": {
    eyebrow: "Supplier Analytics",
    title: "Analyze supplier posting trends and spend behavior",
    description:
      "Supplier analytics give better visibility into posting patterns, spend concentration, and repeat demand.",
    metrics: [
      { label: "Posting growth", value: "+12%" },
      { label: "Repeat shippers", value: "68%" },
      { label: "Spend concentration", value: "Top 10 = 41%" },
      { label: "Dormant accounts", value: "57" },
    ],
    highlights: [
      "Watch supplier behavior for churn or expansion signals.",
      "Use spend insights to prioritize account management effort.",
      "Track posting consistency by week and lane cluster.",
    ],
  },
  "analytics/loads": {
    eyebrow: "Load Analytics",
    title: "Measure volume by lane, shipment type, and seasonality",
    description:
      "Load analytics help align carrier capacity with demand and identify pressure points in the network.",
    metrics: [
      { label: "Weekly volume", value: "1,286" },
      { label: "Hot lanes", value: "8" },
      { label: "Avg. fill time", value: "42 min" },
      { label: "Seasonal delta", value: "+14%" },
    ],
    highlights: [
      "Compare lane demand against available fleet capacity.",
      "Use seasonality to plan proactive supply coverage.",
      "Track matching efficiency by shipment type and urgency.",
    ],
  },
  "analytics/financial-reports": {
    eyebrow: "Financial Reports",
    title: "Review revenue, commission, and profit visibility",
    description:
      "Financial reporting supports executive review, reconciliation, and strategic pricing decisions.",
    metrics: [
      { label: "Gross revenue", value: "GBP 84K" },
      { label: "Commission", value: "GBP 18.8K" },
      { label: "Profit trend", value: "+7.4%" },
      { label: "Outstanding", value: "GBP 28.9K" },
    ],
    highlights: [
      "Track profitability by lane and supplier segment.",
      "Keep commission and payout logic aligned with operations.",
      "Use report visibility for better finance forecasting.",
    ],
  },
  "analytics/custom-reports": {
    eyebrow: "Custom Reports",
    title: "Prepare export-ready operational and finance reports",
    description:
      "Custom report generation is where filtered operational data will be packaged for PDF and spreadsheet export.",
    metrics: [
      { label: "Saved templates", value: "14" },
      { label: "Exports this week", value: "32" },
      { label: "Finance packs", value: "9" },
      { label: "Ops reports", value: "23" },
    ],
    highlights: [
      "Create filtered exports for finance, ops, and support teams.",
      "Use saved templates for repeat executive reporting.",
      "Keep cross-team visibility high without manual data prep.",
    ],
  },
  "users/admins": {
    eyebrow: "Admins",
    title: "Manage internal team members with admin access",
    description:
      "Internal admin control helps keep permissions structured across operations, support, and finance teams.",
    metrics: [
      { label: "Admin users", value: "12" },
      { label: "Ops team", value: "5" },
      { label: "Finance team", value: "3" },
      { label: "Support team", value: "4" },
    ],
    highlights: [
      "Segment admin access by clear operational function.",
      "Review account ownership for shared workflows.",
      "Keep inactive admin accounts out of production access.",
    ],
  },
  "users/roles": {
    eyebrow: "Role Management",
    title: "Control permissions for super admin, operations, finance, and support",
    description:
      "Role management helps keep sensitive workflows available only to the teams that need them.",
    metrics: [
      { label: "Defined roles", value: "4" },
      { label: "Custom overrides", value: "2" },
      { label: "Restricted routes", value: "18" },
      { label: "Audit review", value: "Ready" },
    ],
    highlights: [
      "Separate finance and compliance actions from support actions.",
      "Keep route permissions clean for audit visibility.",
      "Reduce risk by avoiding over-shared access.",
    ],
  },
  "users/activity-log": {
    eyebrow: "Activity Log",
    title: "Track the audit trail across admin and platform users",
    description:
      "Activity logs are essential for tracing decisions, finance actions, and operational overrides.",
    metrics: [
      { label: "Events today", value: "1,842" },
      { label: "Finance actions", value: "64" },
      { label: "Approval actions", value: "28" },
      { label: "Retention", value: "90 days" },
    ],
    highlights: [
      "Use the log to investigate approval and payout decisions.",
      "Keep high-risk actions visible and attributable.",
      "Support audit and internal accountability workflows.",
    ],
  },
  "settings/commission": {
    eyebrow: "Commission Settings",
    title: "Manage the default marketplace commission model",
    description:
      "Commission control affects pricing, finance visibility, and route profitability across the marketplace.",
    metrics: [
      { label: "Default rate", value: "12%" },
      { label: "Overrides", value: "3" },
      { label: "Protected lanes", value: "8" },
      { label: "Review due", value: "Quarterly" },
    ],
    highlights: [
      "Keep commission aligned with market competitiveness.",
      "Use overrides carefully on strategic accounts.",
      "Review protected margins on high-pressure lanes.",
    ],
  },
  "settings/verification": {
    eyebrow: "Verification Settings",
    title: "Configure automatic and manual approval rules",
    description:
      "Verification settings control how carriers and suppliers pass through trust and compliance gates.",
    metrics: [
      { label: "Mode", value: "Hybrid" },
      { label: "Auto checks", value: "7" },
      { label: "Manual steps", value: "3" },
      { label: "Avg. review", value: "36 min" },
    ],
    highlights: [
      "Balance automation speed with compliance quality.",
      "Use manual steps only where fraud risk is higher.",
      "Keep supplier and carrier trust signals consistent.",
    ],
  },
  "settings/payment": {
    eyebrow: "Payment Settings",
    title: "Control payout schedules and finance rules",
    description:
      "Payment settings shape how money moves through invoices, settlements, and carrier release cycles.",
    metrics: [
      { label: "Payout mode", value: "Weekly" },
      { label: "Gateways", value: "2" },
      { label: "Hold rules", value: "4" },
      { label: "Finance alerts", value: "Enabled" },
    ],
    highlights: [
      "Use hold rules to block risky releases automatically.",
      "Keep payout cadence predictable for carriers.",
      "Align invoice timing with supplier payment expectations.",
    ],
  },
  "settings/notifications": {
    eyebrow: "Notification Settings",
    title: "Manage carrier and supplier alerts across channels",
    description:
      "Notification rules control platform communication for approvals, payouts, and shipment events.",
    metrics: [
      { label: "Email alerts", value: "Enabled" },
      { label: "SMS alerts", value: "Enabled" },
      { label: "Templates", value: "26" },
      { label: "Critical alerts", value: "8" },
    ],
    highlights: [
      "Keep critical shipment and finance alerts immediate.",
      "Use channel rules to reduce unnecessary noise.",
      "Match alert tone and timing to user role.",
    ],
  },
  "settings/api": {
    eyebrow: "API Settings",
    title: "Control API configuration and integration keys",
    description:
      "API settings are the control layer for backend integrations, partners, and automation endpoints.",
    metrics: [
      { label: "Active keys", value: "5" },
      { label: "Partner integrations", value: "3" },
      { label: "Rotations due", value: "1" },
      { label: "Webhook health", value: "99.8%" },
    ],
    highlights: [
      "Rotate keys before partner access becomes a risk.",
      "Keep webhook reliability visible for operations.",
      "Audit every integration touching finance or dispatch data.",
    ],
  },
};

export default async function AdminDynamicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");

  const content =
    pageContent[key] ??
    {
      eyebrow: "Admin Section",
      title: "This premium admin page is ready for expansion",
      description:
        "The route exists and is wired into the premium admin system. It can now be turned into a full production page with real data and workflows.",
      metrics: [
        { label: "Status", value: "Ready" },
        { label: "Route", value: `/${key}` },
        { label: "Design", value: "Premium" },
        { label: "Next step", value: "Data wiring" },
      ],
      highlights: [
        "Use this section as the base for real operational workflows.",
        "Connect the page to live backend data when the UI foundation is approved.",
        "Add tables, charts, and actions based on the section priority.",
      ],
    };

  return <AdminSectionPage {...content} />;
}
