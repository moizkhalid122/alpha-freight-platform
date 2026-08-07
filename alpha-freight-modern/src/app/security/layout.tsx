import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.securityCentre;

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
