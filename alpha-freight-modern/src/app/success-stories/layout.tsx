import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.successStories;

export default function SuccessStoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
