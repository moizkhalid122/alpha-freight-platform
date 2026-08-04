import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.solution;

export default function SolutionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
