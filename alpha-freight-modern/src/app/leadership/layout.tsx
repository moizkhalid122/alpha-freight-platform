import { airDisplayFont, airSerifFont } from "@/lib/air-fonts";
import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.leadership;

export default function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${airDisplayFont.variable} ${airSerifFont.variable}`}>{children}</div>;
}
