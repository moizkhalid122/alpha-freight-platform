/** Commercial Director role brief — used by AI task + motivation generation. */
export const COMMERCIAL_DIRECTOR_ROLE_BRIEF = {
  commercialDirector: [
    "Sales growth with UK suppliers (shippers) and carriers (forwarders)",
    "Build commercial relationships — calls, meetings, face-to-face deals",
    "Secure contracts and partnership agreements",
    "Revenue growth across the 44-stream plan",
    "Invite prospects to platform, convert to first load",
  ],
  operationsSupport: [
    "Coordinate with operations on loads, supplier/carrier delivery",
    "Remove blockers so service delivery stays on time",
    "Escalate at-risk loads without running day-to-day ops alone",
  ],
  fundingFinance: [
    "Discuss funding options with lenders/investors when needed",
    "Support company financial plan — salaries, runway, revenue targets",
    "Track gap to monthly revenue target and act on it",
  ],
} as const;

export const DAILY_TASK_LIMIT = 5;

export const TASK_CATEGORIES = [
  "sales",
  "relationships",
  "contracts",
  "funding",
  "operations",
  "revenue",
] as const;

export type CommercialDirectorTaskCategory =
  | (typeof TASK_CATEGORIES)[number]
  | "ai"
  | "manual";
