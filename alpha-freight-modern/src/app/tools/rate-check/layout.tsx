import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.rateCheck;

export default function RateCheckToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
