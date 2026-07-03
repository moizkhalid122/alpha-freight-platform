import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Route Optimizer | AI Fuel & Time Saving | Alpha Freight",
  description:
    "Alpha Freight Route Optimizer uses AI to sequence multi-stop lanes, cut deadhead miles, reduce fuel spend, and deliver precise ETAs for UK carriers and fleets.",
};

export default function RouteOptimizerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
