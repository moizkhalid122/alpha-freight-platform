import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.pricing;

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
