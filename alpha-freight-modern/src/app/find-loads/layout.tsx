import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.findLoads;

export default function FindLoadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
