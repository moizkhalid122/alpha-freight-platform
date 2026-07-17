import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.partners;

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
