import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.postLoads;

export default function SupplierSignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
