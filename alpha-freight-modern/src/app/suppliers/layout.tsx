import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.suppliers;

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
