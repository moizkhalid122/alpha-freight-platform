import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs | Integrate Logistics Into Your App | Alpha Freight",
  description:
    "Alpha Freight REST API, webhooks, and SDKs for load posting, carrier matching, tracking, and payments. Build logistics into your product.",
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
