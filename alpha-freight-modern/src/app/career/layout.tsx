import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.career;

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
