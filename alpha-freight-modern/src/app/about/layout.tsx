import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.about;

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
