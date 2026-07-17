import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.technology;

export default function TechnologyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
