import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Rates | Live UK Freight Pricing | Alpha Freight",
  description:
    "Live freight market rates, lane pricing intelligence, and fuel-adjusted indices for UK road freight. Price loads with confidence on Alpha Freight.",
};

export default function MarketRatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
