import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.feedback;

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
