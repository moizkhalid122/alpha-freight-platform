import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.toolsHub;

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
