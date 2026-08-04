import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.sevenDayPayouts;

export default function SevenDayPayoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
