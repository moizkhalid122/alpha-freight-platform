import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.knowledgeBase;

export default function KnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
