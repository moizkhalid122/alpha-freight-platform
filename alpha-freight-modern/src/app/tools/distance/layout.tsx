import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.distanceCalculator;

export default function DistanceToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
