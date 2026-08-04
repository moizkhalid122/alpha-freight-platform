import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.supplierPortal;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
