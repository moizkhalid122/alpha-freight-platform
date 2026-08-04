import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.availableLoads;

export default function AvailableLoadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
