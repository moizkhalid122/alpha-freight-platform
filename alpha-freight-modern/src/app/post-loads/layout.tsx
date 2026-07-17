import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.postLoads;

export default function PostLoadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
