import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.releases;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
