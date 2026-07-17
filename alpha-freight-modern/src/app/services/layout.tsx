import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.services;

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
