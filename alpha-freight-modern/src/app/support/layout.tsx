import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.support;

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
