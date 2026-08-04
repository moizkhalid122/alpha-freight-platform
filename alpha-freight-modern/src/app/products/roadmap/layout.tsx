import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.roadmap;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
