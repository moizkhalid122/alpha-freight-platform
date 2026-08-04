import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.awards;

export default function AwardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
