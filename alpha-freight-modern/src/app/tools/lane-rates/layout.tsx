import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.laneRates;

export default function LaneRatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
