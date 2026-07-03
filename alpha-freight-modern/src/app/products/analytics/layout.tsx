import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics Dashboard | Data-Driven Freight Insights | Alpha Freight",
  description:
    "Alpha Freight Analytics Dashboard surfaces KPIs, carrier scorecards, lane intelligence, and financial reporting in one enterprise command center.",
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
