import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.backhaulFinder;

export default function BackhaulToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
