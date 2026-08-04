import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.blog;

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
