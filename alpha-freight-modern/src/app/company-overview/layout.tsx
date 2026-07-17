import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.companyOverview;

export default function CompanyOverviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
