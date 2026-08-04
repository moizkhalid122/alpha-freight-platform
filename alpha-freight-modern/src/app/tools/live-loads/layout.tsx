import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.liveLoads;

export default function LiveLoadsToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
